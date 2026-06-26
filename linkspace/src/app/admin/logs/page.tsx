import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("system_logs")
    .select(`
      *,
      users:user_id (name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching logs:", error);
    return <div>ログの取得に失敗しました。</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">システムログ</h1>
        <p className="text-muted-foreground mt-2">
          アプリケーションのエラーや、管理者による操作履歴（直近100件）を表示します。
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Level</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Timestamp</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Message</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {logs?.map((log) => (
                <tr key={log.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle">
                    {log.level === 'error' ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Info</Badge>
                    )}
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('ja-JP')}
                  </td>
                  <td className="p-4 align-middle">
                    {log.users ? `${log.users.name} (${log.users.email})` : "System/Guest"}
                  </td>
                  <td className="p-4 align-middle font-medium">
                    {log.message}
                  </td>
                  <td className="p-4 align-middle text-xs font-mono text-muted-foreground max-w-xs truncate" title={JSON.stringify(log.details)}>
                    {log.details ? JSON.stringify(log.details) : "-"}
                  </td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    ログはありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
