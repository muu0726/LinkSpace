"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitReview(
    reservationId: string,
    rating: number,
    comment: string
) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "ログインが必要です" };
    }

    const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select(`
            borrower_id, 
            property_id, 
            properties ( owner_id )
        `)
        .eq('id', reservationId)
        .single();
        
    if (resError || !reservation) {
        return { success: false, error: "予約情報が見つかりません" };
    }

    let revieweeId = "";
    if (user.id === reservation.borrower_id) {
        revieweeId = reservation.properties.owner_id;
    } else if (user.id === reservation.properties.owner_id) {
        revieweeId = reservation.borrower_id;
    } else {
        return { success: false, error: "レビュー権限がありません" };
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
            property_id: reservation.property_id,
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
