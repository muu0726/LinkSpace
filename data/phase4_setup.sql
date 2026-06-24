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
