DO $$
DECLARE
  u1 uuid;
  u2 uuid;
  u3 uuid;
  u4 uuid;
  u5 uuid;
  p_id uuid;
BEGIN
  -- テストユーザーの取得
  SELECT id INTO u1 FROM auth.users WHERE email = 'test1@example.com' LIMIT 1;
  SELECT id INTO u2 FROM auth.users WHERE email = 'test2@example.com' LIMIT 1;
  SELECT id INTO u3 FROM auth.users WHERE email = 'test3@example.com' LIMIT 1;
  SELECT id INTO u4 FROM auth.users WHERE email = 'test4@example.com' LIMIT 1;
  SELECT id INTO u5 FROM auth.users WHERE email = 'test5@example.com' LIMIT 1;

  -- 1. テントサイトの画像を確実に表示されるものに修正（ID検索ではなく直接）
  UPDATE public.property_images 
  SET image_url = 'https://images.unsplash.com/photo-1504280390224-ddca36ce669f?auto=format&fit=crop&q=80&w=800'
  WHERE image_url LIKE '%1537565266752%';
  
  -- 万が一それでも出ない時のためのバックアップ用picsum画像
  UPDATE public.property_images 
  SET image_url = 'https://picsum.photos/seed/tentsite/800/600'
  WHERE image_url LIKE '%1504280390224%';

  -- ==========================================
  -- 追加10物件の登録 (様々なユーザーに割り当て)
  -- 画像には表示が確実な https://picsum.photos/seed/{文字列}/800/600 を使用します
  -- ==========================================

  -- 物件1 (test1)
  IF u1 IS NOT NULL THEN
      INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
      VALUES (gen_random_uuid(), u1, '都心の屋上貸し切りスペース', '東京タワーが見えるビルの屋上です。ヨガや撮影に。', '東京都港区', 35.658, 139.745, 8000, ARRAY['屋上', '撮影', '絶景'], '火気厳禁、騒音注意', true) RETURNING id INTO p_id;
      INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (p_id, 'https://picsum.photos/seed/rooftop/800/600', 0);
  END IF;

  -- 物件2 (test2)
  IF u2 IS NOT NULL THEN
      INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
      VALUES (gen_random_uuid(), u2, '森の中のウッドデッキ', 'マイナスイオンたっぷりの森林浴ができるウッドデッキです。', '長野県軽井沢町', 36.345, 138.632, 4000, ARRAY['森', 'リラックス', 'ウッドデッキ'], 'ゴミは必ず持ち帰り', true) RETURNING id INTO p_id;
      INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (p_id, 'https://picsum.photos/seed/forestdeck/800/600', 0);
  END IF;

  -- 物件3 (test3)
  IF u3 IS NOT NULL THEN
      INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
      VALUES (gen_random_uuid(), u3, '川沿いの広々ドッグラン', '柵付きの天然芝ドッグラン。愛犬と一緒にのんびりできます。', '埼玉県長瀞町', 36.096, 139.115, 2500, ARRAY['ドッグラン', 'ペット可', '川'], 'フンの始末をお願いします', true) RETURNING id INTO p_id;
      INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (p_id, 'https://picsum.photos/seed/dogrun/800/600', 0);
  END IF;

  -- 物件4 (test4)
  IF u4 IS NOT NULL THEN
      INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
      VALUES (gen_random_uuid(), u4, '古民家の離れ（アトリエ利用）', '築百年の古民家の離れです。絵画や工作のアトリエとして。', '京都府京都市', 35.011, 135.768, 3000, ARRAY['古民家', 'アトリエ', '静か'], '施設内の備品の持ち出し禁止', true) RETURNING id INTO p_id;
      INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (p_id, 'https://picsum.photos/seed/atelier/800/600', 0);
  END IF;

  -- 物件5 (test5)
  IF u5 IS NOT NULL THEN
      INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
      VALUES (gen_random_uuid(), u5, '駅チカ・イベント用空き地', '駅徒歩2分。キッチンカーの出店やフリマに最適な更地です。', '大阪府大阪市', 34.702, 135.495, 10000, ARRAY['駅近', 'イベント', 'キッチンカー'], '近隣からのクレーム時は即撤収', true) RETURNING id INTO p_id;
      INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (p_id, 'https://picsum.photos/seed/eventplace/800/600', 0);
  END IF;

  -- 物件6 (test1)
  IF u1 IS NOT NULL THEN
      INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
      VALUES (gen_random_uuid(), u1, '週末農業体験 貸し農園区画', '農具の貸し出しあり。週末だけの家庭菜園にどうぞ。', '千葉県印西市', 35.801, 140.117, 1500, ARRAY['畑', '農業', '体験'], '無農薬のみ可', true) RETURNING id INTO p_id;
      INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (p_id, 'https://picsum.photos/seed/farm2/800/600', 0);
  END IF;

  -- 物件7 (test2)
  IF u2 IS NOT NULL THEN
      INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
      VALUES (gen_random_uuid(), u2, '海が見える高台の駐車場', 'サーファーに人気のスポット近くの駐車場。キャンピングカーOK。', '千葉県一宮町', 35.372, 140.370, 2000, ARRAY['駐車場', '海', 'キャンピングカー'], '車中泊可能、トイレなし', true) RETURNING id INTO p_id;
      INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (p_id, 'https://picsum.photos/seed/parking/800/600', 0);
  END IF;

  -- 物件8 (test3)
  IF u3 IS NOT NULL THEN
      INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
      VALUES (gen_random_uuid(), u3, '竹林の中の瞑想スペース', '手入れされた竹林。ヨガや瞑想に最適な静寂な空間です。', '静岡県伊豆市', 34.975, 138.944, 3500, ARRAY['竹林', 'ヨガ', 'リラックス'], '大声を出すイベントは不可', true) RETURNING id INTO p_id;
      INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (p_id, 'https://picsum.photos/seed/bamboo/800/600', 0);
  END IF;

  -- 物件9 (test4)
  IF u4 IS NOT NULL THEN
      INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
      VALUES (gen_random_uuid(), u4, 'レトロな元・駄菓子屋スペース', '撮影スタジオとして利用可能。昭和レトロな雰囲気がそのまま残っています。', '東京都荒川区', 35.736, 139.782, 6000, ARRAY['撮影', 'レトロ', '室内'], '現状復帰厳守', true) RETURNING id INTO p_id;
      INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (p_id, 'https://picsum.photos/seed/retro/800/600', 0);
  END IF;

  -- 物件10 (test5)
  IF u5 IS NOT NULL THEN
      INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
      VALUES (gen_random_uuid(), u5, '星空観察専用・山頂スペース', '周囲に街灯がないため、天体観測に最高のスポットです。', '長野県阿智村', 35.438, 137.733, 5000, ARRAY['星空', '絶景', 'キャンプ'], '火気厳禁', true) RETURNING id INTO p_id;
      INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (p_id, 'https://picsum.photos/seed/stars/800/600', 0);
  END IF;

END $$;
