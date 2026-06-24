"use client";

import { useState, useEffect } from "react";
import { getPropertyQA, submitQuestion, submitAnswer } from "@/app/actions/qa";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User, MessageCircle, Reply } from "lucide-react";

export function PropertyQA({ propertyId, isOwner }: { propertyId: string, isOwner: boolean }) {
    const [qaList, setQaList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [questionText, setQuestionText] = useState("");
    const [answerText, setAnswerText] = useState<{ [key: string]: string }>({});
    const [submitting, setSubmitting] = useState(false);

    const fetchQA = async () => {
        setLoading(true);
        const res = await getPropertyQA(propertyId);
        if (res.success) {
            setQaList(res.data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchQA();
    }, [propertyId]);

    const handleQuestionSubmit = async () => {
        if (!questionText.trim()) return;
        setSubmitting(true);
        const res = await submitQuestion(propertyId, questionText);
        if (res.success) {
            setQuestionText("");
            await fetchQA();
        } else {
            alert(res.error || "エラーが発生しました");
        }
        setSubmitting(false);
    };

    const handleAnswerSubmit = async (questionId: string) => {
        const text = answerText[questionId];
        if (!text || !text.trim()) return;
        setSubmitting(true);
        const res = await submitAnswer(questionId, text);
        if (res.success) {
            setAnswerText(prev => ({ ...prev, [questionId]: "" }));
            await fetchQA();
        } else {
            alert(res.error || "エラーが発生しました");
        }
        setSubmitting(false);
    };

    if (loading) return <div className="animate-pulse h-32 bg-muted rounded-md w-full"></div>;

    return (
        <div className="space-y-8">
            {/* 質問投稿フォーム（ホスト以外） */}
            {!isOwner && (
                <div className="bg-card p-4 rounded-xl border">
                    <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                        <MessageCircle size={16} /> ホストに質問する
                    </h3>
                    <Textarea
                        placeholder="物件に関する質問を入力してください（公開されます）"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        className="mb-3"
                    />
                    <div className="flex justify-end">
                        <Button 
                            onClick={handleQuestionSubmit} 
                            disabled={!questionText.trim() || submitting}
                        >
                            質問を送信
                        </Button>
                    </div>
                </div>
            )}

            {/* Q&A一覧 */}
            <div className="space-y-6">
                {qaList.length === 0 ? (
                    <p className="text-muted-foreground text-sm">まだ質問はありません。</p>
                ) : (
                    qaList.map((q) => (
                        <div key={q.id} className="bg-muted/30 p-4 rounded-xl border">
                            {/* 質問部分 */}
                            <div className="flex gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 mt-1">
                                    {q.users?.avatar_url ? (
                                        <img src={q.users.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={16} className="text-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm">{q.users?.name || "匿名ユーザー"}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(q.created_at).toLocaleDateString('ja-JP')}
                                        </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{q.content}</p>
                                </div>
                            </div>

                            {/* 回答部分 */}
                            {q.answers && q.answers.length > 0 ? (
                                <div className="ml-11 bg-primary/5 p-3 rounded-lg border border-primary/10 relative">
                                    <Reply size={16} className="absolute -left-5 top-3 text-primary/50 rotate-180" />
                                    {q.answers.map((ans: any) => (
                                        <div key={ans.id} className="mb-2 last:mb-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-sm text-primary">ホスト</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(ans.created_at).toLocaleDateString('ja-JP')}
                                                </span>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{ans.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                isOwner && (
                                    <div className="ml-11 mt-3">
                                        <Textarea
                                            placeholder="回答を入力..."
                                            value={answerText[q.id] || ""}
                                            onChange={(e) => setAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
                                            className="mb-2 text-sm min-h-[80px]"
                                        />
                                        <div className="flex justify-end">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => handleAnswerSubmit(q.id)}
                                                disabled={!answerText[q.id]?.trim() || submitting}
                                            >
                                                回答する
                                            </Button>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
