import Link from "next/link";
import Image from "next/image";
import { MapPin, User as UserIcon } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";

interface Property {
  id: string;
  title: string;
  address: string;
  price_per_day: number;
  tags: string[];
  property_images?: { image_url: string }[];
  isFavorite?: boolean;
  users?: { name: string; avatar_url: string | null } | null;
}

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  // 画像がない場合はダミーのプレースホルダー画像を表示
  const imageUrl = property.property_images && property.property_images.length > 0
    ? property.property_images[0].image_url
    : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800"; // 仮のデフォルト画像

  return (
    <div className="relative h-full block">
      {/* お気に入りボタン (リンクの上に配置するため position-absolute で上書き) */}
      <div className="absolute top-3 right-3 z-10">
        <FavoriteButton 
          propertyId={property.id} 
          initialIsFavorite={!!property.isFavorite} 
          className="bg-white/80 backdrop-blur-md hover:bg-white rounded-full p-2 shadow-sm border border-black/5"
        />
      </div>

      <Link href={`/properties/${property.id}`} className="group block h-full">
        <div className="flex flex-col h-full rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="flex flex-col flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
              {property.title}
            </h3>
          </div>
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <MapPin size={16} className="mr-1 flex-shrink-0" />
            <span className="truncate">{property.address}</span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0 border">
              {property.users?.avatar_url ? (
                <div className="relative w-full h-full">
                  <Image src={property.users.avatar_url} alt="Owner" fill sizes="24px" className="object-cover" />
                </div>
              ) : (
                <UserIcon size={14} className="text-muted-foreground" />
              )}
            </div>
            <span className="text-sm font-medium text-muted-foreground truncate">
              {property.users?.name || "ゲスト"}
            </span>
          </div>
          
          {property.tags && property.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4 mt-auto">
              {property.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  {tag}
                </span>
              ))}
              {property.tags.length > 3 && (
                <span className="text-xs text-muted-foreground ml-1">+{property.tags.length - 3}</span>
              )}
            </div>
          )}
          
          <div className="mt-auto pt-4 border-t flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">{property.price_per_day.toLocaleString()}</span>
              <span className="text-sm font-medium text-muted-foreground">LP / 日</span>
            </div>
            <span className="text-sm font-bold text-primary group-hover:underline">
              詳細を見る &rarr;
            </span>
          </div>
        </div>
        </div>
      </Link>
    </div>
  );
}
