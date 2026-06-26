-- ==========================================
-- Auto-generated consolidated SQL file
-- ==========================================

-- ==========================================
-- Source: phase1_setup.sql
-- ==========================================

-- 1. users テーブルの作成
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS (Row Level Security) の有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. RLSポリシーの設定（自分のプロフィールのみ閲覧・更新可能）
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- 4. auth.users 作成時に public.users にレコードを自動作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. トリガーの登録
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- Source: phase2_setup.sql
-- ==========================================

-- 1. properties テーブルの作成
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  address text NOT NULL,
  latitude double precision,
  longitude double precision,
  price_per_day integer NOT NULL DEFAULT 0,
  tags text[] DEFAULT '{}',
  rules text,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. property_images テーブルの作成
CREATE TABLE IF NOT EXISTS public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. favorites テーブルの作成 (お気に入り)
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, property_id)
);

-- 4. unavailabilities テーブルの作成 (カレンダー貸出不可日)
CREATE TABLE IF NOT EXISTS public.unavailabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLSの有効化
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unavailabilities ENABLE ROW LEVEL SECURITY;

-- 【RLSポリシー: properties】
CREATE POLICY "Anyone can view published or owned properties" 
ON public.properties FOR SELECT 
USING (is_published = true OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create properties" 
ON public.properties FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own properties" 
ON public.properties FOR UPDATE 
TO authenticated 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own properties" 
ON public.properties FOR DELETE 
TO authenticated 
USING (auth.uid() = owner_id);


-- 【RLSポリシー: property_images】
CREATE POLICY "Anyone can view property images" 
ON public.property_images FOR SELECT 
USING (true);

CREATE POLICY "Owners can manage property images" 
ON public.property_images FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- 【RLSポリシー: favorites】
CREATE POLICY "Users can manage own favorites" 
ON public.favorites FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 【RLSポリシー: unavailabilities】
CREATE POLICY "Anyone can view unavailabilities" 
ON public.unavailabilities FOR SELECT 
USING (true);

CREATE POLICY "Owners can manage unavailabilities" 
ON public.unavailabilities FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = unavailabilities.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- 5. Storage バケットの作成とポリシー設定 (物件画像用)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view property-images bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Users can update/delete their own property-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'property-images' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own property-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-images' AND auth.uid() = owner);


-- ==========================================
-- Source: add_pv_feature.sql
-- ==========================================

-- ==========================================
-- LinkSpace: 物件PVカウント機能 追加SQL
-- ==========================================

-- 1. properties テーブルに page_views カラムを追加 (存在しない場合のみ)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='properties' AND column_name='page_views') THEN
        ALTER TABLE public.properties ADD COLUMN page_views integer DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- 2. PVを安全にインクリメント（+1）するための関数を作成
