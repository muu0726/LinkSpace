"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitQuestion(propertyId: string, content: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "ログインが必要です" };
    }

    const { error } = await supabase
        .from('questions')
        .insert([{
            property_id: propertyId,
            questioner_id: user.id,
            content
        }]);

    if (error) return { success: false, error: error.message };
    
    // 貸し手への通知はDB側でトリガーするか、ここで追加することも可能。今回はシンプルに。
    // ※今回はTriggerでなく、API側で挿入します。
    const { data: property } = await supabase.from('properties').select('owner_id').eq('id', propertyId).single();
    if (property) {
        await supabase.from('notifications').insert([{
            user_id: property.owner_id,
            type: 'question',
            message: '物件に新しい質問が投稿されました。',
            link_url: `/properties/${propertyId}`
        }]);
    }

    return { success: true };
}

export async function submitAnswer(questionId: string, content: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "ログインが必要です" };
    }

    const { error } = await supabase
        .from('answers')
        .insert([{
            question_id: questionId,
            answerer_id: user.id,
            content
        }]);

    if (error) return { success: false, error: error.message };
    
    // 質問者への通知
    const { data: question } = await supabase.from('questions').select('questioner_id, property_id').eq('id', questionId).single();
    if (question) {
        await supabase.from('notifications').insert([{
            user_id: question.questioner_id,
            type: 'answer',
            message: '投稿した質問に回答が付きました。',
            link_url: `/properties/${question.property_id}`
        }]);
    }

    return { success: true };
}

export async function getPropertyQA(propertyId: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('questions')
        .select(`
            *,
            users!questions_questioner_id_fkey (name, avatar_url),
            answers (
                *,
                users!answers_answerer_id_fkey (name, avatar_url)
            )
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}
