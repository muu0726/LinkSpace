"use client";

import { useState } from "react";
import { togglePropertyPublish } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export function PropertyListClient({ properties }: { properties: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = async (propertyId: string, currentPublished: boolean) => {
    setLoadingId(propertyId);
    try {
      await togglePropertyPublish(propertyId, currentPublished);
      toast.success(
        currentPublished ? "物件を非公開にしました" : "物件を公開状態に戻しました"
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
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID / Title</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Owner</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
              <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {properties.map((property) => (
              <tr key={property.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <td className="p-4 align-middle">
                  <div className="flex flex-col">
                    <Link href={`/properties/${property.id}`} className="font-medium hover:underline text-primary">
                      {property.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">{property.id.substring(0, 8)}...</span>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <div className="flex flex-col">
                    <span>{property.users?.name || "ゲスト"}</span>
                    <span className="text-xs text-muted-foreground">{property.users?.email}</span>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  {property.is_published ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                      公開中
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
                      非公開
                    </Badge>
                  )}
                </td>
                <td className="p-4 align-middle text-right">
                  <Button
                    variant={property.is_published ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleToggle(property.id, property.is_published)}
                    disabled={loadingId === property.id}
                    className="gap-2"
                  >
                    {property.is_published ? (
                      <><EyeOff className="h-4 w-4" /> 強制非公開</>
                    ) : (
                      <><Eye className="h-4 w-4" /> 公開許可</>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
