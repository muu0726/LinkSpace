"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ユーザーのステータスを変更（凍結/解除）
export async function toggleUserStatus(userId: string, currentStatus: string) {
  const supabase = await createClient();

  // Admin確認
  const { data: userAuth } = await supabase.auth.getUser();
  if (!userAuth.user) throw new Error("Unauthorized");

  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", userAuth.user.id)
    .single();

  if (adminUser?.role !== "admin") throw new Error("Forbidden");

  const newStatus = currentStatus === "active" ? "suspended" : "active";

  const { error } = await supabase
    .from("users")
    .update({ status: newStatus })
    .eq("id", userId);

  if (error) {
    console.error("Failed to update user status:", error);
    throw new Error("Failed to update user status");
  }

  revalidatePath("/admin/users");
  return { success: true };
}

// 物件の表示/非表示（検閲）
export async function togglePropertyPublish(propertyId: string, currentPublished: boolean) {
  const supabase = await createClient();

  // Admin確認
  const { data: userAuth } = await supabase.auth.getUser();
  if (!userAuth.user) throw new Error("Unauthorized");

  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", userAuth.user.id)
    .single();

  if (adminUser?.role !== "admin") throw new Error("Forbidden");

  const { error } = await supabase
    .from("properties")
    .update({ is_published: !currentPublished })
    .eq("id", propertyId);

  if (error) {
    console.error("Failed to update property:", error);
    throw new Error("Failed to update property status");
  }

  revalidatePath("/admin/properties");
  return { success: true };
}

// ポイント手動調整
export async function adjustPoints(userId: string, amount: number, reason: string) {
  const supabase = await createClient();

  // RPCの呼び出し
  const { error } = await supabase.rpc("admin_adjust_points", {
    p_target_user_id: userId,
    p_amount: amount,
    p_reason: reason,
  });

  if (error) {
    console.error("Failed to adjust points:", error);
    throw new Error(error.message || "Failed to adjust points");
  }

  revalidatePath("/admin/points");
  return { success: true };
}

// カテゴリ追加
export async function addCategory(name: string) {
  const supabase = await createClient();

  // Admin確認
  const { data: userAuth } = await supabase.auth.getUser();
  if (!userAuth.user) throw new Error("Unauthorized");
  const { data: adminUser } = await supabase.from("users").select("role").eq("id", userAuth.user.id).single();
  if (adminUser?.role !== "admin") throw new Error("Forbidden");

  const { error } = await supabase.from("categories").insert({ name });

  if (error) {
    console.error("Failed to add category:", error);
    throw new Error(error.message || "カテゴリの追加に失敗しました");
  }

  revalidatePath("/admin/categories");
  return { success: true };
}

// カテゴリ削除
export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();

  // Admin確認
  const { data: userAuth } = await supabase.auth.getUser();
  if (!userAuth.user) throw new Error("Unauthorized");
  const { data: adminUser } = await supabase.from("users").select("role").eq("id", userAuth.user.id).single();
  if (adminUser?.role !== "admin") throw new Error("Forbidden");

  const { error } = await supabase.from("categories").delete().eq("id", categoryId);

  if (error) {
    console.error("Failed to delete category:", error);
    throw new Error(error.message || "カテゴリの削除に失敗しました");
  }

  revalidatePath("/admin/categories");
  return { success: true };
}
