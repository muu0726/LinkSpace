"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "./PropertyCard";

// MapコンポーネントはSSRを無効化して動的インポート
const PropertyMap = dynamic(() => import("./PropertyMap"), { ssr: false, loading: () => <div className="w-full h-[600px] bg-muted animate-pulse rounded-xl flex items-center justify-center">地図を読み込み中...</div> });

export function PropertyViewContainer({ properties }: { properties: any[] }) {
    const [viewMode, setViewMode] = useState<"list" | "map">("list");

    if (!properties || properties.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                現在公開されている物件はありません。条件を変えて検索してみてください。
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 表示切り替えトグル */}
            <div className="flex justify-end mb-4">
                <div className="inline-flex bg-muted p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <List size={16} /> リスト
                    </button>
                    <button
                        onClick={() => setViewMode("map")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            viewMode === "map" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <MapIcon size={16} /> マップ
                    </button>
                </div>
            </div>

            {/* コンテンツ */}
            {viewMode === "list" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {properties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            ) : (
                <PropertyMap properties={properties} />
            )}
        </div>
    );
}
