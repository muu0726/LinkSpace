"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-3xl font-bold mb-2">ページが見つかりません</h1>
      <p className="text-muted-foreground mb-8">
        お探しのページは削除されたか、URLが間違っている可能性があります。
      </p>
      <Link href="/">
        <Button size="lg" className="bg-[#84a98c] hover:bg-[#6b8c72] text-white">
          トップページへ戻る
        </Button>
      </Link>
    </div>
  );
}
