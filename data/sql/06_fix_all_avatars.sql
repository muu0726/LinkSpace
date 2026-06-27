-- ==========================================
-- 06_fix_all_avatars.sql
-- 初期データの全ユーザーに動物アイコンを割り当てる修正
-- ==========================================

DO $$
BEGIN
  -- すでにavatar_urlが設定されていない、またはデフォルトのユーザーすべてに対して
  -- IDからハッシュを計算し、5種類の動物アイコンをランダムに（かつ固定で）割り当てる
  UPDATE public.users
  SET avatar_url = 
    CASE (abs(hashtext(id::text)) % 5)
      WHEN 0 THEN 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=150' -- 犬
      WHEN 1 THEN 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=150' -- 猫
      WHEN 2 THEN 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=80&w=150' -- ライオン
      WHEN 3 THEN 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&q=80&w=150' -- パンダ
      ELSE 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?auto=format&fit=crop&q=80&w=150' -- ペンギン
    END
  WHERE avatar_url IS NULL OR avatar_url = '';

END $$;
