#!/usr/bin/env node
/**
 * 色リテラルのトークン化（フェーズ2 No.43〜No.47 の作業スクリプト）
 *
 * app/globals.css の :root 定義ブロック **以外** に現れる色リテラルを、
 * :root で定義済みのトークン参照 var(--…) に 1 対 1 で置換する。
 * 値そのものは変えないため、描画結果は変化しない。
 *
 * 使い方:
 *   node scripts/check/tokenize-colors.mjs          … 置換を実行
 *   node scripts/check/tokenize-colors.mjs --check  … 残存件数の確認のみ（置換しない）
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "app/globals.css";
const CHECK_ONLY = process.argv.includes("--check");

/** 色リテラル → トークン参照。値は変えず名前を与えるだけ。 */
const MAP = {
  "#ffffff": "var(--paper)",
  "#fff": "var(--paper)",
  "#79a9c6": "var(--blue-light)",
  "#f7fafc": "var(--blue-tint)",
  "#cddbe4": "var(--blue-on-dark)",
  "#324759": "var(--navy)",
  "#81909a": "var(--hero-fallback)",
  "#eef1f3": "var(--surface-footer)",
  "#dde1e4": "var(--surface-fill)",
  "#474c50": "var(--ink-2)",
  "#4f5458": "var(--ink-3)",
  "#50555a": "var(--ink-4)",
  "#5d6266": "var(--ink-5)",
  "#666b6f": "var(--ink-6)",
  "#6a6f73": "var(--ink-7)",
  "#70757a": "var(--ink-8)",
  "#71767a": "var(--ink-9)",
  "#767a7e": "var(--ink-10)",
  "#7a7f83": "var(--ink-11)",
  "#babec1": "var(--line-strong)",
  "#cfd2d4": "var(--line-card)",
  "#d2d6d9": "var(--line-footer)",
  "#e2e4e6": "var(--line-soft)",
  "#e3e5e7": "var(--line-softer)",
  "rgba(23, 109, 163, 0.35)": "var(--blue-ring)",
  "rgba(23, 109, 163, 0.24)": "var(--blue-shadow)",
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const css = readFileSync(FILE, "utf8");
const splitAt = css.indexOf("* {"); // :root 定義ブロックの直後
if (splitAt < 0) {
  console.error("トークン定義ブロックの終端が見つかりません");
  process.exit(2);
}
const head = css.slice(0, splitAt);
let body = css.slice(splitAt);

if (!CHECK_ONLY) {
  let total = 0;
  for (const [from, to] of Object.entries(MAP)) {
    // 16進表記は後続が 16 進文字でないことを確認（#fff が #fff000 に誤爆しないように）
    const suffix = from.startsWith("#") ? "(?![0-9a-fA-F])" : "";
    const re = new RegExp(escapeRe(from) + suffix, "g");
    const n = (body.match(re) ?? []).length;
    if (n) {
      total += n;
      console.log(`  ${from.padEnd(26)} -> ${to.padEnd(24)} ${n} 箇所`);
    }
    body = body.replace(re, to);
  }
  writeFileSync(FILE, head + body);
  console.log(`[tokenize] 置換合計: ${total} 箇所`);
}

const remaining = (readFileSync(FILE, "utf8").slice(splitAt).match(/#[0-9a-fA-F]{3,8}\b/g) ?? []);
console.log(`[tokenize] トークン定義ブロック外の色リテラル残存: ${remaining.length} 件`);
if (remaining.length) console.log(`  ${[...new Set(remaining)].join(", ")}`);

process.exitCode = remaining.length === 0 ? 0 : 1;
