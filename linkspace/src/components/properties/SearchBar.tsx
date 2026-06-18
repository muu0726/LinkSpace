"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 既存のパラメータを初期値として設定
    const [keyword, setKeyword] = useState(searchParams.get("q") || "");
    const [area, setArea] = useState(searchParams.get("area") || "");
    const [tag, setTag] = useState(searchParams.get("tag") || "");

    // よく使われるタグのプリセット
    const popularTags = ["キャンプ", "畑", "駐車場", "絶景", "星空"];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        
        // パラメータの組み立て
        const params = new URLSearchParams();
        if (keyword.trim()) params.set("q", keyword.trim());
        if (area.trim()) params.set("area", area.trim());
        if (tag.trim()) params.set("tag", tag.trim());

        // トップページ（または検索ページ）へリダイレクト
        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 bg-card p-4 rounded-xl border shadow-sm">
                
                {/* キーワード検索 */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input 
                        type="text" 
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="キーワード (例: 富士山)" 
                        className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-12"
                    />
                </div>

                {/* エリア検索 */}
                <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input 
                        type="text" 
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="エリア (例: 山梨県)" 
                        className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-12"
                    />
                </div>

                {/* 検索ボタン */}
                <Button type="submit" className="h-12 px-8 text-base font-medium">
                    検索する
                </Button>
            </form>

            {/* 人気のタグフィルター */}
            <div className="flex flex-wrap items-center gap-2 justify-center">
                <span className="text-sm text-muted-foreground flex items-center mr-2">
                    <Tag size={14} className="mr-1" /> 人気のタグ:
                </span>
                {popularTags.map(t => (
                    <button
                        key={t}
                        onClick={() => {
                            // タグをクリックしたら即座に検索
                            const params = new URLSearchParams(searchParams.toString());
                            if (tag === t) {
                                // 既に選択されていれば解除
                                params.delete("tag");
                                setTag("");
                            } else {
                                params.set("tag", t);
                                setTag(t);
                            }
                            router.push(`/?${params.toString()}`);
                        }}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${tag === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-card-foreground hover:bg-muted'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>
    );
}
