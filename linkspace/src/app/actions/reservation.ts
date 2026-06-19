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
