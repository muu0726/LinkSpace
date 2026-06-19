import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PropertyForm } from "@/components/properties/PropertyForm";

export default async function PropertyEditPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const propertyId = resolvedParams.id;

    const supabase = await createClient();

    // セッションの確認
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        redirect('/auth');
    }

    // 物件データの取得 (自分の所有かどうかもチェック)
    const { data: property, error } = await supabase
        .from('properties')
        .select(`
            *,
            property_images (
                image_url,
                display_order
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
        // 自分のものでなければトップにリダイレクト
        redirect('/');
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <PropertyForm initialData={property} />
        </div>
    );
}
