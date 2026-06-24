import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MapPin, Tag, ShieldAlert, User, Eye } from "lucide-react";
import { PropertyCalendar } from "@/components/properties/PropertyCalendar";
import { FavoriteButton } from "@/components/properties/FavoriteButton";
import { PropertyReviews } from "@/components/properties/PropertyReviews";
import { PropertyQA } from "@/components/properties/PropertyQA";


export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // URLの[id]がPromiseとして渡される場合があるのでawaitする（Next.js 15仕様対策）
    const resolvedParams = await params;
    const propertyId = resolvedParams.id;

    const supabase = await createClient();

    // PVカウントの増加 (エラーが出ても画面表示は止めない)
    const { error: rpcError } = await supabase.rpc('increment_page_view', { property_id_param: propertyId });
    if (rpcError) console.error("PVカウントエラー:", rpcError);

    // 物件データの取得 (画像と不可日をJOIN)
    const { data: property, error } = await supabase
        .from('properties')
        .select(`
            *,
            property_images (
                image_url,
                display_order
            ),
            unavailabilities (
                start_date,
                end_date
            )
        `)
        .eq('id', propertyId)
        .single();

    if (error || !property) {
        console.error("物件詳細取得エラー:", error);
        notFound();
    }

    // ログイン中のユーザーIDを取得してお気に入り状態を確認
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    let isFavorite = false;

    if (userId) {
        const { data: favorite } = await supabase
            .from("favorites")
            .select("id")
            .eq("property_id", propertyId)
            .eq("user_id", userId)
            .single();
        if (favorite) isFavorite = true;
    }

    // オーナー情報を別途取得（RLSの影響や外部キー定義違いでのJOINエラーを回避）
    const { data: owner } = await supabase
        .from('users')
        .select('name, avatar_url')
        .eq('id', property.owner_id)
        .single();

    // 画像配列のソート
    const images = property.property_images?.sort((a: any, b: any) => a.display_order - b.display_order) || [];
    const mainImageUrl = images.length > 0 
        ? images[0].image_url 
        : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800";

    const ownerName = owner?.name || "ゲストユーザー";
    const ownerAvatar = owner?.avatar_url || "";

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* 上部: タイトルとヘッダー情報 */}
            <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">{property.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                            <MapPin size={16} className="mr-1" />
                            <span>{property.address}</span>
                        </div>
                        <div className="flex items-center">
                            <Eye size={16} className="mr-1" />
                            <span>{property.page_views || 0} 回閲覧</span>
                        </div>
                        {property.tags && property.tags.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Tag size={16} />
                                <div className="flex gap-1">
                                {property.tags.map((tag: string, i: number) => (
                                    <span key={i} className="bg-muted px-2 py-0.5 rounded-full text-xs text-foreground font-medium">
                                        {tag}
                                    </span>
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* お気に入りボタン */}
                <div className="shrink-0 flex items-center justify-end">
                    <FavoriteButton 
                        propertyId={property.id} 
                        initialIsFavorite={isFavorite} 
                        showText={true} 
                        className="bg-card border rounded-full px-4 py-2 hover:bg-muted"
                    />
                </div>
            </div>

            {/* 画像ギャラリー */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 h-[300px] md:h-[400px]">
                <div className="relative w-full h-full rounded-xl overflow-hidden group">
                    <img src={mainImageUrl} alt="Main Property Image" className="object-cover w-full h-full" />
                </div>
                <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-4 h-full">
                    {/* 残りの画像を最大4枚表示 */}
                    {[1, 2, 3, 4].map((index) => {
                        const imgUrl = images[index]?.image_url || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800&opacity=0.5";
                        return (
                            <div key={index} className="relative w-full h-full rounded-xl overflow-hidden bg-muted">
                                {images[index] ? (
                                    <img src={imgUrl} alt={`Property Image ${index}`} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full bg-muted/50"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* メインコンテンツとサイドバー */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* 左側: 詳細情報 */}
                <div className="lg:col-span-2 space-y-10">
                    
                    {/* ホスト情報 */}
                    <div className="flex items-center gap-4 pb-8 border-b">
                        <div className="w-14 h-14 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                            {ownerAvatar ? (
                                <img src={ownerAvatar} alt={ownerName} className="w-full h-full object-cover" />
                            ) : (
                                <User className="text-muted-foreground" size={24} />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">ホスト: {ownerName} さん</h3>
                            <p className="text-sm text-muted-foreground">認証済みユーザー</p>
                        </div>
                    </div>

                    {/* 説明文 */}
                    <section>
                        <h2 className="text-xl font-bold mb-4">物件について</h2>
                        <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                            {property.description}
                        </div>
                    </section>

                    {/* ルール・注意事項 */}
                    {property.rules && (
                        <section className="bg-destructive/5 p-6 rounded-xl border border-destructive/10">
                            <h2 className="text-lg font-bold mb-3 flex items-center text-destructive">
                                <ShieldAlert size={20} className="mr-2" />
                                ルールと注意事項
                            </h2>
                            <div className="whitespace-pre-wrap text-sm text-foreground/80">
                                {property.rules}
                            </div>
                        </section>
                    )}

                    {/* レビュー */}
                    <section className="pt-6 border-t">
                        <h2 className="text-xl font-bold mb-6">レビュー</h2>
                        <PropertyReviews propertyId={property.id} />
                    </section>

                    {/* Q&A */}
                    <section className="pt-6 border-t">
                        <h2 className="text-xl font-bold mb-6">Q&A</h2>
                        <PropertyQA propertyId={property.id} isOwner={userId === property.owner_id} />
                    </section>
                </div>


                {/* 右側: 予約カレンダー（サイドバー） */}
                <div className="lg:col-span-1 relative">
                    <PropertyCalendar 
                        propertyId={property.id}
                        pricePerDay={property.price_per_day} 
                        unavailabilities={property.unavailabilities || []} 
                    />
                </div>
            </div>
        </div>
    );
}
