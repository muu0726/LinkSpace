import { createClient } from "@/lib/supabase/server";
import { CategoryClient } from "./CategoryClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return <div>カテゴリの取得に失敗しました。</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">カテゴリ管理</h1>
        <p className="text-muted-foreground mt-2">
          検索や登録画面で使用される「利用目的タグ」のマスターデータを管理します。
        </p>
      </div>

      <CategoryClient categories={categories || []} />
    </div>
  );
}
