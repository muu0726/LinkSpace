import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShieldCheck, Map, Key, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PropertyGuidePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const propertyId = resolvedParams.id;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    // 物件情報を取得
    const { data: property, error: propError } = await supabase
        .from('properties')
        .select('id, title, owner_id, access_guide, rules')
        .eq('id', propertyId)
        .single();

    if (propError || !property) {
        notFound();
    }

    // 閲覧権限の確認: オーナー自身か、承認済みの予約を持つ借り手か
    let hasAccess = false;
    if (user.id === property.owner_id) {
        hasAccess = true;
    } else {
        const { data: reservations } = await supabase
            .from('reservations')
            .select('id, status')
            .eq('property_id', propertyId)
            .eq('borrower_id', user.id)
            .in('status', ['approved', 'completed']); // 承認済みか利用完了なら見れる

        if (reservations && reservations.length > 0) {
            hasAccess = true;
        }
    }

    if (!hasAccess) {
        return (
            <div className="container mx-auto px-4 py-20 text-center max-w-lg">
                <AlertTriangle size={64} className="mx-auto text-destructive mb-6" />
                <h1 className="text-2xl font-bold mb-4">アクセス権限がありません</h1>
                <p className="text-muted-foreground mb-8">
                    この利用ガイド（機密情報）は、予約が承認された方、または物件のホストのみが閲覧可能です。
                </p>
                <Button asChild>
                    <Link href={`/properties/${propertyId}`}>物件詳細に戻る</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="flex items-center text-primary mb-2">
                        <ShieldCheck size={24} className="mr-2" />
                        <span className="font-bold">予約者限定 秘匿情報</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{property.title} - 利用ガイド</h1>
                    <p className="text-muted-foreground text-sm">
                        ※このページはオフライン（電波のない場所）でも表示できるよう自動でキャッシュされます。
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href={`/properties/${propertyId}`}>詳細へ戻る</Link>
                </Button>
            </div>

            <div className="space-y-8">
                {/* アクセスガイド・鍵の開け方など */}
                <section className="bg-card border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center border-b pb-2">
                        <Key size={20} className="mr-2 text-primary" />
                        アクセス・チェックイン手順
                    </h2>
                    <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed min-h-[100px]">
                        {property.access_guide ? (
                            property.access_guide
                        ) : (
                            <p className="text-muted-foreground italic">
                                ホストはまだアクセスガイドを登録していません。不明な点はQ&Aからご質問ください。
                            </p>
                        )}
                    </div>
                </section>

                {/* ルール */}
                {property.rules && (
                    <section className="bg-destructive/5 border border-destructive/10 rounded-xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center text-destructive border-b border-destructive/10 pb-2">
                            <AlertTriangle size={20} className="mr-2" />
                            再確認：注意事項とルール
                        </h2>
                        <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                            {property.rules}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
