import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// このルートはVercel Cron等から定期的に(例: 1時間おき)呼び出されることを想定しています。
// 呼び出し元がVercelであることを検証する仕組みを推奨しますが、今回は簡易実装です。

export async function GET(request: Request) {
    // サーバー環境変数を使用してサービスロールキーで初期化（RLSをバイパスするため）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    try {
        // 現在時刻から24時間前の時刻を計算
        const targetTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // status='completed' で、check_out_at が targetTime 以前（24時間以上経過）の予約を取得
        // ※ すでに通知済みかどうかを判定するフラグがないため、今回は簡略化して最新の予約だけを見るか、
        // もしくはreviewsテーブルにレコードがないものを対象にします。
        const { data: reservations, error } = await supabase
            .from('reservations')
            .select(`
                id, borrower_id, property_id, check_out_at,
                properties ( owner_id )
            `)
            .eq('status', 'completed')
            .lte('check_out_at', targetTime);

        if (error) throw error;

        let notifiedCount = 0;

        for (const res of reservations) {
            // すでに借り手がレビューしているかチェック
            const { data: borrowerReview } = await supabase
                .from('reviews')
                .select('id')
                .eq('reservation_id', res.id)
                .eq('reviewer_id', res.borrower_id)
                .single();

            // まだレビューがなければ通知
            if (!borrowerReview) {
                // 同じ種類の通知が重複して送られないかチェック
                const { data: existingNotification } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('user_id', res.borrower_id)
                    .eq('type', 'review_prompt')
                    .like('link_url', `%${res.property_id}%`)
                    .gte('created_at', res.check_out_at || targetTime)
                    .single();

                if (!existingNotification) {
                    await supabase.from('notifications').insert([{
                        user_id: res.borrower_id,
                        type: 'review_prompt',
                        message: 'ご利用ありがとうございました！物件のレビューにご協力ください。',
                        link_url: `/properties/${res.property_id}`
                    }]);
                    notifiedCount++;
                }
            }
            
            // ホスト側のレビュー催促も同様に可能（省略可能）
        }

        return NextResponse.json({ success: true, notifiedCount });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
