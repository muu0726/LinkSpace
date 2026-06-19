import { Suspense } from "react";
import { PropertyList } from "@/components/properties/PropertyList";
import { PropertyCardSkeleton } from "@/components/properties/PropertyCardSkeleton";
import { SearchBar } from "@/components/properties/SearchBar";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // searchParamsからキーワードなどを抽出（Next.js 14以下での一般的な取得方法。15の場合はawait searchParamsが必要な場合がある）
  // 念のため await searchParams をする (Next.js 15対応)
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams?.q === 'string' ? resolvedParams.q : undefined;
  const area = typeof resolvedParams?.area === 'string' ? resolvedParams.area : undefined;
  const tag = typeof resolvedParams?.tag === 'string' ? resolvedParams.tag : undefined;

  // Suspenseのkeyにパラメータを含めることで、検索条件が変わるたびに再フェッチ・スケルトン表示させる
  const suspenseKey = `${q}-${area}-${tag}`;

  return (
    <div className="min-h-screen bg-background">
      {/* ヒーローセクション */}
      <section className="bg-primary/5 py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
          眠っている土地を、地域の資産に。
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          LinkSpaceは、使われていない空き家や空き地を、キャンプや農園、駐車場として簡単に貸し借りできるプラットフォームです。
        </p>
        
        {/* 検索バー */}
        <SearchBar />
      </section>

      {/* 物件一覧セクション */}
      <section className="container mx-auto px-4 py-12">
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
          <PropertyList q={q} area={area} tag={tag} />
        </Suspense>
      </section>
    </div>
  );
}