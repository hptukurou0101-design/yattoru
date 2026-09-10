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
      {/*
        公開前のテストサイトのため検索避けを入れている。本番公開時に外すこと。
        metadata.robots は vinext 0.0.50 が出力しないため、React 19 の
        hoisting でこの meta を <head> へ持ち上げている。
        全ページがこのレイアウトを通るので、下層ページ側の対応は不要。
        解除手順は docs/noindex.md を参照。
      */}
      <meta name="robots" content="noindex, nofollow" />
      <body>{children}</body>
    </html>
  );
}
