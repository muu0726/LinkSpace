// linkspace/src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// PWAのテーマカラー（セージグリーン）を設定
export const viewport: Viewport = {
  themeColor: "#84a98c",
};

// サイトのメタデータとマニフェストを設定
export const metadata: Metadata = {
  title: "LinkSpace | 空き家・空き地貸し出しプラットフォーム",
  description: "放置された土地を地域の資産に変える「メッセージレス・リクエスト制」の貸し出しプラットフォーム",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja" // langをjaに変更
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