CREATE OR REPLACE FUNCTION public.increment_page_view(property_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- この関数は作成者の権限で実行され、RLSをバイパスしてカウントを更新できる
AS $$
BEGIN
  UPDATE public.properties
  SET page_views = page_views + 1
  WHERE id = property_id_param;
END;
$$;

-- 3. （任意）関数の実行権限をすべてのユーザーに付与（未ログインでもPVはカウントするため）
GRANT EXECUTE ON FUNCTION public.increment_page_view(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.increment_page_view(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_page_view(uuid) TO authenticated;


-- ==========================================
-- Source: fix_pv.sql
-- ==========================================

-- ==========================================
-- LinkSpace Fix: Add PV count support
-- ==========================================

-- 1. properties テーブルに page_views カラムを追加 (存在しない場合のみ)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS page_views INTEGER DEFAULT 0;

-- 2. PVをインクリメントするRPC関数を作成
CREATE OR REPLACE FUNCTION public.increment_page_view(property_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.properties
  SET page_views = page_views + 1
  WHERE id = property_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- Source: phase3_setup.sql
-- ==========================================

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


-- F. 予約キャンセル処理 (キャンセルポリシーの適用)
CREATE OR REPLACE FUNCTION public.cancel_reservation(p_reservation_id UUID)
RETURNS VOID AS $$
DECLARE
    v_reservation RECORD;
    v_property_owner_id UUID;
    v_diff_days INTEGER;
    v_refund_amount INTEGER;
    v_host_fee INTEGER;
BEGIN
    -- 予約情報の取得（行ロック）
    SELECT r.*, p.owner_id INTO v_reservation
    FROM public.reservations r
    JOIN public.properties p ON r.property_id = p.id
    WHERE r.id = p_reservation_id
    FOR UPDATE OF r;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reservation not found';
    END IF;

    -- すでに完了・キャンセルの場合はエラー
    IF v_reservation.status NOT IN ('pending', 'approved') THEN
        RAISE EXCEPTION 'Reservation cannot be cancelled from current status: %', v_reservation.status;
    END IF;

    v_property_owner_id := v_reservation.owner_id;

    -- 日数差分の計算（日本時間を想定し、シンプルに日付の差分を取得）
    v_diff_days := (v_reservation.start_date::date - CURRENT_DATE);
    
    IF v_reservation.status = 'pending' THEN
        -- 承認前のリクエスト取り下げなら全額返金
        v_refund_amount := v_reservation.total_price;
        v_host_fee := 0;
    ELSE
        -- 承認済みの場合、キャンセルポリシー適用
        IF v_diff_days >= 3 THEN
            -- 3日前: 100%返金
            v_refund_amount := v_reservation.total_price;
            v_host_fee := 0;
        ELSIF v_diff_days >= 1 THEN
            -- 前日・2日前: 50%返金
            v_refund_amount := (v_reservation.total_price * 0.5)::INTEGER;
            v_host_fee := v_reservation.total_price - v_refund_amount;
        ELSE
            -- 当日以降: 0%返金
            v_refund_amount := 0;
            v_host_fee := v_reservation.total_price;
        END IF;
    END IF;

    -- 借り手への返金処理
    IF v_refund_amount > 0 THEN
        UPDATE public.users
        SET points_balance = points_balance + v_refund_amount
        WHERE id = v_reservation.borrower_id;

        INSERT INTO public.transactions (user_id, amount, type, reservation_id)
        VALUES (v_reservation.borrower_id, v_refund_amount, 'refund', p_reservation_id);
    END IF;

    -- ホストへのキャンセル料加算（ペナルティ分）
    IF v_host_fee > 0 THEN
        UPDATE public.users
        SET points_balance = points_balance + v_host_fee
        WHERE id = v_property_owner_id;

        INSERT INTO public.transactions (user_id, amount, type, reservation_id)
        VALUES (v_property_owner_id, v_host_fee, 'reward', p_reservation_id);
    END IF;

    -- ステータスをキャンセルに更新
    UPDATE public.reservations
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_reservation_id;

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


-- ==========================================
-- Source: phase4_setup.sql
-- ==========================================

-- ==========================================
-- LinkSpace Phase 4: Usage Guide, Reviews, Notifications, Q&A
-- ==========================================

-- 1. propertiesテーブルに access_guide を追加
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS access_guide TEXT;

-- 2. reservationsテーブルにチェックイン・チェックアウト時刻を追加
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMP WITH TIME ZONE;

-- 3. reviewsテーブル
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. questionsテーブル
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    questioner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. answersテーブル
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answerer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. notificationsテーブル
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('request', 'approve', 'reject', 'cancel', 'review_prompt', 'question', 'answer')),
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS設定 (reviews, questions, answers, notifications)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- reviews: 誰でも閲覧可能。投稿はreviewer_idが自分であること
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- questions: 誰でも閲覧可能。投稿は自分が質問者
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Users can ask questions" ON public.questions FOR INSERT WITH CHECK (auth.uid() = questioner_id);

-- answers: 誰でも閲覧可能。投稿は自分が回答者(ホスト)
CREATE POLICY "Anyone can view answers" ON public.answers FOR SELECT USING (true);
CREATE POLICY "Hosts can answer questions" ON public.answers FOR INSERT WITH CHECK (auth.uid() = answerer_id);

-- notifications: 自分宛ての通知のみ閲覧可能。システム(トリガー)からのInsertはSECURITY DEFINERにより制限回避
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications (read)" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 7. リアルタイム通知のためのRealtime有効化 (すでに設定されている可能性もありますが念のため)
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications; (必要に応じてSupabase管理画面から設定してください)

-- 8. 通知用のトリガー関数 (予約ステータス変更)
CREATE OR REPLACE FUNCTION public.handle_reservation_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- ステータスが変更された場合 または 新規作成時
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
        
        -- 新規リクエスト (pending)
        IF NEW.status = 'pending' THEN
            -- 貸し手へ通知
            INSERT INTO public.notifications (user_id, type, message, link_url)
            SELECT owner_id, 'request', '新しい予約リクエストが届きました。', '/mypage'
            FROM public.properties WHERE id = NEW.property_id;
        END IF;

        -- 承認 (approved)
        IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status = 'pending' THEN
            -- 借り手へ通知
            INSERT INTO public.notifications (user_id, type, message, link_url)
            VALUES (NEW.borrower_id, 'approve', '予約リクエストが承認されました。利用ガイドを確認してください。', '/mypage');
        END IF;

        -- 却下 (rejected)
        IF TG_OP = 'UPDATE' AND NEW.status = 'rejected' AND OLD.status = 'pending' THEN
            INSERT INTO public.notifications (user_id, type, message, link_url)
            VALUES (NEW.borrower_id, 'reject', '予約リクエストが却下されました。ポイントは返還されています。', '/mypage');
        END IF;

        -- キャンセル (cancelled)
        IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
            -- 貸し手へ通知
            INSERT INTO public.notifications (user_id, type, message, link_url)
            SELECT owner_id, 'cancel', '予約がキャンセルされました。', '/mypage'
            FROM public.properties WHERE id = NEW.property_id;
            
            -- 借り手へ通知
            INSERT INTO public.notifications (user_id, type, message, link_url)
            VALUES (NEW.borrower_id, 'cancel', '予約をキャンセルしました。', '/mypage');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成
DROP TRIGGER IF EXISTS trg_reservation_status_changed ON public.reservations;
CREATE TRIGGER trg_reservation_status_changed
AFTER INSERT OR UPDATE OF status ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.handle_reservation_status_change();


-- ==========================================
-- Source: phase4_5_setup.sql
-- ==========================================

-- ==========================================
-- LinkSpace Phase 4.5: Avatars Bucket
-- ==========================================

-- 1. Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Setup RLS for the avatars bucket
-- Allow public access to view avatars
CREATE POLICY "Avatar images are publicly accessible." 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Anyone can upload an avatar." 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update their own avatars
CREATE POLICY "Anyone can update their own avatar." 
ON storage.objects FOR UPDATE
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );


-- ==========================================
-- Source: phase5_setup.sql
-- ==========================================

-- ==========================================
-- LinkSpace Phase 5: Admin & System Setup
-- ==========================================

-- 1. users テーブルに role と status を追加
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'));

-- 2. categories テーブルの作成
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS: categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" 
ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.categories FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- 初期カテゴリデータの投入
INSERT INTO public.categories (name) VALUES 
('キャンプ'), ('バーベキュー'), ('撮影ロケ地'), ('イベント'), ('駐車場'), ('農業・菜園')
ON CONFLICT (name) DO NOTHING;


-- 3. system_logs テーブルの作成
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  details JSONB,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS: system_logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system logs" 
ON public.system_logs FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

CREATE POLICY "Authenticated users can insert system logs" 
ON public.system_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);


-- 4. Admin Point Adjustment RPC
CREATE OR REPLACE FUNCTION public.admin_adjust_points(
  p_target_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT
) RETURNS VOID AS $$
DECLARE
  v_admin_role TEXT;
BEGIN
  -- 権限チェック
  SELECT role INTO v_admin_role FROM public.users WHERE id = auth.uid();
  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_amount = 0 THEN
    RAISE EXCEPTION 'Amount cannot be zero';
  END IF;

  -- 残高の更新
  UPDATE public.users
  SET points_balance = points_balance + p_amount
  WHERE id = p_target_user_id;

  -- トランザクション履歴の作成
  INSERT INTO public.transactions (
    user_id,
    amount,
    type
  ) VALUES (
    p_target_user_id,
    p_amount,
    'manual_adjustment'
  );
  
  -- ログに理由を残す
  INSERT INTO public.system_logs (level, message, details, user_id)
  VALUES ('info', 'Manual point adjustment by admin', json_build_object('target_user', p_target_user_id, 'amount', p_amount, 'reason', p_reason), auth.uid());

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. properties / property_images の RLS に admin 例外を追加
DROP POLICY IF EXISTS "Admins can do anything on properties" ON public.properties;
CREATE POLICY "Admins can do anything on properties"
ON public.properties FOR ALL
USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

DROP POLICY IF EXISTS "Admins can do anything on property_images" ON public.property_images;
CREATE POLICY "Admins can do anything on property_images"
ON public.property_images FOR ALL
USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- users テーブル自体をadminが管理できるようにする
CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admins can update users" 
ON public.users FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));


-- ==========================================
-- Source: fix_rls.sql
-- ==========================================

-- ==========================================
-- LinkSpace Phase 5: Fix Admin RLS Infinite Recursion
-- ==========================================

-- 1. admin判定を安全に行うためのSECURITY DEFINER関数を作成
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- RLSをバイパスしてroleを取得
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN coalesce(v_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. 既存の無限ループを起こすusersのポリシーを削除
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

-- 3. is_admin() を使って安全に再定義
CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update users" 
ON public.users FOR UPDATE 
USING (public.is_admin());

-- 4. categories, system_logs, properties, property_imagesのポリシーも更新
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" 
ON public.categories FOR ALL 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view system logs" ON public.system_logs;
CREATE POLICY "Admins can view system logs" 
ON public.system_logs FOR SELECT 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can do anything on properties" ON public.properties;
CREATE POLICY "Admins can do anything on properties"
ON public.properties FOR ALL
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can do anything on property_images" ON public.property_images;
CREATE POLICY "Admins can do anything on property_images"
ON public.property_images FOR ALL
USING (public.is_admin());


