"use client";

import { useState } from "react";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { ja } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Button } from "@/components/ui/button";

interface Unavailability {
  start_date: string;
  end_date: string;
}

interface PropertyCalendarProps {
  unavailabilities: Unavailability[];
  pricePerDay: number;
}

export function PropertyCalendar({ unavailabilities, pricePerDay }: PropertyCalendarProps) {
  // 予約期間の選択状態 (from, to)
  const [selectedRange, setSelectedRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // 予約不可日のフォーマット変換 (Dateオブジェクトの配列、またはDateRangeの配列へ)
  const disabledDates = [
    // 過去の日は選択不可
    { before: startOfToday() },
    ...unavailabilities.map((u) => ({
      from: new Date(u.start_date),
      to: new Date(u.end_date),
    }))
  ];

  // 選択日数の計算
  let daysCount = 0;
  if (selectedRange.from && selectedRange.to) {
    const diffTime = Math.abs(selectedRange.to.getTime() - selectedRange.from.getTime());
    daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 1泊ではなく日帰りの「利用日数」として計算
  } else if (selectedRange.from) {
    daysCount = 1;
  }

  const totalPrice = daysCount * pricePerDay;

  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm sticky top-24">
      <div className="mb-4">
        <span className="text-2xl font-bold">{pricePerDay.toLocaleString()}</span>
        <span className="text-muted-foreground font-medium"> LP / 日</span>
      </div>

      <div className="border rounded-md p-4 mb-6 flex justify-center bg-background">
        <DayPicker
          mode="range"
          selected={selectedRange}
          onSelect={(range: any) => setSelectedRange(range)}
          disabled={disabledDates}
          locale={ja}
          numberOfMonths={1}
          pagedNavigation
        />
      </div>

      {daysCount > 0 ? (
        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-sm">
            <span>利用期間</span>
            <span className="font-medium">
              {selectedRange.from ? format(selectedRange.from, "yyyy/MM/dd") : ""} 
              {selectedRange.to ? ` 〜 ${format(selectedRange.to, "yyyy/MM/dd")}` : ""}
              （{daysCount}日間）
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-4 border-t">
            <span>合計</span>
            <span className="text-primary">{totalPrice.toLocaleString()} LP</span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground mb-6 text-center">
          カレンダーから利用希望日を選択してください。
        </div>
      )}

      <Button className="w-full h-12 text-base font-bold" disabled={daysCount === 0}>
        予約リクエストへ進む
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-3">
        ※まだ予約は確定しません。
      </p>

      {/* カスタムスタイル: react-day-pickerをセージグリーンテーマに合わせる */}
      <style jsx global>{`
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: hsl(var(--primary));
          --rdp-background-color: hsl(var(--primary) / 0.1);
          --rdp-accent-color-dark: hsl(var(--primary));
          --rdp-background-color-dark: hsl(var(--primary) / 0.2);
          --rdp-outline: 2px solid hsl(var(--primary));
          --rdp-outline-selected: 2px solid hsl(var(--primary));
          margin: 0;
        }
        .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
          color: hsl(var(--primary-foreground));
          background-color: var(--rdp-accent-color);
        }
      `}</style>
    </div>
  );
}
