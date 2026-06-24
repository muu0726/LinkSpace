"use server";

import { createClient } from "@/lib/supabase/server";

// 借り手：予約リクエストを送信する
export async function requestReservation(
    propertyId: string, 
    startDate: string, 
    endDate: string, 
    totalPrice: number
) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "ログインが必要です" };
    }

    // RPC呼び出し (エスクロー引き落としを含む)
    const { data, error } = await supabase.rpc('request_reservation', {
        p_property_id: propertyId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_total_price: totalPrice
    });

    if (error) {
        let errorMessage = "予約リクエストに失敗しました。";
        if (error.message.includes('Insufficient points')) {
            errorMessage = "保有LP（ポイント）が不足しています。";
        }
        return { success: false, error: errorMessage, details: error.message };
    }

    return { success: true, reservationId: data };
}

// 貸し手：予約リクエストを承認する
export async function approveReservation(reservationId: string) {
    const supabase = await createClient();
    
    const { error } = await supabase.rpc('approve_reservation', {
        p_reservation_id: reservationId
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// 貸し手：予約リクエストを却下する
export async function rejectReservation(reservationId: string) {
    const supabase = await createClient();
    
    const { error } = await supabase.rpc('reject_reservation', {
        p_reservation_id: reservationId
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// 借り手：自分の予約一覧を取得
export async function getReservationsAsRenter() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "ログインが必要です" };
    }

    const { data, error } = await supabase
        .from('reservations')
        .select(`
            *,
            properties (
                title,
                address,
                property_images (image_url)
            )
        `)
        .eq('borrower_id', user.id)
        .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

// 貸し手：自分の物件への予約リクエスト一覧を取得
export async function getReservationsAsHost() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "ログインが必要です" };
    }

    // まず自分がオーナーである物件のIDリストを取得する
    const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);

    if (propError) return { success: false, error: propError.message };

    const propertyIds = properties.map(p => p.id);
    if (propertyIds.length === 0) {
        return { success: true, data: [] };
    }

    const { data, error } = await supabase
        .from('reservations')
        .select(`
            *,
            properties (
                title
            ),
            users!reservations_borrower_id_fkey (
                name
            )
        `)
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

// 借り手：予約をキャンセルする (キャンセルポリシー適用)
export async function cancelReservation(reservationId: string) {
    const supabase = await createClient();
    
    const { error } = await supabase.rpc('cancel_reservation', {
        p_reservation_id: reservationId
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// 借り手：利用完了を報告する (ホストへ報酬加算)
export async function completeReservation(reservationId: string) {
    const supabase = await createClient();
    
    const { error } = await supabase.rpc('complete_reservation', {
        p_reservation_id: reservationId
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// 借り手：現地でチェックイン報告を行う
export async function checkInReservation(reservationId: string) {
    const supabase = await createClient();
    
    const { error } = await supabase
        .from('reservations')
        .update({ check_in_at: new Date().toISOString() })
        .eq('id', reservationId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// 借り手：チェックアウト報告を行う (内部で完了・送金処理を実行)
export async function checkOutReservation(reservationId: string) {
    const supabase = await createClient();
    
    // 1. チェックアウト日時を記録
    const { error: updateError } = await supabase
        .from('reservations')
        .update({ check_out_at: new Date().toISOString() })
        .eq('id', reservationId);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    // 2. 利用完了処理 (決済) を呼び出す
    const { error: rpcError } = await supabase.rpc('complete_reservation', {
        p_reservation_id: reservationId
    });

    if (rpcError) {
        return { success: false, error: rpcError.message };
    }

    return { success: true };
}
