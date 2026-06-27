"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Bubble {
    id: number;
    url: string;
    size: number;
    left: number;
    animationDuration: number;
    animationDelay: number;
}

export function FloatingImagesBackground() {
    const [bubbles, setBubbles] = useState<Bubble[]>([]);

    useEffect(() => {
        const fetchImages = async () => {
            const supabase = createClient();
            // is_published = trueの物件画像をランダムに数件取得する
            const { data, error } = await supabase
                .from('property_images')
                .select('image_url')
                .limit(20);

            // 追加するUnsplashの画像10種類
            const unsplashImages = [
                "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1470071131384-001b85755536?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1418065460487-3e41a6c8e1e3?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800"
            ];

            // DBの画像が取得できれば結合、なければUnsplashのみを使用
            let urls = [...unsplashImages];
            if (!error && data && data.length > 0) {
                const dbUrls = data.map((d: any) => d.image_url);
                urls = [...dbUrls, ...unsplashImages];
            }

            if (urls.length > 0) {
                // ランダムな泡(画像)を生成
                const newBubbles: Bubble[] = [];
                const bubbleCount = 20; // 種類が増えたので同時に表示する数も20個に増やす
                
                for (let i = 0; i < bubbleCount; i++) {
                    const randomUrl = urls[Math.floor(Math.random() * urls.length)];
                    newBubbles.push({
                        id: i,
                        url: randomUrl,
                        // 最小値 90px(現状の最小), 最大値 630px(現状の最大の約3倍) の間でランダム
                        size: Math.random() * 540 + 90, 
                        left: Math.random() * 100, // 0% - 100%
                        animationDuration: Math.random() * 15 + 15, // 15s - 30s
                        animationDelay: Math.random() * 15, // 0s - 15s
                    });
                }
                setBubbles(newBubbles);
            }
        };

        fetchImages();
    }, []);

    // SSR時のHydration不一致を防ぐため、bubblesが空の場合は何も表示しない
    if (bubbles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-primary/5">
            {bubbles.map((bubble) => (
                <div
                    key={bubble.id}
                    // 最大630pxの画像が画面内に初期表示されないよう、bottomを-700pxに設定
                    className="absolute bottom-[-700px] rounded-[50%] overflow-hidden shadow-2xl border-4 border-white/40 animate-float-up"
                    style={{
                        width: `${bubble.size}px`,
                        height: `${bubble.size * 0.85}px`, // 高さを幅より小さくし横長にする
                        left: `${bubble.left}%`,
                        animationDuration: `${bubble.animationDuration}s`,
                        animationDelay: `-${bubble.animationDelay}s`,
                    }}
                >
                    <img 
                        src={bubble.url} 
                        alt="floating bubble" 
                        className="w-full h-full object-cover" 
                    />
                </div>
            ))}
        </div>
    );
}
