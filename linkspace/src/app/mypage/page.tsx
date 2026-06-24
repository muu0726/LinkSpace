"use client";

import { useEffect, useState, FormEvent } from "react";
import { getUserProfile, updateUserProfile, deleteUserAccount, getUserTransactions } from "@/app/actions/user";
import { getReservationsAsRenter, getReservationsAsHost, cancelReservation, approveReservation, rejectReservation, checkInReservation, checkOutReservation } from "@/app/actions/reservation";
import { getNotifications, markAsRead } from "@/app/actions/notification";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { Bell } from "lucide-react";

export default function MyPage() {
    const [activeTab, setActiveTab] = useState<"profile" | "favorites" | "properties" | "reservations" | "requests" | "points" | "notifications">("profile");
    const [profile, setProfile] = useState<{ name?: string; points_balance?: number } | null>(null);
    const [notifications, setNotifications] = useState<any[]>([]);

    const [favorites, setFavorites] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [myReservations, setMyReservations] = useState<any[]>([]);
    const [hostRequests, setHostRequests] = useState<any[]>([]);
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
            const txRes = await getUserTransactions();
            if (txRes.success && txRes.data) {
                setTransactions(txRes.data);
            }
            await getFavorites();
            await getOwnedProperties();
            
            const resRenter = await getReservationsAsRenter();
            if (resRenter.success) setMyReservations(resRenter.data || []);
            
            const resHost = await getReservationsAsHost();
            if (resHost.success) setHostRequests(resHost.data || []);

            const resNotif = await getNotifications();
            if (resNotif.success) setNotifications(resNotif.data || []);

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

    const handleCancel = async (id: string) => {
        if (!confirm("本当にキャンセルしますか？キャンセルポリシーに基づき返金されます。")) return;
        setSaving(true);
        const res = await cancelReservation(id);
        if (res.success) {
            alert("キャンセルしました。");
            window.location.reload();
        } else {
            alert("エラー: " + res.error);
            setSaving(false);
        }
    };

    const handleCheckIn = async (id: string) => {
        if (!confirm("現地に到着しましたか？チェックイン報告を行います。")) return;
        setSaving(true);
        const res = await checkInReservation(id);
        if (res.success) {
            alert("チェックインしました！利用ガイド等をご確認ください。");
            window.location.reload();
        } else {
            alert("エラー: " + res.error);
            setSaving(false);
        }
    };

    const handleCheckOut = async (id: string) => {
        if (!confirm("利用を完了し、退出しましたか？チェックアウト報告と決済を行います。")) return;
        setSaving(true);
        const res = await checkOutReservation(id);
        if (res.success) {
            alert("チェックアウトが完了しました！ご利用ありがとうございました。");
            window.location.reload();
        } else {
            alert("エラー: " + res.error);
            setSaving(false);
        }
    };

    const handleMarkAsRead = async (id: string, url?: string) => {
        await markAsRead(id);
        if (url) window.location.href = url;
        else window.location.reload();
    };

    const handleApprove = async (id: string) => {
        if (!confirm("このリクエストを承認しますか？エスクロー決済が実行されます。")) return;
        setSaving(true);
        const res = await approveReservation(id);
        if (res.success) {
            alert("承認しました。");
            window.location.reload();
        } else {
            alert("エラー: " + res.error);
            setSaving(false);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("このリクエストを却下しますか？")) return;
        setSaving(true);
        const res = await rejectReservation(id);
        if (res.success) {
            alert("却下しました。");
            window.location.reload();
        } else {
            alert("エラー: " + res.error);
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
                <button
                    onClick={() => setActiveTab("reservations")}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === "reservations" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                >
                    予約・利用履歴
                </button>
                <button
                    onClick={() => setActiveTab("requests")}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === "requests" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                >
                    リクエスト管理
                </button>
                <button
                    onClick={() => setActiveTab("points")}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === "points" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                >
                    ポイント履歴
                </button>
                <button
                    onClick={() => setActiveTab("notifications")}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-1 ${
                        activeTab === "notifications" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                >
                    <Bell size={16} />
                    通知
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <span className="bg-destructive text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                            {notifications.filter(n => !n.is_read).length}
                        </span>
                    )}
                </button>
            </div>

            {/* コンテンツ: プロフィール */}
            {activeTab === "profile" && (
                <div className="max-w-2xl space-y-8">
                    
                    {/* LP残高表示 */}
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-sm flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground mb-1">現在の保有ポイント</h2>
                            <div className="text-3xl font-bold text-primary">
                                {profile?.points_balance?.toLocaleString() || 0} <span className="text-lg">LP</span>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => setActiveTab("points")}>
                            履歴を見る
                        </Button>
                    </div>

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

            {/* コンテンツ: 予約・利用履歴 (借り手) */}
            {activeTab === "reservations" && (
                <div>
                    <h2 className="text-xl font-semibold mb-6">予約・利用履歴</h2>
                    {myReservations.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                            現在予約している物件はありません。
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myReservations.map(res => (
                                <div key={res.id} className="p-4 border rounded-xl bg-card flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div>
                                        <h3 className="font-bold">{res.properties?.title || '不明な物件'}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {res.start_date} 〜 {res.end_date}
                                        </p>
                                        <p className="text-sm font-semibold text-primary mt-1">合計: {res.total_price.toLocaleString()} LP</p>
                                        <div className="mt-2">
                                            <span className="px-2 py-1 text-xs rounded bg-secondary/50 font-medium border border-border">
                                                ステータス: {res.status === 'pending' ? 'リクエスト中' : res.status === 'approved' ? '予約確定 (エスクロー中)' : res.status === 'completed' ? '利用完了' : res.status === 'cancelled' ? 'キャンセル済' : '却下済'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 min-w-[140px]">
                                        {(res.status === 'pending' || res.status === 'approved') && (
                                            <Button variant="outline" size="sm" onClick={() => handleCancel(res.id)} disabled={saving} className="text-destructive border-destructive/50 hover:bg-destructive/10">
                                                キャンセルする
                                            </Button>
                                        )}
                                        {res.status === 'approved' && !res.check_in_at && (
                                            <Button variant="default" size="sm" onClick={() => handleCheckIn(res.id)} disabled={saving}>
                                                チェックイン
                                            </Button>
                                        )}
                                        {res.status === 'approved' && res.check_in_at && !res.check_out_at && (
                                            <Button variant="default" size="sm" onClick={() => handleCheckOut(res.id)} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
                                                チェックアウト
                                            </Button>
                                        )}
                                        {(res.status === 'approved' || res.status === 'completed') && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={`/properties/${res.property_id}/guide`} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                                    利用ガイドを見る
                                                </a>
                                            </Button>
                                        )}
                                        <Button variant="secondary" size="sm" asChild>
                                            <a href={`/properties/${res.property_id}`}>物件を見る</a>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* コンテンツ: リクエスト管理 (貸し手) */}
            {activeTab === "requests" && (
                <div>
                    <h2 className="text-xl font-semibold mb-6">あなたへの予約リクエスト</h2>
                    {hostRequests.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                            現在リクエストはありません。
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {hostRequests.map(req => (
                                <div key={req.id} className="p-4 border rounded-xl bg-card flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div>
                                        <h3 className="font-bold">{req.properties?.title || '不明な物件'}</h3>
                                        <p className="text-sm">借り手: <span className="font-semibold">{req.users?.name || '不明'}</span></p>
                                        <p className="text-sm text-muted-foreground">
                                            {req.start_date} 〜 {req.end_date}
                                        </p>
                                        <p className="text-sm font-semibold text-primary mt-1">報酬予定: {req.total_price.toLocaleString()} LP</p>
                                        <div className="mt-2">
                                            <span className="px-2 py-1 text-xs rounded bg-secondary/50 font-medium border border-border">
                                                ステータス: {req.status === 'pending' ? '承認待ち' : req.status === 'approved' ? '承認済' : req.status === 'completed' ? '完了' : req.status === 'cancelled' ? 'キャンセル済' : '却下済'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 min-w-[140px]">
                                        {req.status === 'pending' && (
                                            <>
                                                <Button variant="default" size="sm" onClick={() => handleApprove(req.id)} disabled={saving}>
                                                    承認する
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleReject(req.id)} disabled={saving} className="text-destructive border-destructive/50 hover:bg-destructive/10">
                                                    却下する
                                                </Button>
                                            </>
                                        )}
                                        <Button variant="secondary" size="sm" asChild>
                                            <a href={`/properties/${req.property_id}`}>物件を見る</a>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* コンテンツ: ポイント履歴 */}
            {activeTab === "points" && (
                <div className="max-w-3xl space-y-6">
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground mb-1">現在の保有ポイント</h2>
                            <div className="text-3xl font-bold text-primary">
                                {profile?.points_balance?.toLocaleString() || 0} <span className="text-lg">LP</span>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-xl font-semibold">取引履歴</h2>
                    
                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                            取引履歴はありません。
                        </div>
                    ) : (
                        <div className="rounded-xl border bg-card overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">日時</th>
                                        <th className="px-4 py-3 font-medium">種別</th>
                                        <th className="px-4 py-3 font-medium">金額 (LP)</th>
                                        <th className="px-4 py-3 font-medium">詳細</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {transactions.map((tx) => {
                                        const isPositive = tx.amount > 0;
                                        
                                        // 種別のラベル表示用
                                        let typeLabel = tx.type;
                                        switch(tx.type) {
                                            case 'initial_grant': typeLabel = '初期付与'; break;
                                            case 'payment_escrow': typeLabel = '予約支払 (預かり)'; break;
                                            case 'escrow_release': typeLabel = '預かり解放'; break;
                                            case 'refund': typeLabel = 'キャンセル返金'; break;
                                            case 'reward': typeLabel = 'ホスト報酬'; break;
                                            case 'manual_adjustment': typeLabel = 'システム調整'; break;
                                        }

                                        return (
                                            <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {new Date(tx.created_at).toLocaleDateString('ja-JP')} {new Date(tx.created_at).toLocaleTimeString('ja-JP', {hour: '2-digit', minute:'2-digit'})}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-secondary px-2 py-1 rounded text-xs font-medium">
                                                        {typeLabel}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-bold">
                                                    <span className={isPositive ? "text-green-600" : "text-destructive"}>
                                                        {isPositive ? "+" : ""}{tx.amount.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {tx.reservations?.properties?.title ? (
                                                        <span className="line-clamp-1">{tx.reservations.properties.title}</span>
                                                    ) : (
                                                        <span>-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* コンテンツ: 通知 */}
            {activeTab === "notifications" && (
                <div className="max-w-3xl space-y-6">
                    <h2 className="text-xl font-semibold">通知センター</h2>
                    
                    {notifications.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                            現在、新しい通知はありません。
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notif) => (
                                <div 
                                    key={notif.id} 
                                    className={`p-4 border rounded-xl flex items-start gap-4 transition-colors ${notif.is_read ? 'bg-card opacity-70' : 'bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10'}`}
                                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id, notif.link_url)}
                                >
                                    <div className={`mt-1 rounded-full p-2 ${notif.is_read ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'}`}>
                                        <Bell size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm mb-1">{notif.message}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(notif.created_at).toLocaleString('ja-JP')}
                                        </p>
                                    </div>
                                    {notif.is_read && notif.link_url && (
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={notif.link_url}>確認する</a>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

