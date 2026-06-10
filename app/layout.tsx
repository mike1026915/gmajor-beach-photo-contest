import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "漂亮一夏！G大調福隆攝影比賽",
  description: "合唱團照片上傳與投票活動",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
