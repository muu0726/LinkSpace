"use client";

import { useState, useEffect } from "react";
import { getPropertyReviews } from "@/app/actions/review";
import { Star, User } from "lucide-react";

export function PropertyReviews({ propertyId }: { propertyId: string }) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [average, setAverage] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            const res = await getPropertyReviews(propertyId);
            if (res.success) {
                setReviews(res.data || []);
                setAverage(res.averageScore || 0);
            }
            setLoading(false);
        };
        fetchReviews();
    }, [propertyId]);

    if (loading) return <div className="animate-pulse h-20 bg-muted rounded-md w-full"></div>;
    if (reviews.length === 0) return <p className="text-muted-foreground text-sm">まだレビューはありません。</p>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Star className="text-yellow-400 fill-current" size={24} />
                <span className="text-2xl font-bold">{average.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviews.length}件のレビュー)</span>
            </div>
            
            <div className="grid gap-6">
                {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6 last:border-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                {review.users?.avatar_url ? (
                                    <img src={review.users.avatar_url} alt={review.users.name || "ユーザー"} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-sm">{review.users?.name || "匿名ユーザー"}</div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString('ja-JP')}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star 
                                    key={i} 
                                    size={14} 
                                    className={i < review.rating ? "text-yellow-400 fill-current" : "text-muted-foreground/30"} 
                                />
                            ))}
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
