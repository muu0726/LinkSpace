"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
    const supabase = createClient();
    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    return (
        <Button onClick={handleLogout} variant="destructive">
            ログアウト
        </Button>
    );
}