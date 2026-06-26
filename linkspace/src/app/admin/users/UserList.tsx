"use client";

import { useState } from "react";
import { toggleUserStatus } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Ban, CheckCircle } from "lucide-react";

export function UserListClient({ users }: { users: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = async (userId: string, currentStatus: string) => {
    setLoadingId(userId);
    try {
      await toggleUserStatus(userId, currentStatus);
      toast.success(
        currentStatus === "active" ? "ユーザーを凍結しました" : "ユーザーの凍結を解除しました"
      );
    } catch (error) {
      toast.error("ステータスの変更に失敗しました");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID / Name</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">LP</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {users.map((user) => (
              <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <td className="p-4 align-middle">
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name || "名称未設定"}</span>
                    <span className="text-xs text-muted-foreground">{user.id.substring(0, 8)}...</span>
                  </div>
                </td>
                <td className="p-4 align-middle">{user.email}</td>
                <td className="p-4 align-middle">{user.points_balance?.toLocaleString()} LP</td>
                <td className="p-4 align-middle">
                  {user.status === "active" ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                      Suspended
                    </Badge>
                  )}
                </td>
                <td className="p-4 align-middle text-right">
                  {user.role === "admin" ? (
                    <Badge variant="secondary">Admin</Badge>
                  ) : (
                    <Button
                      variant={user.status === "active" ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleToggle(user.id, user.status)}
                      disabled={loadingId === user.id}
                      className="gap-2"
                    >
                      {user.status === "active" ? (
                        <><Ban className="h-4 w-4" /> 凍結する</>
                      ) : (
                        <><CheckCircle className="h-4 w-4" /> 解除する</>
                      )}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
