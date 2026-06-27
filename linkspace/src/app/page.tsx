import { Suspense } from "react";
import { PropertyList } from "@/components/properties/PropertyList";
import { PropertyCardSkeleton } from "@/components/properties/PropertyCardSkeleton";
import { SearchBar } from "@/components/properties/SearchBar";
import { HeroSlideshow } from "@/components/ui/HeroSlideshow";
import { FadeInScroll } from "@/components/ui/FadeInScroll";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams?.q === 'string' ? resolvedParams.q : undefined;
  const area = typeof resolvedParams?.area === 'string' ? resolvedParams.area : undefined;
  const tag = typeof resolvedParams?.tag === 'string' ? resolvedParams.tag : undefined;
  
  const minLat = typeof resolvedParams?.minLat === 'string' ? parseFloat(resolvedParams.minLat) : undefined;
  const maxLat = typeof resolvedParams?.maxLat === 'string' ? parseFloat(resolvedParams.maxLat) : undefined;
  const minLng = typeof resolvedParams?.minLng === 'string' ? parseFloat(resolvedParams.minLng) : undefined;
  const maxLng = typeof resolvedParams?.maxLng === 'string' ? parseFloat(resolvedParams.maxLng) : undefined;

  // Suspenseのkeyにパラメータを含めることで、検索条件が変わるたびに再フェッチ・スケルトン表示させる
  const suspenseKey = `${q}-${area}-${tag}-${minLat}-${maxLat}-${minLng}-${maxLng}`;

  return (
    <div className="min-h-screen bg-background">
      {/* ヒーローセクション */}
      <section className="relative py-24 px-6 text-center overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
        <HeroSlideshow />
        <div className="relative z-10 w-full max-w-4xl mx-auto">
          {/* 検索バー */}
          <div className="bg-background/95 backdrop-blur rounded-2xl p-4 shadow-xl">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* 物件一覧セクション */}
      <section className="container mx-auto px-4 py-12">
        <FadeInScroll>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              {q || area || tag ? "検索結果" : "新着物件"}
            </h2>
          </div>
          
          <Suspense key={suspenseKey} fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          }>
            <PropertyList 
              q={q} 
              area={area} 
              tag={tag} 
              minLat={minLat}
              maxLat={maxLat}
              minLng={minLng}
              maxLng={maxLng}
            />
          </Suspense>
        </FadeInScroll>
      </section>
    </div>
  );
}