#!/usr/bin/env node
/**
 * ページの呼び名を統一する
 *
 * 同じページがナビ・見出し・title・ボタンで別々の名前で呼ばれていたため、
 * 「ナビの語をそのまま見出しと title に使う」規則に揃える。
 * 説明は PageHero の lead が担うので、見出しを長くする必要はない。
 *
 *   /features   私たちの特長 / 私たちが大切にしていること / 私たちの考え方
 *               → すべて「大切にしていること」
 *   /first-time 初めての方へ / 初めてリフォームを検討する方へ / 初めてのリフォーム
 *               → すべて「初めての方へ」
 *   /reform     リフォーム / 住まいのお悩みに合わせたリフォーム / リフォームメニュー
 *               → すべて「リフォーム」
 */
import { readFileSync, writeFileSync } from "node:fs";

const EDITS = [
  // --- ナビゲーション（ヘッダーとモバイルメニューで共用）---
  ["components/site-chrome.tsx", `["私たちの特長", "/features"],`, `["大切にしていること", "/features"],`],
  // --- フッターナビ ---
  ["components/site-chrome.tsx", `<a href="/features">私たちの特長</a>`, `<a href="/features">大切にしていること</a>`],

  // --- /features ---
  ["app/features/page.tsx", `title: "私たちの特長｜やっとる建設"`, `title: "大切にしていること｜やっとる建設"`],
  ["app/features/page.tsx", `<PageHero title="私たちが大切にしている⁠こと"`, `<PageHero title="大切にしていること"`],

  // --- /first-time ---
  ["app/first-time/page.tsx", `title: "初めてのリフォーム｜やっとる建設"`, `title: "初めての方へ｜やっとる建設"`],
  ["app/first-time/page.tsx", `<PageHero title="初めてリフォームを検討する方へ"`, `<PageHero title="初めての方へ"`],

  // --- /reform ---
  ["app/reform/page.tsx", `title: "リフォームメニュー｜やっとる建設"`, `title: "リフォーム｜やっとる建設"`],
  ["app/reform/page.tsx", `<PageHero title="住まいのお悩みに合わせたリフォーム"`, `<PageHero title="リフォーム"`],

  // --- トップページのボタン（飛び先 /features）---
  ["app/page.tsx", `              私たちの考え方を知る`, `              大切にしていることを見る`],
];

let n = 0;
for (const [file, from, to] of EDITS) {
  const s = readFileSync(file, "utf8");
  const count = s.split(from).length - 1;
  if (count !== 1) {
    console.error(`一致数が ${count} 件（1 件であるべき）: ${file}\n  ${from}`);
    process.exit(1);
  }
  writeFileSync(file, s.split(from).join(to));
  n++;
  console.log(`  ${file.padEnd(30)} ${from.slice(0, 34)}…`);
}

console.log(`\n${n} 箇所を統一しました`);
