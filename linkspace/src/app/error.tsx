"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ログ収集サービス等へエラーを送信可能
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <AlertOctagon className="w-16 h-16 text-destructive mb-4" />
      <h1 className="text-3xl font-bold mb-2">予期せぬエラーが発生しました</h1>
      <p className="text-muted-foreground mb-8">
        システムで問題が発生しました。しばらく待ってから再度お試しください。
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => reset()}>
          もう一度試す
        </Button>
        <Link href="/">
          <Button className="bg-[#84a98c] hover:bg-[#6b8c72] text-white">
            トップページへ戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}
