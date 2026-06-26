"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        
        supabase.from('notifications')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('is_read', false)
            .then(({ count }) => {
                if (count !== null) setUnreadCount(count);
            });

        const channel = supabase.channel('realtime_notifications')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                setUnreadCount(prev => prev + 1);
                // Optional: Show a browser alert or custom toast here
                // alert(`新しい通知があります: ${(payload.new as any).message}`);
            })
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                if ((payload.new as any).is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase]);

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
                                <Button variant="ghost" className="relative flex items-center gap-2">
                                    <Bell size={18} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 left-4 bg-destructive text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                    <span className="hidden md:inline">マイページ</span>
                                </Button>
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
                    <ThemeToggle />
                </nav>
            </div>
        </header>
    );
}
