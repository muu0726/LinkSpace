"use client";

import { useEffect, useState, FormEvent } from "react";
import { getUserProfile, updateUserProfile, deleteUserAccount } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/properties/PropertyCard";

export default function MyPage() {
    const [activeTab, setActiveTab] = useState<"profile" | "favorites" | "properties">("profile");
    const [profile, setProfile] = useState<{ name?: string } | null>(null);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    
    const [ownedProperties, setOwnedProperties] = useState<any[]>([]);

    // クライアント側でSupabaseを使うためインポート（関数内でrequireするか、トップでimportするか。今回は動的に取得）
    const getFavorites = async () => {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        if (!session.session?.user) return;
        
        const { data, error } = await supabase
            .from("favorites")
            .select(`
                property_id,
                properties (
                    id,
                    title,
                    address,
                    price_per_day,
                    tags,
                    property_images (image_url)
                )
            `)
            .eq("user_id", session.session.user.id)
            .order("created_at", { ascending: false });

        if (data) {
            // isFavoriteフラグを強制でtrueにする
            const formatted = data.map(f => ({
                ...(f.properties as any),
                isFavorite: true
            }));
            setFavorites(formatted);
        }
    };

    const getOwnedProperties = async () => {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        if (!session.session?.user) return;
        
        const { data, error } = await supabase
            .from("properties")
            .select(`
                id,
                title,
                address,
                price_per_day,
                tags,
                is_published,
                property_images (image_url)
            `)
            .eq("owner_id", session.session.user.id)
            .order("created_at", { ascending: false });

        if (data) {
            setOwnedProperties(data);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const res = await getUserProfile();
            if (res.success && res.data) {
                setProfile(res.data);
            }
            await getFavorites();
            await getOwnedProperties();
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        const formData = new FormData(e.currentTarget);
        const res = await updateUserProfile(formData);

        if (res.success) {
            setMessage("プロフィールを更新しました。");
        } else {
            setMessage(`エラー: ${res.error}`);
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!confirm("本当に退会しますか？この操作は取り消せません。")) {
            return;
        }

        setSaving(true);
        const res = await deleteUserAccount();
        if (res.success) {
            alert("退会処理が完了しました。ご利用ありがとうございました。");
            window.location.href = "/";
        } else {
            setMessage(`エラー: ${res.error}`);
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">読み込み中...</div>;
    }

    return (
        <div className="container mx-auto max-w-5xl p-4 py-8 space-y-8">
            <h1 className="text-3xl font-bold">マイページ</h1>

            {/* タブナビゲーション */}
            <div className="flex space-x-1 border-b overflow-x-auto">
                <button
                    onClick={() => setActiveTab("profile")}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === "profile" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                >
                    プロフィール設定
                </button>
                <button
                    onClick={() => setActiveTab("favorites")}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === "favorites" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                >
                    お気に入り物件
                </button>
                <button
                    onClick={() => setActiveTab("properties")}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === "properties" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                >
                    登録した物件 (ホスト)
                </button>
            </div>

            {/* コンテンツ: プロフィール */}
            {activeTab === "profile" && (
                <div className="max-w-2xl space-y-8">
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">プロフィール編集</h2>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="name">
                                    お名前 (表示名)
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    defaultValue={profile?.name || ""}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    required
                                />
                            </div>
                            {message && (
                                <p className={`text-sm ${message.startsWith("エラー") ? "text-destructive" : "text-green-600"}`}>
                                    {message}
                                </p>
                            )}
                            <Button type="submit" disabled={saving}>
                                {saving ? "保存中..." : "保存する"}
                            </Button>
                        </form>
                    </div>

                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
                        <h2 className="text-xl font-semibold text-destructive mb-2">退会処理</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            退会するとプロフィール情報が匿名化され、ログインできなくなります。
                        </p>
                        <Button variant="outline" onClick={handleDelete} disabled={saving} className="text-destructive hover:bg-destructive hover:text-white border-destructive/50">
                            退会する
                        </Button>
                    </div>
                </div>
            )}

            {/* コンテンツ: お気に入り物件 */}
            {activeTab === "favorites" && (
                <div>
                    <h2 className="text-xl font-semibold mb-6">保存した物件一覧</h2>
                    {favorites.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                            お気に入りに登録された物件はありません。
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {favorites.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* コンテンツ: 管理物件 (ホスト) */}
            {activeTab === "properties" && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">登録した物件一覧</h2>
                        <Button variant="outline" asChild>
                            <a href="/properties/new">新しい物件を登録</a>
                        </Button>
                    </div>
                    {ownedProperties.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                            まだ登録した物件はありません。
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {ownedProperties.map((property) => (
                                <div key={property.id} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-xl bg-card shadow-sm">
                                    {/* サムネイル */}
                                    <div className="w-full sm:w-48 h-32 shrink-0 bg-muted rounded-lg overflow-hidden relative">
                                        <img 
                                            src={property.property_images?.[0]?.image_url || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800"} 
                                            alt={property.title}
                                            className="w-full h-full object-cover"
                                        />
                                        {!property.is_published && (
                                            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                                                非公開 (下書き)
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* 情報 */}
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
                                            <div className="font-bold text-primary whitespace-nowrap ml-4">
                                                {property.price_per_day.toLocaleString()} LP/日
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{property.address}</p>
                                        
                                        <div className="mt-auto flex flex-wrap gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={`/properties/${property.id}`}>ページを見る</a>
                                            </Button>
                                            <Button variant="default" size="sm" asChild>
                                                <a href={`/properties/${property.id}/edit`}>情報を編集</a>
                                            </Button>
                                            <Button variant="secondary" size="sm" asChild>
                                                <a href={`/properties/${property.id}/calendar`}>カレンダー設定</a>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
