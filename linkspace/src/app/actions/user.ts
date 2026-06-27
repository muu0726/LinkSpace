"use server";

import { createClient } from "@/lib/supabase/server";

export async function getUserProfile() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "認証されていません" };
    }

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

    if (error) {
        // テーブルが存在しないか、RLSでブロックされた場合など
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function updateUserProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "認証されていません" };
    }

    const fullName = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const avatarFile = formData.get("avatar") as File | null;
    
    let avatarUrl = undefined;

    if (avatarFile && avatarFile.size > 0) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
            return { success: false, error: "画像アップロードに失敗しました: " + uploadError.message };
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
            
        avatarUrl = publicUrl;
    }
    
    // Authのメタデータを更新
    await supabase.auth.updateUser({
        data: { 
            name: fullName,
            ...(avatarUrl ? { avatar_url: avatarUrl } : {})
        }
    });

    // DBのusersテーブルを更新
    const updateData: any = { name: fullName };
    if (bio !== null && bio !== undefined) {
        updateData.bio = bio;
    }
    if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
    }

    const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user.id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function deleteUserAccount() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "認証されていません" };
    }

    // 匿名化の実行
    const { error: updateError } = await supabase
        .from("users")
        .update({
            name: "退会済みユーザー",
            // その他の個人情報もここで匿名化
        })
        .eq("id", user.id);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    // セッションを終了
    await supabase.auth.signOut();

    return { success: true };
}

export async function getUserTransactions() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "認証されていません" };
    }

    const { data, error } = await supabase
        .from("transactions")
        .select(`
            *,
            reservations (
                start_date,
                end_date,
                property_id,
                properties (title)
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}
