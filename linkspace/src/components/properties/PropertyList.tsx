import { createClient } from "@/lib/supabase/server";
import { PropertyViewContainer } from "./PropertyViewContainer";

export async function PropertyList({ 
    q, 
    area, 
    tag 
}: { 
    q?: string, 
    area?: string, 
    tag?: string 
}) {
    const supabase = await createClient();

    // 基本クエリの作成
    let query = supabase
        .from('properties')
        .select(`
            id,
            title,
            address,
            price_per_day,
            tags,
            property_images(image_url)
        `)
        .eq('is_published', true);

    // キーワード検索 (title または description に部分一致)
    if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    // エリア検索 (address に部分一致)
    if (area) {
        query = query.ilike('address', `%${area}%`);
    }

    // タグ検索 (PostgreSQLの配列要素を含むか: contains)
    // Supabase JSでの配列フィルタは `cs` (contains) を使用
    if (tag) {
        query = query.contains('tags', [tag]);
    }

    // 作成日の降順でソート
    const { data: properties, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error("物件取得エラー:", error);
        return <div className="text-destructive p-4 border rounded-md">物件データの取得に失敗しました。</div>;
    }

    // ログイン中のユーザーのお気に入りを取得
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    let favoritesMap: Record<string, boolean> = {};

    if (userId && properties) {
        const { data: favorites } = await supabase
            .from('favorites')
            .select('property_id')
            .eq('user_id', userId);
        
        if (favorites) {
            favoritesMap = favorites.reduce((acc, curr) => {
                acc[curr.property_id] = true;
                return acc;
            }, {} as Record<string, boolean>);
        }
    }

    // propertiesにisFavoriteフラグを付与
    const propertiesWithFavorites = properties?.map(p => ({
        ...p,
        isFavorite: !!favoritesMap[p.id]
    })) || [];

    return <PropertyViewContainer properties={propertiesWithFavorites} />;
}
