import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarEditor } from "@/components/properties/CalendarEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function PropertyCalendarEditPage({ params }: { params: { id: string } }) {
    const resolvedParams = await params;
    const propertyId = resolvedParams.id;

    const supabase = await createClient();

    // セッションの確認
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        redirect('/auth');
    }

    // 物件データと不可日データの取得
    const { data: property, error } = await supabase
        .from('properties')
        .select(`
            id,
            title,
            owner_id,
            unavailabilities (
                id,
                start_date,
                end_date
            )
        `)
        .eq('id', propertyId)
        .single();

    if (error || !property) {
        console.error("物件取得エラー:", error);
        notFound();
    }

    // オーナーチェック
    if (property.owner_id !== session.user.id) {
        redirect('/');
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4 -ml-4">
                    <a href="/mypage" className="flex items-center text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={16} className="mr-2" />
                        マイページへ戻る
                    </a>
                </Button>
                <h1 className="text-3xl font-bold mb-2">カレンダー・貸出不可日の設定</h1>
                <p className="text-muted-foreground">
                    物件「<span className="font-semibold text-foreground">{property.title}</span>」の貸出できない日を設定します。
                </p>
            </div>

            <CalendarEditor 
                propertyId={propertyId} 
                initialUnavailabilities={property.unavailabilities || []} 
            />
        </div>
    );
}
