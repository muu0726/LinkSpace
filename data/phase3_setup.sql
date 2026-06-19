-- ==========================================
-- LinkSpace Phase 3: Reservation & Point System
-- ==========================================

-- 1. users テーブルにポイント残高を追加
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points_balance INTEGER DEFAULT 0 NOT NULL;

-- 2. reservations テーブルの作成
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    borrower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS: reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reservations (as borrower)" 
ON public.reservations FOR SELECT 
USING (auth.uid() = borrower_id);

CREATE POLICY "Property owners can view reservations for their properties" 
ON public.reservations FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = reservations.property_id AND p.owner_id = auth.uid()
));

-- 3. transactions テーブルの作成
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- プラスなら増加、マイナスなら減少
    type TEXT NOT NULL CHECK (type IN ('initial_grant', 'payment_escrow', 'escrow_release', 'refund', 'reward', 'manual_adjustment')),
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS: transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);


-- ==========================================
-- 4. ポイント関連の RPC (ストアドプロシージャ)
-- ==========================================

-- A. 初期ポイント付与関数 (トリガー用)
CREATE OR REPLACE FUNCTION public.handle_new_user_points()
RETURNS TRIGGER AS $$
BEGIN
    -- usersテーブルにレコードが作成された直後にトランザクション記録と10万LP付与
    INSERT INTO public.transactions (user_id, amount, type)
    VALUES (NEW.id, 100000, 'initial_grant');
    
    UPDATE public.users
    SET points_balance = points_balance + 100000
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成 (users テーブルへの INSERT 時)
DROP TRIGGER IF EXISTS on_user_created_grant_points ON public.users;
CREATE TRIGGER on_user_created_grant_points
AFTER INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_points();


-- B. 予約リクエスト (エスクロー引き落とし)
CREATE OR REPLACE FUNCTION public.request_reservation(
    p_property_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_total_price INTEGER
) RETURNS UUID AS $$
DECLARE
    v_borrower_id UUID;
    v_current_balance INTEGER;
    v_reservation_id UUID;
BEGIN
    v_borrower_id := auth.uid();
    IF v_borrower_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 行ロックで残高を取得
    SELECT points_balance INTO v_current_balance
    FROM public.users
    WHERE id = v_borrower_id
    FOR UPDATE;

    IF v_current_balance < p_total_price THEN
        RAISE EXCEPTION 'Insufficient points';
    END IF;

    -- 残高を減らす (エスクロー)
    UPDATE public.users
    SET points_balance = points_balance - p_total_price
    WHERE id = v_borrower_id;

    -- 予約レコード作成
    INSERT INTO public.reservations (property_id, borrower_id, start_date, end_date, total_price, status)
    VALUES (p_property_id, v_borrower_id, p_start_date, p_end_date, p_total_price, 'pending')
    RETURNING id INTO v_reservation_id;

    -- 取引履歴作成
    INSERT INTO public.transactions (user_id, amount, type, reservation_id)
    VALUES (v_borrower_id, -p_total_price, 'payment_escrow', v_reservation_id);

    RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- C. 予約承認
CREATE OR REPLACE FUNCTION public.approve_reservation(p_reservation_id UUID)
RETURNS VOID AS $$
DECLARE
    v_owner_id UUID;
BEGIN
    -- 予約対象物件のオーナー確認
    SELECT p.owner_id INTO v_owner_id
    FROM public.reservations r
    JOIN public.properties p ON r.property_id = p.id
    WHERE r.id = p_reservation_id;

    IF auth.uid() != v_owner_id THEN
        RAISE EXCEPTION 'Not authorized to approve this reservation';
    END IF;

    -- ステータス更新
    UPDATE public.reservations
    SET status = 'approved', updated_at = NOW()
    WHERE id = p_reservation_id AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- D. 予約却下 (エスクロー返金)
CREATE OR REPLACE FUNCTION public.reject_reservation(p_reservation_id UUID)
RETURNS VOID AS $$
DECLARE
    v_owner_id UUID;
    v_borrower_id UUID;
    v_total_price INTEGER;
    v_status TEXT;
BEGIN
    -- 情報取得と行ロック
    SELECT r.borrower_id, r.total_price, r.status, p.owner_id
    INTO v_borrower_id, v_total_price, v_status, v_owner_id
    FROM public.reservations r
    JOIN public.properties p ON r.property_id = p.id
    WHERE r.id = p_reservation_id
    FOR UPDATE OF r;

    IF auth.uid() != v_owner_id THEN
        RAISE EXCEPTION 'Not authorized to reject this reservation';
    END IF;

    IF v_status != 'pending' THEN
        RAISE EXCEPTION 'Only pending reservations can be rejected';
    END IF;

    -- ステータス更新
    UPDATE public.reservations
    SET status = 'rejected', updated_at = NOW()
    WHERE id = p_reservation_id;

    -- 返金処理
    UPDATE public.users
    SET points_balance = points_balance + v_total_price
    WHERE id = v_borrower_id;

    -- 履歴追加
    INSERT INTO public.transactions (user_id, amount, type, reservation_id)
    VALUES (v_borrower_id, v_total_price, 'refund', p_reservation_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- E. 利用完了 (貸し手へのポイント付与)
-- （※実際の運用ではシステムバッチ等が呼び出すか、借り手のチェックアウトアクションで呼び出す）
CREATE OR REPLACE FUNCTION public.complete_reservation(p_reservation_id UUID)
RETURNS VOID AS $$
DECLARE
    v_owner_id UUID;
    v_total_price INTEGER;
    v_status TEXT;
BEGIN
    SELECT p.owner_id, r.total_price, r.status
    INTO v_owner_id, v_total_price, v_status
    FROM public.reservations r
    JOIN public.properties p ON r.property_id = p.id
    WHERE r.id = p_reservation_id
    FOR UPDATE OF r;

    IF v_status != 'approved' THEN
        RAISE EXCEPTION 'Only approved reservations can be completed';
    END IF;

    -- ステータス更新
    UPDATE public.reservations
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_reservation_id;

    -- 貸し手への報酬付与
    UPDATE public.users
    SET points_balance = points_balance + v_total_price
    WHERE id = v_owner_id;

    -- 履歴追加
    INSERT INTO public.transactions (user_id, amount, type, reservation_id)
    VALUES (v_owner_id, v_total_price, 'reward', p_reservation_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 5. 既存ユーザーへの 100,000 LP 一括付与マイグレーション
-- ==========================================
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM public.users WHERE points_balance = 0 LOOP
        UPDATE public.users
        SET points_balance = 100000
        WHERE id = user_record.id;
        
        INSERT INTO public.transactions (user_id, amount, type)
        VALUES (user_record.id, 100000, 'initial_grant');
    END LOOP;
END;
$$;
