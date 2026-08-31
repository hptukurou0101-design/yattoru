#!/usr/bin/env node
/**
 * 和文の「割ってはいけない箇所」を WORD JOINER で固定する
 *
 * 実測（18 ページ × 8 幅）で検出した以下を潰す。
 *   中黒割れ  … 「浴室・洗面・／トイレ」のように、列挙の途中ではなく
 *                 一続きの語句が中黒で分断されるもの
 *   欧文分断  … 「家族が集まる／LDK」のように和文と欧文の境で割れるもの
 *   行頭に助詞 … 「優先したい／ことを」のように形式名詞が行頭へ落ちるもの
 *
 * WORD JOINER (U+2060) は幅ゼロ・不可視で、そこでの改行だけを禁止する。
 * **文言は 1 文字も変わらない**（表示上も検索上も同じ文字列のまま）。
 *
 * 使い方:
 *   node scripts/check/fix-jp-breaks.mjs
 *   node scripts/check/fix-jp-breaks.mjs --check   … 対象が残っているかの確認のみ
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const WJ = "⁠";
const CHECK = process.argv.includes("--check");

/**
 * 置換の対象。左の文字列を、右（WORD JOINER 入り）に置き換える。
 * 右から WORD JOINER を除くと左と完全に一致することを実行時に検証する。
 */
const RULES = [
  // --- 中黒でつないだ一続きの語句 ---
  ["キッチン・浴室・洗面・トイレ", `キッチン・${WJ}浴室・${WJ}洗面・${WJ}トイレ`],
  ["使いにくい洗面・トイレ", `使いにくい洗面・${WJ}トイレ`],
  ["下塗り・中塗り・上塗り", `下塗り・${WJ}中塗り・${WJ}上塗り`],
  ["施工地域・期間・費用・担当者コメント", `施工地域・${WJ}期間・${WJ}費用・${WJ}担当者コメント`],

  // --- 和文と欧文の境 ---
  ["家族が集まるLDK", `家族が集まる${WJ}LDK`],
  ["届くようにLDKの配置", `届くように${WJ}LDKの配置`],

  // --- 形式名詞が行頭へ落ちるもの ---
  ["日々感じていること", `日々感じている${WJ}こと`],
  ["現在困っていること", `現在困っている${WJ}こと`],
  ["必要な工事を整理することで", `必要な工事を整理する${WJ}ことで`],
  ["私たちが大切にしていること", `私たちが大切にしている${WJ}こと`],
  ["将来考えることを整理", `将来考える${WJ}ことを整理`],
  ["確認が必要なことは", `確認が必要な${WJ}ことは`],
  ["ご検討いただくために", `ご検討いただく${WJ}ために`],
  ["優先したいことを一緒に整理", `優先したい${WJ}ことを一緒に整理`],
  ["ご案内のために利用します", `ご案内の${WJ}ために利用します`],
  ["適切に取り扱うため、", `適切に取り扱う${WJ}ため、`],
  ["漏えいを防ぐため、", `漏えいを防ぐ${WJ}ため、`],
  ["困っていることを整理します", `困っている${WJ}ことを整理します`],
  ["施工について感じたこと", `施工について感じた${WJ}こと`],
];

const TARGET_DIRS = ["app", "components", "lib"];
const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|ts)$/.test(e.name)) out.push(p);
  }
  return out;
};
const files = TARGET_DIRS.flatMap((d) => walk(d));

// 文言が変わっていないことを先に検証する
for (const [from, to] of RULES) {
  if (to.replaceAll(WJ, "") !== from) {
    console.error(`文言が変化しています: ${from}`);
    process.exit(1);
  }
}

let total = 0;
const missing = [];
for (const [from, to] of RULES) {
  let hits = 0;
  for (const f of files) {
    const before = readFileSync(f, "utf8");
    if (!before.includes(from)) continue;
    hits += before.split(from).length - 1;
    if (!CHECK) writeFileSync(f, before.split(from).join(to));
  }
  if (hits === 0) missing.push(from);
  else {
    total += hits;
    console.log(`  ${String(hits).padStart(2)} 箇所  ${from}`);
  }
}

console.log(`\n合計 ${total} 箇所に WORD JOINER を挿入しました（文言の増減なし）`);
if (missing.length) {
  console.log(`\n該当しなかったパターン（すでに適用済みか、文言が違う）: ${missing.length} 件`);
  for (const m of missing) console.log(`  - ${m}`);
}
