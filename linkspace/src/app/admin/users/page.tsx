import { createClient } from "@/lib/supabase/server";
import { UserListClient } from "./UserList";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return <div>ユーザーの取得に失敗しました。</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ユーザー管理</h1>
        <p className="text-muted-foreground mt-2">
          プラットフォームのユーザー一覧とアカウント状況（凍結）の管理を行います。
        </p>
      </div>

      <UserListClient users={users || []} />
    </div>
  );
}
