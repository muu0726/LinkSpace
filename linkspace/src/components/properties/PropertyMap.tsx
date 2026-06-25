"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

// Leafletのデフォルトアイコンのパス問題を修正
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// すべてのピンが収まるようにズーム調整するコンポーネント
function MapBounds({ properties }: { properties: any[] }) {
    const map = useMap();

    useEffect(() => {
        if (properties && properties.length > 0) {
            const validProperties = properties.filter(p => p.latitude && p.longitude);
            if (validProperties.length === 0) return;

            const bounds = L.latLngBounds(validProperties.map(p => [p.latitude, p.longitude]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, properties]);

    return null;
}

function SearchAreaButton() {
    const map = useMap();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    const handleSearch = () => {
        setLoading(true);
        const bounds = map.getBounds();
        const minLat = bounds.getSouth();
        const maxLat = bounds.getNorth();
        const minLng = bounds.getWest();
        const maxLng = bounds.getEast();

        const params = new URLSearchParams(searchParams.toString());
        params.set('minLat', minLat.toString());
        params.set('maxLat', maxLat.toString());
        params.set('minLng', minLng.toString());
        params.set('maxLng', maxLng.toString());

        router.push(`/?${params.toString()}`, { scroll: false });
        setTimeout(() => setLoading(false), 1000);
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] leaflet-control">
            <button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md font-bold text-sm text-primary hover:bg-white transition-colors border border-primary/20 pointer-events-auto"
            >
                {loading ? "検索中..." : "このエリアで検索"}
            </button>
        </div>
    );
}

interface Property {
    id: string;
    title: string;
    address: string;
    price_per_day: number;
    latitude: number;
    longitude: number;
    tags?: string[];
    property_images?: { image_url: string }[];
}

export default function PropertyMap({ properties }: { properties: Property[] }) {
    // デフォルトの中心位置（東京駅付近）
    const defaultCenter: [number, number] = [35.6812, 139.7671];

    return (
        <div className="w-full h-[600px] rounded-xl overflow-hidden border shadow-sm relative z-0">
            <MapContainer 
                center={defaultCenter} 
                zoom={10} 
                scrollWheelZoom={true} 
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {properties.map((property) => {
                    if (!property.latitude || !property.longitude) return null;
                    
                    const imageUrl = property.property_images && property.property_images.length > 0
                        ? property.property_images[0].image_url
                        : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800";

                    return (
                        <Marker 
                            key={property.id} 
                            position={[property.latitude, property.longitude]}
                        >
                            <Popup className="property-popup">
                                <div className="w-48 flex flex-col gap-2">
                                    <img src={imageUrl} alt={property.title} className="w-full h-24 object-cover rounded-md" />
                                    <h3 className="font-bold text-sm leading-tight m-0">{property.title}</h3>
                                    <p className="text-xs text-muted-foreground m-0 flex items-center">
                                        <MapPin size={12} className="mr-1 inline" />
                                        {property.address}
                                    </p>
                                    <p className="text-primary font-bold m-0 text-sm">{property.price_per_day.toLocaleString()} LP/日</p>
                                    <Link href={`/properties/${property.id}`} className="text-xs text-center bg-primary text-primary-foreground py-1.5 rounded-md mt-1 hover:bg-primary/90 transition-colors">
                                        詳細を見る
                                    </Link>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
                
                <MapBounds properties={properties} />
                <SearchAreaButton />
            </MapContainer>

            {/* z-indexの調整用CSS */}
            <style jsx global>{`
                .leaflet-container {
                    z-index: 10;
                }
                .property-popup .leaflet-popup-content-wrapper {
                    padding: 0;
                    border-radius: 0.5rem;
                }
                .property-popup .leaflet-popup-content {
                    margin: 8px;
                }
            `}</style>
        </div>
    );
}
