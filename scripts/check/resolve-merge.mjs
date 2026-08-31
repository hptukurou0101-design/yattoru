#!/usr/bin/env node
/**
 * 下層ページ受領時のマージ競合を解決する（app/page.tsx）
 *
 * 競合の内訳と解決方針:
 *   1. WrapText + BrandMark（HEAD） vs なし（新版）
 *      → BrandMark は components/site-chrome.tsx へ移ったので削除。
 *        WrapText は components/wrap-text.tsx へ切り出したので import に置き換える。
 *   2. WrapText 付きの本文 + href="#first"（HEAD） vs 素の本文 + href="/features"（新版）
 *      → 両取り。改行指定は残し、リンク先は実ページへ。
 *   3. aria-label 付き + href="#contact"（HEAD） vs 実ページ URL + ラベルなし（新版）
 *      → 両取り。実ページ URL に aria-label を付ける。
 *   4. フッター + モバイルメニューの補助スクリプト（HEAD） vs </SiteFrame>（新版）
 *      → 新版を採用。補助スクリプトは components/site-chrome.tsx へ移す。
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "app/page.tsx";
let s = readFileSync(FILE, "utf8");

const cut = (from, to, label) => {
  const i = s.indexOf(from);
  if (i < 0) {
    console.error(`見つかりません: ${label}`);
    process.exit(1);
  }
  const j = s.indexOf(to, i);
  if (j < 0) {
    console.error(`終端が見つかりません: ${label}`);
    process.exit(1);
  }
  return { i, j: j + to.length };
};

const replaceRange = (from, to, replacement, label) => {
  const { i, j } = cut(from, to, label);
  s = s.slice(0, i) + replacement + s.slice(j);
  console.log(`  解決: ${label}`);
};

/* ---- 競合1: WrapText / BrandMark ---- */
replaceRange("<<<<<<< HEAD\n/**\n * 和文の改行位置", ">>>>>>> vendor-allpages\n", "", "競合1 WrapText/BrandMark を削除（共有部品へ移動）");

/* ---- 競合2: 特長パネルの本文とリンク ---- */
replaceRange(
  "<<<<<<< HEAD\n            <p><WrapText",
  ">>>>>>> vendor-allpages\n",
  `            <p><WrapText text={"ご希望とご予算を最初に整理し、\\n必要な工事と選べる方法を丁寧にご説明します。\\n工事が終わったあとも、\\n住まいのことを気軽に相談できる関係を大切にしています。"} /></p>
            <a className="white-button" href="/features">
`,
  "競合2 改行指定を維持しつつリンク先を /features へ"
);

/* ---- 競合3: 施工事例カードのリンク ---- */
replaceRange(
  "<<<<<<< HEAD\n                <a href=\"#contact\" className=\"work-image\"",
  ">>>>>>> vendor-allpages\n",
  `                <a
                  href={["/works/bright-ldk", "/works/exterior-roof", "/works/kitchen-flow"][index]}
                  className="work-image"
                  aria-label={\`施工事例「\${work.title}」の詳細\`}
                >
`,
  "競合3 実ページ URL に aria-label を付与"
);

/* ---- 競合4: フッターと補助スクリプト ---- */
replaceRange("<<<<<<< HEAD\n\n      <footer", ">>>>>>> vendor-allpages\n", "    </SiteFrame>\n", "競合4 フッターは SiteFrame へ委譲");

/* ---- WrapText を共有部品から読み込む ---- */
if (!s.includes('from "@/components/wrap-text"')) {
  const anchor = 'import { SiteFrame } from "@/components/site-chrome";';
  if (!s.includes(anchor)) {
    console.error("SiteFrame の import が見つかりません");
    process.exit(1);
  }
  s = s.replace(anchor, `${anchor}\nimport { WrapText } from "@/components/wrap-text";`);
  console.log("  追加: WrapText の import");
}

writeFileSync(FILE, s);

const left = (s.match(/^(<<<<<<<|=======|>>>>>>>)/gm) ?? []).length;
console.log(`\n残っている競合マーカー: ${left} 件`);
process.exitCode = left === 0 ? 0 : 1;
