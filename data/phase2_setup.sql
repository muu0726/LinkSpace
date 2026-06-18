-- 1. properties テーブルの作成
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  address text NOT NULL,
  latitude double precision,
  longitude double precision,
  price_per_day integer NOT NULL DEFAULT 0,
  tags text[] DEFAULT '{}',
  rules text,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. property_images テーブルの作成
CREATE TABLE IF NOT EXISTS public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. favorites テーブルの作成 (お気に入り)
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, property_id)
);

-- 4. unavailabilities テーブルの作成 (カレンダー貸出不可日)
CREATE TABLE IF NOT EXISTS public.unavailabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLSの有効化
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unavailabilities ENABLE ROW LEVEL SECURITY;

-- 【RLSポリシー: properties】
CREATE POLICY "Anyone can view published or owned properties" 
ON public.properties FOR SELECT 
USING (is_published = true OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create properties" 
ON public.properties FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own properties" 
ON public.properties FOR UPDATE 
TO authenticated 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own properties" 
ON public.properties FOR DELETE 
TO authenticated 
USING (auth.uid() = owner_id);


-- 【RLSポリシー: property_images】
CREATE POLICY "Anyone can view property images" 
ON public.property_images FOR SELECT 
USING (true);

CREATE POLICY "Owners can manage property images" 
ON public.property_images FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- 【RLSポリシー: favorites】
CREATE POLICY "Users can manage own favorites" 
ON public.favorites FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 【RLSポリシー: unavailabilities】
CREATE POLICY "Anyone can view unavailabilities" 
ON public.unavailabilities FOR SELECT 
USING (true);

CREATE POLICY "Owners can manage unavailabilities" 
ON public.unavailabilities FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = unavailabilities.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- 5. Storage バケットの作成とポリシー設定 (物件画像用)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view property-images bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Users can update/delete their own property-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'property-images' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own property-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-images' AND auth.uid() = owner);
