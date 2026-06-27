-- ==========================================
-- 07_seed_more_properties.sql
-- ユーザーあたり2件、合計10件の物件を追加するシードデータ
-- ==========================================

DO $$
DECLARE
  u1 uuid;
  u2 uuid;
  u3 uuid;
  u4 uuid;
  u5 uuid;
  prop_id uuid;
BEGIN
  -- 各テストユーザーのIDを取得
  SELECT id INTO u1 FROM auth.users WHERE email = 'test1@example.com' LIMIT 1;
  SELECT id INTO u2 FROM auth.users WHERE email = 'test2@example.com' LIMIT 1;
  SELECT id INTO u3 FROM auth.users WHERE email = 'test3@example.com' LIMIT 1;
  SELECT id INTO u4 FROM auth.users WHERE email = 'test4@example.com' LIMIT 1;
  SELECT id INTO u5 FROM auth.users WHERE email = 'test5@example.com' LIMIT 1;

  -- ==========================================
  -- test1@example.com
  -- ==========================================
  IF u1 IS NOT NULL THEN
    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u1, '山林のプライベートサウナ用地', '大自然の中でテントサウナを楽しむための森のスペースです。', '山梨県道志村', 35.495, 139.043, 6000, ARRAY['サウナ', '山林', 'キャンプ'], 'ゴミは持ち帰り', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://picsum.photos/seed/' || prop_id::text || '/800/600', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u1, '商店街の空き店舗前スペース', 'ポップアップストアやキッチンカーに最適な路面スペース。', '東京都杉並区', 35.706, 139.649, 4500, ARRAY['店舗', 'イベント'], '夜間の騒音注意', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://picsum.photos/seed/' || prop_id::text || '/800/600', 0);
  END IF;

  -- ==========================================
  -- test2@example.com
  -- ==========================================
  IF u2 IS NOT NULL THEN
    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u2, '海辺のヨガテラス', '波の音を聞きながらヨガができるウッドデッキ。', '千葉県一宮町', 35.373, 140.395, 2500, ARRAY['海', 'ヨガ', '絶景'], '施設内の備品は丁寧にお使いください', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://picsum.photos/seed/' || prop_id::text || '/800/600', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u2, '農家さん直伝！本格貸し農園', '農具の貸し出しあり。週末農業を始めたい方に。', '埼玉県深谷市', 36.198, 139.281, 1000, ARRAY['畑', '農業体験'], '指定エリア外の立ち入り禁止', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://picsum.photos/seed/' || prop_id::text || '/800/600', 0);
  END IF;

  -- ==========================================
  -- test3@example.com
  -- ==========================================
  IF u3 IS NOT NULL THEN
    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u3, '古民家裏の竹林', '竹細工用の竹の伐採や、写真撮影に。', '京都府長岡京市', 34.925, 135.696, 3000, ARRAY['静寂', '撮影', '竹林'], 'たけのこの無断採集は厳禁', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://picsum.photos/seed/' || prop_id::text || '/800/600', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u3, '駅チカ大型屋上駐車場', '撮影やイベント、フリマに使える広い屋上です。', '神奈川県川崎市', 35.531, 139.697, 8000, ARRAY['駐車場', 'イベント', '広場'], '火気厳禁', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://picsum.photos/seed/' || prop_id::text || '/800/600', 0);
  END IF;

  -- ==========================================
  -- test4@example.com
  -- ==========================================
  IF u4 IS NOT NULL THEN
    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u4, '星降る丘のグランピングサイト', '道具不要で楽しめるラグジュアリーなキャンプスペース。', '長野県阿智村', 35.438, 137.734, 18000, ARRAY['星空', 'グランピング', '絶景'], '22時以降はクワイエットタイム', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://picsum.photos/seed/' || prop_id::text || '/800/600', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u4, '都心アクセスの月極駐輪場', '一時利用も可能な駅徒歩3分の駐輪・バイク置き場。', '東京都中野区', 35.707, 139.666, 200, ARRAY['駐車場', '駅近'], '盗難の責任は負いません', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://picsum.photos/seed/' || prop_id::text || '/800/600', 0);
  END IF;

  -- ==========================================
  -- test5@example.com
  -- ==========================================
  IF u5 IS NOT NULL THEN
    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u5, '昭和レトロな空き家', '映画やドラマの撮影に最適な手つかずの昭和建築。', '群馬県桐生市', 36.416, 139.336, 12000, ARRAY['空き家', 'レトロ', '撮影'], '建物の破損に注意してください', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://picsum.photos/seed/' || prop_id::text || '/800/600', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u5, '川遊びができるBBQ河川敷', '浅瀬で子どもも遊べるBBQ専用スペース。', '岐阜県美濃市', 35.545, 136.908, 4000, ARRAY['川', 'BBQ', 'キャンプ'], '増水時は利用禁止', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://picsum.photos/seed/' || prop_id::text || '/800/600', 0);
  END IF;

END $$;
