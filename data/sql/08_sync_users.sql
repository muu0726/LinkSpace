-- ==========================================
-- 08_sync_users.sql
-- ユーザーが「ゲスト」と表示される問題を修正するスクリプト
-- ==========================================

DO $$
DECLARE
  r RECORD;
  idx INT := 1;
BEGIN
  -- 1. auth.users (ログイン管理) に存在するが、public.users (プロフィール管理) に存在しないユーザーを同期
  --    ※CSVから直接インポートした場合など、トリガーが発動しなかった際の復旧
  FOR r IN SELECT id, email FROM auth.users LOOP
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = r.id) THEN
      INSERT INTO public.users (id, email, name, avatar_url)
      VALUES (
        r.id, 
        r.email, 
        'ホストユーザー ' || idx, 
        CASE (abs(hashtext(r.id::text)) % 5)
          WHEN 0 THEN 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=150'
          WHEN 1 THEN 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=150'
          WHEN 2 THEN 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=80&w=150'
          WHEN 3 THEN 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&q=80&w=150'
          ELSE 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?auto=format&fit=crop&q=80&w=150'
        END
      );
    ELSE
      -- すでに存在する場合でも、名前が設定されていない場合は設定する
      UPDATE public.users 
      SET name = 'ホストユーザー ' || idx
      WHERE id = r.id AND (name IS NULL OR name = '' OR name = 'ゲスト');
    END IF;
    idx := idx + 1;
  END LOOP;

  -- 2. 物件(properties)のオーナーとして登録されているが、public.users に存在しない架空のIDに対してレコードを作成
  --    ※初期のシードデータなどで、ランダムなUUIDを使って物件が作られていた場合の復旧
  FOR r IN SELECT DISTINCT owner_id FROM public.properties WHERE owner_id NOT IN (SELECT id FROM public.users) LOOP
    INSERT INTO public.users (id, email, name, avatar_url)
    VALUES (
      r.owner_id, 
      'dummy_host_' || substr(r.owner_id::text, 1, 8) || '@example.com', 
      'デモホスト', 
      CASE (abs(hashtext(r.owner_id::text)) % 5)
        WHEN 0 THEN 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=150'
        WHEN 1 THEN 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=150'
        WHEN 2 THEN 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=80&w=150'
        WHEN 3 THEN 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&q=80&w=150'
        ELSE 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?auto=format&fit=crop&q=80&w=150'
      END
    );
  END LOOP;

END $$;
