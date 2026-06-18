DO $$
DECLARE
  test_user_id uuid;
  prop1_id uuid;
  prop2_id uuid;
  prop3_id uuid;
BEGIN
  -- テストユーザーのIDを取得
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test1@example.com' LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'test1@example.com が見つかりません。先にユーザーを作成してください。';
  END IF;

  -- 1件目: キャンプ用地
  INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
  VALUES (
    gen_random_uuid(), test_user_id, '富士山が見える広々キャンプ用地', '週末のキャンプに最適な広々とした土地です。夜は星空がきれいです。', '山梨県南都留郡富士河口湖町', 35.502, 138.751, 3000, ARRAY['キャンプ', '絶景', '星空'], '直火NG、ゴミ持ち帰り', true
  ) RETURNING id INTO prop1_id;

  INSERT INTO public.property_images (property_id, image_url, display_order)
  VALUES (prop1_id, 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=800', 0);

  -- 2件目: 貸し畑
  INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
  VALUES (
    gen_random_uuid(), test_user_id, '日当たり良好な週末貸し農園', '水道利用可能です。無農薬野菜の栽培などご自由にどうぞ。スコップ等の貸出あり。', '千葉県柏市', 35.862, 139.971, 1000, ARRAY['畑', '家庭菜園'], '近隣への配慮をお願いします。使用後の清掃必須。', true
  ) RETURNING id INTO prop2_id;

  INSERT INTO public.property_images (property_id, image_url, display_order)
  VALUES (prop2_id, 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&q=80&w=800', 0);

  -- 3件目: 駐車場
  INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
  VALUES (
    gen_random_uuid(), test_user_id, '駅徒歩5分の一時駐車場（軽〜普通車）', 'イベント時や週末のお出かけに便利な駐車場です。', '東京都世田谷区', 35.646, 139.653, 500, ARRAY['駐車場', '駅近'], 'アイドリングストップ、夜間の騒音注意', true
  ) RETURNING id INTO prop3_id;

  INSERT INTO public.property_images (property_id, image_url, display_order)
  VALUES (prop3_id, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=800', 0);

END $$;
