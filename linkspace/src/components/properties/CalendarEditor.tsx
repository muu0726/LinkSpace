"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Trash2, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface CalendarEditorProps {
    propertyId: string;
    initialUnavailabilities: {
        id: string;
        start_date: string;
        end_date: string;
    }[];
}

export function CalendarEditor({ propertyId, initialUnavailabilities }: CalendarEditorProps) {
    const supabase = createClient();
    const router = useRouter();
    
    const [unavailabilities, setUnavailabilities] = useState(initialUnavailabilities);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // 不可日としてすでに登録されている日付の配列を計算（表示用）
    const disabledDates = unavailabilities.flatMap(u => {
        const start = new Date(u.start_date);
        const end = new Date(u.end_date);
        const dates = [];
        let current = start;
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    });

    const handleAddUnavailability = async () => {
        if (!selectedDate) {
            setMessage("日付を選択してください。");
            return;
        }

        setLoading(true);
        setMessage("");

        // すでに登録されているかチェック
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const isConflict = unavailabilities.some(u => {
            const start = format(new Date(u.start_date), "yyyy-MM-dd");
            const end = format(new Date(u.end_date), "yyyy-MM-dd");
            return dateStr >= start && dateStr <= end;
        });

        if (isConflict) {
            setMessage("選択した日付はすでに貸出不可として登録されています。");
            setLoading(false);
            return;
        }

        try {
            // 今回は単一日として登録する（1日ごとの登録。UIの簡略化のため）
            const { data, error } = await supabase
                .from('unavailabilities')
                .insert({
                    property_id: propertyId,
                    start_date: dateStr,
                    end_date: dateStr,
                    reason: "オーナー設定"
                })
                .select()
                .single();

            if (error) throw error;

            setUnavailabilities([...unavailabilities, data]);
            setMessage(`${dateStr} を貸出不可日に設定しました。`);
            router.refresh();
        } catch (error: any) {
            console.error("不可日追加エラー:", error);
            setMessage("エラーが発生しました: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUnavailability = async (id: string) => {
        if (!confirm("この不可日設定を解除しますか？")) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('unavailabilities')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setUnavailabilities(unavailabilities.filter(u => u.id !== id));
            setMessage("不可日設定を解除しました。");
            router.refresh();
        } catch (error: any) {
            console.error("不可日削除エラー:", error);
            setMessage("削除エラー: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card p-6 rounded-xl shadow-sm border flex flex-col items-center">
                <h2 className="text-xl font-bold mb-4 w-full text-center">日付を選択してブロック</h2>
                
                <div className="border rounded-xl p-4 bg-background mb-6">
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        locale={ja}
                        disabled={[{ before: new Date() }]} // 過去の日付は選択不可
                        modifiers={{ disabled_custom: disabledDates }}
                        modifiersStyles={{
                            disabled_custom: { backgroundColor: '#fee2e2', color: '#991b1b', textDecoration: 'line-through' }
                        }}
                    />
                </div>

                <div className="w-full text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                        選択中: {selectedDate ? format(selectedDate, "yyyy年MM月dd日", { locale: ja }) : "未選択"}
                    </p>
                    <Button 
                        onClick={handleAddUnavailability} 
                        disabled={!selectedDate || loading}
                        className="w-full"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        この日を貸出不可にする
                    </Button>
                </div>
                
                {message && (
                    <div className={`mt-4 p-3 rounded-md text-sm w-full ${message.includes('エラー') || message.includes('すでに') ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-800'}`}>
                        {message}
                    </div>
                )}
            </div>

            <div className="bg-card p-6 rounded-xl shadow-sm border">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <CalendarIcon className="mr-2" />
                    現在の貸出不可日一覧
                </h2>
                
                {unavailabilities.length === 0 ? (
                    <p className="text-muted-foreground text-sm p-4 text-center border border-dashed rounded-lg bg-muted/20">
                        現在、貸出不可に設定されている日はありません。
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {unavailabilities.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(u => (
                            <li key={u.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                <div>
                                    <span className="font-medium">
                                        {format(new Date(u.start_date), "yyyy年MM月dd日", { locale: ja })}
                                    </span>
                                    {u.start_date !== u.end_date && (
                                        <span className="font-medium">
                                            {" 〜 " + format(new Date(u.end_date), "yyyy年MM月dd日", { locale: ja })}
                                        </span>
                                    )}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDeleteUnavailability(u.id)}
                                    disabled={loading}
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
