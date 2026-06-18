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
