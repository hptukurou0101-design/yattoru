#!/usr/bin/env node
/**
 * 各ページに固有の meta description を付ける
 *
 * 現状、全 18 ページが app/layout.tsx の description を継承しており、内容が同一だった。
 *
 * **新しい文章は書かない。** description は
 *   「そのページの画面に既に出ているリード文」＋「既存の共通説明」
 * の組み合わせだけで作る。文言の創作にあたらないようにするため。
 *
 *   例: /features
 *     リード文  「相談しやすく、仕事はきっちり。住まいに長く向き合います。」
 *     共通説明  「福岡市のやっとる建設株式会社。」（layout.tsx に元からある文）
 *     → description = 上記を連結したもの
 */
import { readFileSync, writeFileSync } from "node:fs";

/** layout.tsx に元からある共通の説明文。ここだけは全ページで共有する。 */
const SUFFIX = "福岡市のやっとる建設株式会社。";

/**
 * ページごとのリード文。すべて各ページの画面に表示されている文言をそのまま使う。
 * （PageHero の lead、または text-page-header の補足文）
 */
const LEADS = {
  "app/company/page.tsx": "福岡で、住まいの安心を支える地域のリフォーム会社です。",
  "app/contact/page.tsx": "工事内容や費用が決まっていない段階でもご相談いただけます。",
  "app/faq/page.tsx": "ご相談前に多くいただく質問をまとめています。",
  "app/features/page.tsx": "相談しやすく、仕事はきっちり。住まいに長く向き合います。",
  "app/first-time/page.tsx": "分からないことを、一つずつ整理しながら進めます。",
  "app/news/page.tsx": "やっとる建設からのお知らせと、住まいに役立つ情報を掲載します。",
  "app/privacy/page.tsx": "個人情報の取り扱いについて",
  "app/terms/page.tsx": "当サイトをご利用いただく際のご案内",
  "app/reform/page.tsx": "外壁・屋根・水まわりを中心に、戸建てリフォームに対応します。",
  "app/reform/exterior/page.tsx": "見た目を整えるだけでなく、雨や紫外線から住まいを守ります。",
  "app/reform/roof/page.tsx": "普段見えない場所だからこそ、状態を確認してから工事を考えます。",
  "app/reform/water/page.tsx": "設備を替えるだけでなく、毎日の使いやすさから整えます。",
  "app/voices/page.tsx": "工事を終えたお客様からいただいた声をご紹介します。",
  "app/works/page.tsx": "ご要望とご予算に向き合い、一つずつ形にした事例をご紹介します。",
  "app/works/bright-ldk/page.tsx": "明るさと動線を見直した、家族が集まるLDK",
  "app/works/exterior-roof/page.tsx": "外壁と屋根を整え、これからも安心して暮らせる住まいへ",
  "app/works/kitchen-flow/page.tsx": "毎日の家事がしやすい、すっきりとしたキッチン",
};

let changed = 0;
for (const [file, lead] of Object.entries(LEADS)) {
  let s = readFileSync(file, "utf8");
  if (/description:/.test(s.split("export default")[0])) {
    console.log(`  すでに description あり: ${file}`);
    continue;
  }
  const m = s.match(/export const metadata: Metadata = \{ title: "([^"]*)" \};/);
  if (!m) {
    console.error(`metadata の形が想定と違います: ${file}`);
    process.exit(1);
  }
  const description = `${lead}${lead.endsWith("。") ? "" : "。"}${SUFFIX}`;
  const replacement =
    `export const metadata: Metadata = {\n` +
    `  title: "${m[1]}",\n` +
    `  description: "${description}",\n` +
    `};`;
  s = s.replace(m[0], replacement);
  writeFileSync(file, s);
  changed++;
  console.log(`  ${file.padEnd(34)} ${description.slice(0, 42)}…`);
}

console.log(`\n${changed} ページに固有の description を追加しました`);
