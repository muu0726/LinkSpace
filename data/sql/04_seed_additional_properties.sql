-- ==========================================
-- 04_seed_additional_properties.sql
-- ユーザーあたり5件、合計25件の物件を追加するシードデータ
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
  -- test1@example.com の物件 x 5
  -- ==========================================
  IF u1 IS NOT NULL THEN
    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u1, '都心の隠れ家屋上スペース', '都心の夜景を一望できる屋上です。貸切パーティーに。', '東京都港区', 35.658, 139.741, 15000, ARRAY['絶景', 'パーティー'], '大音量の音楽は禁止', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u1, '広々とした芝生のドッグラン用地', '愛犬と思い切り走れる芝生の空き地です。', '千葉県市原市', 35.527, 140.089, 2000, ARRAY['ペット可', 'ドッグラン'], 'フンの始末は各自でお願いします', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u1, '駅前の一時駐輪スペース', '自転車やバイクが停められます。', '神奈川県横浜市', 35.443, 139.638, 300, ARRAY['駐車場', '駅近'], '連泊はご相談ください', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u1, '清流沿いのテントサウナ用地', '川のせせらぎを聞きながらテントサウナができる場所です。', '埼玉県飯能市', 35.854, 139.327, 5000, ARRAY['キャンプ', 'サウナ', '川'], '直火禁止', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u1, 'シェア畑の一画', '初心者でも簡単な野菜作りに。', '東京都練馬区', 35.735, 139.651, 800, ARRAY['畑', '家庭菜園'], '道具類は共用です', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&q=80&w=800', 0);
  END IF;

  -- ==========================================
  -- test2@example.com の物件 x 5
  -- ==========================================
  IF u2 IS NOT NULL THEN
    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u2, '海辺のサーファー向け駐車場', '海まで徒歩1分！シャワーも別途利用可能です。', '神奈川県藤沢市', 35.311, 139.481, 1500, ARRAY['駐車場', '海'], '砂を落としてからご利用ください', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1505852903341-fc8d3db09040?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u2, '里山の静かな空き家', 'リモートワークや創作活動に集中できる一軒家です。', '長野県軽井沢町', 36.342, 138.631, 8000, ARRAY['空き家', '静寂'], '近隣への挨拶をお願いします', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u2, '山奥のブッシュクラフト専用地', '手付かずの自然の中で本格的なサバイバルキャンプができます。', '群馬県みなかみ町', 36.678, 138.995, 2000, ARRAY['キャンプ', '山'], 'ゴミの持ち帰りは絶対', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u2, 'ロードサイドのイベントスペース', 'キッチンカーやポップアップストアの出店に最適な舗装地。', '埼玉県川口市', 35.807, 139.718, 5000, ARRAY['イベント', 'キッチンカー'], '火気厳禁', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u2, '廃校のグラウンド', '広大なスペースでスポーツやドローン撮影が可能です。', '栃木県日光市', 36.750, 139.605, 10000, ARRAY['広場', 'ドローン'], '近隣の迷惑になる行為は禁止', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1529127814755-d4190c13e590?auto=format&fit=crop&q=80&w=800', 0);
  END IF;

  -- ==========================================
  -- test3@example.com の物件 x 5
  -- ==========================================
  IF u3 IS NOT NULL THEN
    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u3, '森の中のウッドデッキ', 'ヨガや瞑想に最適な静かなウッドデッキです。', '山梨県北杜市', 35.845, 138.411, 4000, ARRAY['絶景', 'ヨガ'], '大声での会話禁止', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1540821924489-8d769c0d38e2?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u3, '農家レストラン併設の貸し農園', '農作業のあとは新鮮な野菜料理を楽しめます。', '茨城県つくば市', 36.083, 140.110, 1500, ARRAY['畑', '家庭菜園'], '道具は丁寧に扱ってください', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u3, '駅チカの大型車対応駐車場', 'キャンピングカーやマイクロバスも駐車可能です。', '千葉県千葉市', 35.607, 140.106, 2000, ARRAY['駐車場', '大型車'], 'アイドリングストップ', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u3, '星空観察用の丘', '周囲に灯りがなく、天体観測に最高のスポット。', '長野県阿智村', 35.437, 137.732, 2500, ARRAY['星空', '絶景', 'キャンプ'], '火気厳禁', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u3, '海が見えるBBQスペース', '機材持ち込みで自由にBBQが楽しめます。', '静岡県熱海市', 35.097, 139.070, 6000, ARRAY['海', 'BBQ'], 'ゴミの持ち帰り必須', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1529144415895-6aaf8be872fb?auto=format&fit=crop&q=80&w=800', 0);
  END IF;

  -- ==========================================
  -- test4@example.com の物件 x 5
  -- ==========================================
  IF u4 IS NOT NULL THEN
    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u4, '古民家カフェの空きスペース', 'ハンドメイド作品の販売などに利用可能です。', '京都府京都市', 35.011, 135.768, 3000, ARRAY['古民家', 'イベント'], '強い匂いのするものの持ち込み禁止', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u4, '果樹園の一角', '季節のフルーツ狩り体験ができます。', '和歌山県紀の川市', 34.267, 135.334, 2500, ARRAY['畑', '農業体験'], '指定以外の木には触れないでください', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u4, '温泉街の空き地', '足湯のすぐそば！観光の休憩スポットとして。', '群馬県草津町', 36.621, 138.596, 1000, ARRAY['温泉', '広場'], 'ゴミは各自持ち帰り', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1542668595-fa939bece986?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u4, '高架下のスケボーパーク', '雨の日でもスケートボードが楽しめる舗装スペース。', '大阪府大阪市', 34.702, 135.495, 500, ARRAY['スケボー', 'ストリート'], '夜20時までの利用', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u4, '高原のオートキャンプ場', '車を横付けしてキャンプができる広々サイト。', '長野県白馬村', 36.698, 137.861, 4500, ARRAY['キャンプ', '山', '星空'], '直火禁止、焚き火台を使用してください', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=800', 0);
  END IF;

  -- ==========================================
  -- test5@example.com の物件 x 5
  -- ==========================================
  IF u5 IS NOT NULL THEN
    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u5, '湖畔の静かなグランピング', '手ぶらで豪華なキャンプ体験。', '山梨県富士河口湖町', 35.499, 138.761, 20000, ARRAY['グランピング', '絶景', '湖'], '施設内の備品は持ち帰らないでください', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u5, '下町のレトロな空き店舗', '一日カフェやギャラリーとしての貸し出し。', '東京都台東区', 35.712, 139.796, 8000, ARRAY['店舗', 'レトロ'], '原状回復をお願いします', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u5, '空港近くの長期預かり駐車場', '旅行や出張時の車の長期保管に便利です。', '千葉県成田市', 35.776, 140.318, 500, ARRAY['駐車場', '長期'], '車内に貴重品を置かないでください', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u5, '一面のひまわり畑', '撮影会やピクニックに最適です。', '北海道北竜町', 43.743, 141.879, 1500, ARRAY['絶景', '畑', '撮影'], '花を折らないでください', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&q=80&w=800', 0);

    INSERT INTO public.properties (id, owner_id, title, description, address, latitude, longitude, price_per_day, tags, rules, is_published)
    VALUES (gen_random_uuid(), u5, '竹林の瞑想スペース', '静寂の竹林で心身をリフレッシュ。', '京都府向日市', 34.949, 135.698, 2000, ARRAY['静寂', 'ヨガ'], '竹の子の無断採集は禁止です', true) RETURNING id INTO prop_id;
    INSERT INTO public.property_images (property_id, image_url, display_order) VALUES (prop_id, 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=800', 0);
  END IF;

END $$;
