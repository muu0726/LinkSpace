"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { submitReview } from "@/app/actions/review";

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const [reservationId, setReservationId] = useState<string>("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        params.then(p => setReservationId(p.id));
    }, [params]);

    const handleSubmit = async () => {
        if (!reservationId) return;
        setSubmitting(true);
        // Note: submitReview needs to know if the user is the borrower (reviewing host/property) or the host (reviewing borrower).
        const res = await submitReview(reservationId, rating, comment);
        
        if (res.success) {
            alert("レビューを投稿しました。ありがとうございました！");
            router.push("/mypage");
        } else {
            alert(res.error || "エラーが発生しました");
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto max-w-2xl px-4 py-12">
            <h1 className="text-2xl font-bold mb-6">レビューを投稿する</h1>
            <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
                <div>
                    <h3 className="font-medium mb-3">評価</h3>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`transition-colors p-1 rounded-full hover:bg-muted ${rating >= star ? 'text-yellow-400' : 'text-muted-foreground/30'}`}
                            >
                                <Star className="fill-current" size={32} />
                            </button>
                        ))}
                    </div>
                </div>
                
                <div>
                    <h3 className="font-medium mb-3">コメント</h3>
                    <Textarea 
                        placeholder="物件の良かった点や、ホスト/ゲストへのメッセージをご記入ください。"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[150px]"
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => router.back()}>
                        キャンセル
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting || !comment.trim()}>
                        {submitting ? "送信中..." : "レビューを送信"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
