#!/usr/bin/env node
/**
 * HTML の「画面に見えるテキスト」だけを抽出して検査する（フェーズ1 No.18 用）
 *
 * RSC のシリアライズ済みペイロード（<script> 内）には React 内部表現の
 * "$undefined" が現れるが、これは画面には出ない。
 * 画面表示に出ているかどうかを判定するため、script/style を除去した本文だけを対象にする。
 *
 * 使い方:
 *   node scripts/check/visible-text.mjs reports/phase1/empty-data.html
 *   node scripts/check/visible-text.mjs reports/phase1/empty-data.html --dump
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
const DUMP = process.argv.includes("--dump");
if (!file) {
  console.error("使い方: node scripts/check/visible-text.mjs <html ファイル> [--dump]");
  process.exit(2);
}

const raw = readFileSync(file, "utf8");

const stripped = raw
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<!--[\s\S]*?-->/g, " ");
const body = (stripped.split(/<body[^>]*>/i)[1] ?? stripped).split(/<\/body>/i)[0];
const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const BAD = /undefined|\bnull\b|\bNaN\b|\[object Object\]|\bInvalid Date\b/g;
const visibleHits = text.match(BAD) ?? [];
const payloadUndefined = (raw.match(/\$undefined/g) ?? []).length;

console.log(`[visible] ファイル: ${file}`);
console.log(`[visible] 可視テキスト長: ${text.length} 文字`);
console.log(`[visible] 可視テキスト内の undefined/null/NaN/[object Object]: ${visibleHits.length} 件`);
if (visibleHits.length) console.log(`          内訳: ${JSON.stringify([...new Set(visibleHits)])}`);
console.log(`[visible] RSC ペイロード内の $undefined（画面非表示）: ${payloadUndefined} 件`);

if (DUMP) {
  console.log("\n--- 可視テキスト ---");
  console.log(text);
}

process.exitCode = visibleHits.length === 0 ? 0 : 1;
