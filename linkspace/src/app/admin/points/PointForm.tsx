"use client";

import { useState } from "react";
import { adjustPoints } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export function PointForm({ users }: { users: any[] }) {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount || !reason) {
      toast.error("すべての項目を入力してください");
      return;
    }

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount === 0) {
      toast.error("有効な金額を入力してください");
      return;
    }

    setLoading(true);
    try {
      await adjustPoints(selectedUser, numAmount, reason);
      toast.success("ポイントの調整に成功しました");
      setAmount("");
      setReason("");
      setSelectedUser("");
    } catch (error: any) {
      toast.error(error.message || "ポイントの調整に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg border rounded-lg p-6 bg-card">
      <div className="space-y-2">
        <Label htmlFor="user">対象ユーザー</Label>
        <select
          id="user"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          required
        >
          <option value="" disabled>ユーザーを選択してください</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || "名称未設定"} ({u.email}) - {u.points_balance} LP
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">調整ポイント (マイナスで没収)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="例: 10000 または -5000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">理由 (システムログ用)</Label>
        <Input
          id="reason"
          type="text"
          placeholder="例: キャンセルトラブル対応による補填"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "処理中..." : "ポイントを調整する"}
      </Button>
    </form>
  );
}
