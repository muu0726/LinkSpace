"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

export function Header() {
    const [user, setUser] = useState<User | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user ?? null);
        });

        // 初期セッションの取得
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    return (
        <header className="border-b bg-background">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="text-xl font-bold text-[#84a98c]">
                    LinkSpace
                </Link>
                <nav className="flex items-center gap-4">
                    {user ? (
                        <>
                            <Link href="/properties/new">
                                <Button variant="outline" className="hidden md:flex">
                                    物件を登録する
                                </Button>
                            </Link>
                            <Link href="/mypage">
                                <Button variant="ghost">マイページ</Button>
                            </Link>
                            <Button variant="outline" onClick={handleSignOut}>
                                ログアウト
                            </Button>
                        </>
                    ) : (
                        <Link href="/login">
                            <Button>ログイン / 登録</Button>
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
