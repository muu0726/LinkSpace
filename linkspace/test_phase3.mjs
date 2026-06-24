import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jrnjuntdshcaxhehzrqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impybmp1bnRkc2hjYXhoZWh6cnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjQ5NjcsImV4cCI6MjA5NDkwMDk2N30.vxNRyZZPsJbDmhYpt40fmZzYNba5WmTIBnzO5gy2EdI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("=== Phase 3 動作テスト開始 ===");
    
    // 1. Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'test1@example.com',
        password: 'pass-test1',
    });
    if (authError) return console.error("Login Error:", authError);
    
    console.log("Logged in as:", authData.user.email);
    const userId = authData.user.id;
    
    // 2. ユーザー情報の確認
    const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('points_balance')
        .eq('id', userId)
        .single();
    if (profileError) return console.error("Profile Error:", profileError);
    console.log("現在の保有LP:", userProfile.points_balance);
    
    // 3. 適当な物件を作成（なければ）
    let { data: property, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', userId)
        .limit(1)
        .single();
        
    if (!property) {
        console.log("テスト物件を作成します...");
        const { data: newProp, error: insertError } = await supabase
            .from('properties')
            .insert([{
                owner_id: userId,
                title: 'テスト用物件',
                address: '東京都',
                price_per_day: 1000,
                description: 'テスト用',
                tags: ['camp'],
                is_published: true
            }])
            .select()
            .single();
        if (insertError) return console.error("Insert Property Error:", insertError);
        property = newProp;
    }
    console.log("対象物件ID:", property.id);
    
    // 4. 予約リクエスト
    console.log("\n[テスト1] 予約リクエストを送信 (1000 LP消費)...");
    const { data: resId, error: reqError } = await supabase.rpc('request_reservation', {
        p_property_id: property.id,
        p_start_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // 5日後
        p_end_date: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],   // 6日後
        p_total_price: 1000
    });
    if (reqError) return console.error("Request Error:", reqError);
    console.log(" -> 予約リクエスト完了. Reservation ID:", resId);
    
    // 5. ポイント減少確認 (エスクロー)
    const { data: userProfile2 } = await supabase.from('users').select('points_balance').eq('id', userId).single();
    console.log(" -> ポイント残高 (エスクロー後):", userProfile2.points_balance, "(期待値: -1000)");
    
    // 6. 承認
    console.log("\n[テスト2] リクエストを承認...");
    const { error: appError } = await supabase.rpc('approve_reservation', { p_reservation_id: resId });
    if (appError) return console.error("Approve Error:", appError);
    
    const { data: resStatus2 } = await supabase.from('reservations').select('status').eq('id', resId).single();
    console.log(" -> ステータス:", resStatus2.status, "(期待値: approved)");
    
    // 7. キャンセル（5日後なので100%返金のはず）
    console.log("\n[テスト3] 予約をキャンセル...");
    const { error: cancelError } = await supabase.rpc('cancel_reservation', { p_reservation_id: resId });
    if (cancelError) return console.error("Cancel Error:", cancelError);
    
    const { data: resStatus3 } = await supabase.from('reservations').select('status').eq('id', resId).single();
    console.log(" -> ステータス:", resStatus3.status, "(期待値: cancelled)");
    
    // 8. ポイント戻ったか確認
    const { data: userProfile3 } = await supabase.from('users').select('points_balance').eq('id', userId).single();
    console.log(" -> ポイント残高 (返金後):", userProfile3.points_balance, "(期待値: 元のポイントと同じ)");
    
    // --- 利用完了フローのテスト ---
    console.log("\n[テスト4] 利用完了フロー (完了報告)...");
    const { data: resId2, error: reqError2 } = await supabase.rpc('request_reservation', {
        p_property_id: property.id,
        p_start_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], 
        p_end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        p_total_price: 1500
    });
    if (reqError2) return console.error("Request Error 2:", reqError2);
    
    await supabase.rpc('approve_reservation', { p_reservation_id: resId2 });
    
    const { error: compError } = await supabase.rpc('complete_reservation', { p_reservation_id: resId2 });
    if (compError) return console.error("Complete Error:", compError);
    
    const { data: resStatus4 } = await supabase.from('reservations').select('status').eq('id', resId2).single();
    console.log(" -> ステータス:", resStatus4.status, "(期待値: completed)");
    
    // このテストでは自分自身へポイントを払っているので、合計残高は最終的に -1500 + 1500 で変わらないはず。
    const { data: userProfile4 } = await supabase.from('users').select('points_balance').eq('id', userId).single();
    console.log(" -> ポイント残高 (完了後):", userProfile4.points_balance);

    console.log("\n=== 動作テスト完了！ ===");
}

run();
