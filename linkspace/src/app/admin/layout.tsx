import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Home,
  Coins,
  Tags,
  AlertTriangle,
  LogOut
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Admin権限チェック
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/"); // Adminでなければトップにリダイレクト
  }

  const navItems = [
    { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard },
    { href: "/admin/users", label: "ユーザー管理", icon: Users },
    { href: "/admin/properties", label: "物件管理", icon: Home },
    { href: "/admin/points", label: "ポイント手動調整", icon: Coins },
    { href: "/admin/categories", label: "カテゴリ管理", icon: Tags },
    { href: "/admin/logs", label: "システムログ", icon: AlertTriangle },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 flex flex-col hidden md:flex">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Admin Console</h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium text-muted-foreground transition-colors">
            <LogOut className="h-4 w-4" />
            一般画面へ戻る
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
        {children}
      </main>
    </div>
  );
}
