"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitReview(
    reservationId: string,
    revieweeId: string,
    propertyId: string | null,
    rating: number,
    comment: string
) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "ログインが必要です" };
    }

    // すでに同じ予約に対してレビュー済みかチェック（必要に応じて）
    const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('reservation_id', reservationId)
        .eq('reviewer_id', user.id)
        .single();
        
    if (existing) {
        return { success: false, error: "すでにレビューを投稿済みです" };
    }

    const { error } = await supabase
        .from('reviews')
        .insert([{
            reservation_id: reservationId,
            reviewer_id: user.id,
            reviewee_id: revieweeId,
            property_id: propertyId,
            rating,
            comment
        }]);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function getPropertyReviews(propertyId: string) {
    const supabase = await createClient();
    
    // public policy allows anyone to read
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            *,
            users!reviews_reviewer_id_fkey (name, avatar_url)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    
    // 平均スコアの計算
    let averageScore = 0;
    if (data && data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        averageScore = sum / data.length;
    }
    
    return { success: true, data, averageScore };
}
