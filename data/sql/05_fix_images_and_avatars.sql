-- ==========================================
-- 05_fix_images_and_avatars.sql
-- 物件画像が見えない問題を修正＆ユーザーに動物アイコンを設定
-- ==========================================

DO $$
DECLARE
  u1 uuid;
  u2 uuid;
  u3 uuid;
  u4 uuid;
  u5 uuid;
BEGIN
  -- 各テストユーザーのIDを取得
  SELECT id INTO u1 FROM auth.users WHERE email = 'test1@example.com' LIMIT 1;
  SELECT id INTO u2 FROM auth.users WHERE email = 'test2@example.com' LIMIT 1;
  SELECT id INTO u3 FROM auth.users WHERE email = 'test3@example.com' LIMIT 1;
  SELECT id INTO u4 FROM auth.users WHERE email = 'test4@example.com' LIMIT 1;
  SELECT id INTO u5 FROM auth.users WHERE email = 'test5@example.com' LIMIT 1;

  -- 1. ユーザーアイコン（avatar_url）を動物画像に更新
  IF u1 IS NOT NULL THEN
    UPDATE public.users 
    SET avatar_url = 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=150' -- 犬
    WHERE id = u1;
  END IF;

  IF u2 IS NOT NULL THEN
    UPDATE public.users 
    SET avatar_url = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=150' -- 猫
    WHERE id = u2;
  END IF;

  IF u3 IS NOT NULL THEN
    UPDATE public.users 
    SET avatar_url = 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=80&w=150' -- ライオン
    WHERE id = u3;
  END IF;

  IF u4 IS NOT NULL THEN
    UPDATE public.users 
    SET avatar_url = 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&q=80&w=150' -- パンダ
    WHERE id = u4;
  END IF;

  IF u5 IS NOT NULL THEN
    UPDATE public.users 
    SET avatar_url = 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?auto=format&fit=crop&q=80&w=150' -- ペンギン
    WHERE id = u5;
  END IF;

  -- 2. 表示されない（Unsplashのリンク切れなど）画像を一括で確実に表示されるPicsumシード画像に更新
  -- 物件IDをシードとして用いることで、物件ごとに異なる一意の画像を表示させます
  UPDATE public.property_images
  SET image_url = 'https://picsum.photos/seed/' || property_id::text || '/800/600';

END $$;
