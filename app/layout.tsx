import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "やっとる建設｜積水ハウスリフォーム参考版",
  description:
    "福岡市のやっとる建設株式会社。外壁塗装、屋根塗装、水まわりリフォームを、ご予算に合わせて丁寧にご提案します。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
