#!/usr/bin/env node
/**
 * 文字表記の校正と NAP の一致確認（フェーズ2 No.109〜No.113）
 *
 *   No.109 表記ゆれ（お問い合わせ / お問合せ、Web / WEB、ください / 下さい 等）
 *   No.110 会社名の完全一致
 *   No.111 住所の完全一致
 *   No.112 電話番号の完全一致
 *   No.113 コピーライト年・日付
 *
 * 判定対象は「画面に見えるテキスト」。RSC ペイロード（<script> 内）は除外する。
 *
 * 使い方:
 *   node scripts/check/proofread.mjs reports/phase2/served.html
 */
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "reports/phase2/served.html";
const raw = readFileSync(file, "utf8");
const stripped = raw
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<!--[\s\S]*?-->/g, " ");
const body = (stripped.split(/<body[^>]*>/i)[1] ?? "").split(/<\/body>/i)[0];
const text = body.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");

const count = (re) => (text.match(re) ?? []).length;
const lit = (s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");

/** 表記ゆれの対になる候補。両方 1 回以上出たら「ゆれ」とみなす。 */
const VARIANTS = [
  ["お問い合わせ", "お問合せ"],
  ["お問い合わせ", "お問合わせ"],
  ["お客様", "お客さま"],
  ["見積もり", "見積り"],
  ["ください", "下さい"],
  ["いたします", "致します"],
  ["Web", "WEB"],
  ["ホームページ", "HP"],
  ["問い合わせ", "問合せ"],
];

const SINGLE = [
  "お問い合わせ", "お問合せ", "お問合わせ", "ご相談", "リフォーム", "お客様", "お客さま",
  "見積もり", "見積り", "ください", "下さい", "いたします", "致します", "ホームページ",
];

console.log(`[proof] 対象: ${file}  可視テキスト ${text.length} 文字`);

console.log(`\n=== No.109 表記ゆれ ===`);
console.log("  出現回数:");
for (const w of SINGLE) {
  const c = count(lit(w));
  if (c) console.log(`    ${w.padEnd(14)} ${c} 回`);
}
const conflicts = [];
for (const [a, b] of VARIANTS) {
  const ca = count(lit(a));
  const cb = count(lit(b));
  if (ca > 0 && cb > 0 && a !== b) conflicts.push(`${a}(${ca}) と ${b}(${cb}) が混在`);
}
console.log(`  ゆれ: ${conflicts.length === 0 ? "0 件" : ""}`);
for (const c of conflicts) console.log(`    ! ${c}`);

const nap = (label, values) => {
  console.log(`\n=== ${label} ===`);
  const found = values.map((v) => ({ v, n: count(lit(v)) })).filter((x) => x.n > 0);
  for (const f of found) console.log(`  ${f.v.padEnd(34)} ${f.n} 回`);
  if (found.length === 0) console.log("  出現なし");
  return found;
};

nap("No.110 会社名", [
  "やっとる建設株式会社",
  "YATTORU CONSTRUCTION CO., LTD.",
  "YATTORU CONSTRUCTION",
  "やっとる建設",
]);
nap("No.111 住所", [
  "福岡県福岡市博多区博多駅前○丁目○-○",
  "福岡市博多区",
  "福岡県福岡市博多区",
]);
nap("No.112 電話番号", ["092-123-4567", "0922123-4567", "092(123)4567"]);
console.log(`  href の tel: 指定 : ${(raw.match(/tel:0921234567/g) ?? []).length} 回`);

console.log(`\n=== No.113 コピーライト・日付 ===`);
const currentYear = new Date().getFullYear();
const copyrights = text.match(/©[^。]{0,50}/g) ?? [];
for (const c of copyrights) console.log(`  ${c.trim()}`);
console.log(`  コピーライトに年の記載: ${copyrights.some((c) => /\d{4}/.test(c)) ? "あり" : "なし（固定文字列のみ）"}`);
const dates = [...new Set(text.match(/20\d{2}[年./]\d{1,2}[月./]\d{1,2}/g) ?? [])];
console.log(`  本文中の日付: ${dates.length ? dates.join(", ") : "なし"}`);
const future = dates.filter((d) => {
  const y = Number(d.slice(0, 4));
  return y > currentYear;
});
console.log(`  現在年(${currentYear})より未来の日付: ${future.length ? future.join(", ") : "なし"}`);
console.log(`  設立年の記載: ${(text.match(/\d{4}年/g) ?? []).filter((y) => y !== `${currentYear}年`).join(", ") || "なし"}`);
