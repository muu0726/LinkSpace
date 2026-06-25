DO $$
DECLARE
  test2_id uuid;
  test3_id uuid;
  prop_id uuid;
BEGIN
  -- テストユーザーのIDを取得
  SELECT id INTO test2_id FROM auth.users WHERE email = 'test2@example.com' LIMIT 1;
  SELECT id INTO test3_id FROM auth.users WHERE email = 'test3@example.com' LIMIT 1;
  
  IF test2_id IS NULL OR test3_id IS NULL THEN
    RAISE NOTICE 'test2 または test3 が見つかりません。作成されていない場合はスキップします。';
    RETURN;
  END IF;

  -- test2 の物件: 海沿いのテントサイト
  INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
  VALUES (
    gen_random_uuid(), test2_id, '海沿いのプライベートテントサイト', '波の音を聞きながらキャンプができる最高のロケーションです。', '神奈川県三浦市', 35.143, 139.617, 4500, ARRAY['キャンプ', '海', '絶景'], '夜10時以降はお静かに', true
  ) RETURNING id INTO prop_id;

  INSERT INTO public.property_images (property_id, image_url, display_order)
  VALUES (prop_id, 'https://images.unsplash.com/photo-1537565266752-94411fb264f3?auto=format&fit=crop&q=80&w=800', 0);

  -- test3 の物件: 古民家の庭
  INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
  VALUES (
    gen_random_uuid(), test3_id, '古民家の広いお庭（BBQ可）', '築80年の古民家の庭をお貸しします。縁側でのんびりしたり、BBQも可能です。', '埼玉県川越市', 35.925, 139.485, 2000, ARRAY['BBQ', '古民家'], '室内への立ち入りはご遠慮ください。', true
  ) RETURNING id INTO prop_id;

  INSERT INTO public.property_images (property_id, image_url, display_order)
  VALUES (prop_id, 'https://images.unsplash.com/photo-1542668595-fa939bece986?auto=format&fit=crop&q=80&w=800', 0);

END $$;
