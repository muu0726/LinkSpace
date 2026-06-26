import { createClient } from "@/lib/supabase/server";
import { PointForm } from "./PointForm";

export const dynamic = "force-dynamic";

export default async function AdminPointsPage() {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, email, points_balance")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching users:", error);
    return <div>ユーザーの取得に失敗しました。</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ポイント手動調整</h1>
        <p className="text-muted-foreground mt-2">
          トラブル対応や補填のため、指定したユーザーのポイントを直接増減させます。
        </p>
      </div>

      <PointForm users={users || []} />
    </div>
  );
}
