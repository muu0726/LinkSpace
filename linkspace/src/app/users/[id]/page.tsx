import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { User, MapPin, Calendar, Star } from "lucide-react";
import { PropertyCard } from "@/components/properties/PropertyCard";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const userId = resolvedParams.id;
    const supabase = await createClient();

    // 1. ユーザー基本情報の取得
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('name, avatar_url, bio, created_at')
        .eq('id', userId)
        .single();

    if (userError || !user) {
        // RLSやダミーデータ等でユーザーが取得できない場合はフォールバック情報を表示
        console.warn(`User ${userId} not found or access denied. Showing fallback.`);
    }

    const displayUser = user || {
        name: "ゲストホスト",
        avatar_url: null,
        bio: "プロフィール情報が設定されていません。",
        created_at: new Date().toISOString()
    };

    // 2. このユーザーが公開している物件を取得
    const { data: properties, error: propsError } = await supabase
        .from('properties')
        .select(`
            *,
            property_images (
                image_url,
                display_order
            )
        `)
        .eq('owner_id', userId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    // isFavorite用の仮データを追加(サーバー側では省略あるいは後でクライアント側で処理する構成になっているので一旦isFavorite=falseとする)
    const formattedProperties = (properties || []).map((p: any) => ({
        ...p,
        isFavorite: false,
        users: { name: displayUser.name, avatar_url: displayUser.avatar_url }
    }));

    // 3. このユーザーに対するレビューを取得
    // reviewee_id がこのユーザーであるレビューを取得する
    const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
            *,
            users!reviews_reviewer_id_fkey (name, avatar_url),
            properties (title)
        `)
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false });

    let averageScore = 0;
    if (reviews && reviews.length > 0) {
        const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
        averageScore = sum / reviews.length;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* ユーザープロフィールヘッダー */}
            <div className="bg-card border rounded-2xl p-6 md:p-10 mb-10 flex flex-col md:flex-row gap-8 items-center md:items-start shadow-sm">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0 border-4 border-background shadow-sm">
                    {displayUser.avatar_url ? (
                        <img src={displayUser.avatar_url} alt={displayUser.name} className="w-full h-full object-cover" />
                    ) : (
                        <User className="text-muted-foreground" size={64} />
                    )}
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                    <h1 className="text-3xl font-bold">{displayUser.name}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>登録日: {new Date(displayUser.created_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                        {reviews && reviews.length > 0 && (
                            <div className="flex items-center gap-1 font-medium text-amber-500">
                                <Star size={16} className="fill-amber-500" />
                                <span>{averageScore.toFixed(1)} ({reviews.length}件のレビュー)</span>
                            </div>
                        )}
                    </div>
                    <div className="pt-4 border-t text-left whitespace-pre-wrap leading-relaxed text-foreground/90">
                        {displayUser.bio ? (
                            <p>{displayUser.bio}</p>
                        ) : (
                            <p className="text-muted-foreground italic">自己紹介文はまだ登録されていません。</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* 左側: 公開物件 */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-bold border-b pb-4">ホストしている物件 ({formattedProperties.length}件)</h2>
                    {formattedProperties.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                            現在公開中の物件はありません。
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {formattedProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    )}
                </div>

                {/* 右側: レビュー */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-xl font-bold border-b pb-4">ユーザーへのレビュー ({reviews?.length || 0}件)</h2>
                    
                    {!reviews || reviews.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                            まだレビューはありません。
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map((review: any) => (
                                <div key={review.id} className="p-4 border rounded-xl bg-card">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                                            {review.users?.avatar_url ? (
                                                <img src={review.users.avatar_url} alt={review.users.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="text-muted-foreground" size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{review.users?.name || "ゲスト"}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString('ja-JP')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star 
                                                key={star} 
                                                size={14} 
                                                className={star <= review.rating ? "fill-amber-500 text-amber-500" : "fill-muted text-muted"} 
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm text-foreground/90 mb-3 line-clamp-4">{review.comment}</p>
                                    {review.properties && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 p-2 rounded">
                                            <span>物件:</span>
                                            <span className="font-medium line-clamp-1">{review.properties.title}</span>
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
