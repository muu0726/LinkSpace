"use client";

import { useState, useEffect } from "react";

// ダミー画像のURL配列
const images = [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1920"
];

export function HeroSlideshow() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000); // 5秒ごとに切り替え

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            {images.map((img, index) => (
                <div
                    key={img}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        index === currentIndex ? "opacity-100" : "opacity-0"
                    }`}
                >
                    <img 
                        src={img} 
                        alt={`Hero Background ${index + 1}`}
                        className="w-full h-full object-cover object-center"
                    />
                </div>
            ))}
            {/* ダークオーバーレイ: 画像を少し暗くして検索バーを際立たせる */}
            <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />
        </div>
    );
}
