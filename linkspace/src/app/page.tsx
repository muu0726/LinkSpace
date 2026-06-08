import { Button } from "@/components/ui/button";
import { AuthForm } from "@/components/auth/AuthForm";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-4 bg-background">
      <h1 className="text-3xl font-bold text-primary">LinkSpaceへようこそ</h1>
      <p className="text-muted-foreground">セージグリーンのテーマカラーと、動作確認テストです</p>
      <AuthForm />
    </div>
  );
}