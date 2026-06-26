"use client";

import { useState } from "react";
import { addCategory, deleteCategory } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function CategoryClient({ categories }: { categories: any[] }) {
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setLoading(true);
    try {
      await addCategory(newCategory.trim());
      toast.success("カテゴリを追加しました");
      setNewCategory("");
    } catch (error: any) {
      toast.error(error.message || "追加に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？このカテゴリを使っている物件に影響が出る可能性があります。")) return;
    
    setDeletingId(id);
    try {
      await deleteCategory(id);
      toast.success("カテゴリを削除しました");
    } catch (error: any) {
      toast.error(error.message || "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="flex gap-4 max-w-sm">
        <Input
          placeholder="新しいカテゴリ名"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          disabled={loading}
          required
        />
        <Button type="submit" disabled={loading}>
          追加
        </Button>
      </form>

      <div className="rounded-md border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">カテゴリ名</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle text-muted-foreground text-xs">{cat.id}</td>
                  <td className="p-4 align-middle font-medium">{cat.name}</td>
                  <td className="p-4 align-middle text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-muted-foreground">
                    カテゴリがありません
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
