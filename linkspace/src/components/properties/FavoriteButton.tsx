"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface FavoriteButtonProps {
    propertyId: string;
    initialIsFavorite: boolean;
    className?: string;
    showText?: boolean;
}

export function FavoriteButton({ propertyId, initialIsFavorite, className = "", showText = false }: FavoriteButtonProps) {
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault(); // リンククリックなどのイベント伝播を防ぐ
        e.stopPropagation();

        if (isLoading) return;
        setIsLoading(true);

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session?.user;

            if (!user) {
                // ログインしていない場合はログイン画面へ
                alert("お気に入り機能を利用するにはログインが必要です。");
                router.push("/auth");
                return;
            }

            if (isFavorite) {
                // お気に入り解除
                const { error } = await supabase
                    .from("favorites")
                    .delete()
                    .eq("property_id", propertyId)
                    .eq("user_id", user.id);

                if (error) throw error;
                setIsFavorite(false);
            } else {
                // お気に入り登録
                const { error } = await supabase
                    .from("favorites")
                    .insert([{ property_id: propertyId, user_id: user.id }]);

                if (error) throw error;
                setIsFavorite(true);
            }
            
            router.refresh(); // ページ全体のデータを更新
        } catch (error) {
            console.error("お気に入り更新エラー:", error);
            alert("エラーが発生しました。もう一度お試しください。");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={toggleFavorite}
            disabled={isLoading}
            className={`flex items-center justify-center gap-1.5 transition-all active:scale-95 ${className} ${
                isFavorite 
                    ? "text-rose-500 hover:text-rose-600" 
                    : "text-muted-foreground hover:text-rose-500"
            }`}
            aria-label="お気に入り"
        >
            <Heart 
                size={20} 
                className={isFavorite ? "fill-current" : ""} 
            />
            {showText && (
                <span className="text-sm font-medium">{isFavorite ? "保存済み" : "保存する"}</span>
            )}
        </button>
    );
}
