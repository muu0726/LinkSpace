DO $$
DECLARE
  u1 uuid;
  u2 uuid;
  u3 uuid;
  u4 uuid;
  u5 uuid;
BEGIN
  -- テストユーザーの取得
  SELECT id INTO u1 FROM auth.users WHERE email = 'test1@example.com' LIMIT 1;
  SELECT id INTO u2 FROM auth.users WHERE email = 'test2@example.com' LIMIT 1;
  SELECT id INTO u3 FROM auth.users WHERE email = 'test3@example.com' LIMIT 1;
  SELECT id INTO u4 FROM auth.users WHERE email = 'test4@example.com' LIMIT 1;
  SELECT id INTO u5 FROM auth.users WHERE email = 'test5@example.com' LIMIT 1;

  -- ユーザーのアバターにランダムな動物（犬やクマなど）の画像を設定
  IF u1 IS NOT NULL THEN
      UPDATE public.users SET avatar_url = 'https://placedog.net/200/200?id=10' WHERE id = u1;
  END IF;

  IF u2 IS NOT NULL THEN
      UPDATE public.users SET avatar_url = 'https://placedog.net/200/200?id=20' WHERE id = u2;
  END IF;

  IF u3 IS NOT NULL THEN
      UPDATE public.users SET avatar_url = 'https://placedog.net/200/200?id=30' WHERE id = u3;
  END IF;

  IF u4 IS NOT NULL THEN
      UPDATE public.users SET avatar_url = 'https://placedog.net/200/200?id=40' WHERE id = u4;
  END IF;

  IF u5 IS NOT NULL THEN
      UPDATE public.users SET avatar_url = 'https://placebear.com/200/200' WHERE id = u5;
  END IF;

END $$;
