-- ==========================================
-- LinkSpace: フェーズ7 プロフィール・信頼性向上機能 追加SQL
-- ==========================================

-- 1. users テーブルに bio カラムを追加 (存在しない場合のみ)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='bio'
    ) THEN
        ALTER TABLE public.users ADD COLUMN bio TEXT;
    END IF;
END $$;
