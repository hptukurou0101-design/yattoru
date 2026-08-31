#!/usr/bin/env node
/**
 * 下層ページで追加された色リテラルのトークン化
 *
 * 新版の globals.css には、既存トークンとほぼ同じ値の色が 25 種類・42 箇所追加された。
 * これらを既存トークンに寄せて、色の定義箇所を :root だけに保つ。
 *
 * 寄せる際の色の変化量（チャンネルあたりの最大差）を必ず出力する。
 * 差が大きいもの、コントラスト基準のために意図的に変えるものは個別に注記する。
 *
 * 使い方:
 *   node scripts/check/tokenize-colors-v2.mjs           … 差分を表示して置換
 *   node scripts/check/tokenize-colors-v2.mjs --dry-run … 表示のみ
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "app/globals.css";
const DRY = process.argv.includes("--dry-run");

/** :root で定義済みのトークン値 */
const TOKENS = {
  "--paper": "#ffffff",
  "--surface-footer": "#eef1f3",
  "--hero-fallback": "#81909a",
  "--navy": "#324759",
  "--blue-on-dark": "#cddbe4",
  "--ink-4": "#50555a",
  "--ink-5": "#5d6266",
  "--ink-6": "#666b6f",
  "--ink-7": "#6a6f73",
  "--ink-9": "#686d70",
  "--ink-10": "#73777b",
  "--ink-11": "#72777b",
  "--line": "#d8dadd",
  "--line-card": "#cfd2d4",
};

/** 追加された色リテラル → 寄せ先トークン。理由を添える。 */
const MAP = {
  "#fff": ["--paper", "白。完全一致"],
  "#8a979f": ["--hero-fallback", "画像読み込み前の地色。既存の同用途トークンに統合"],
  "#777c80": ["--ink-10", "パンくずの文字。白地で 4.5:1 に満たないため基準を満たす値へ"],
  "#7a7f83": ["--ink-11", "補助文字。白地で 4.05:1 と基準未満のため基準を満たす値へ"],
  "#50555a": ["--ink-4", "本文。完全一致"],
  "#555a5f": ["--ink-4", "本文"],
  "#51565a": ["--ink-4", "本文"],
  "#565b5f": ["--ink-4", "本文"],
  "#5a5f63": ["--ink-5", "本文"],
  "#666b6f": ["--ink-6", "タグ文字。完全一致"],
  "#666b70": ["--ink-6", "フィルタの文字"],
  "#6a6f73": ["--ink-7", "注記。完全一致"],
  "#686d71": ["--ink-9", "補助文字"],
  "#687177": ["--ink-9", "ページ見出しの補足"],
  "#73787c": ["--ink-10", "定義リストの見出し"],
  "#74797d": ["--ink-10", "署名"],
  "#72777b": ["--ink-11", "日付。完全一致"],
  "#33495b": ["--navy", "反転面の地色"],
  "#dbe4ea": ["--blue-on-dark", "濃色面の上の文字"],
  "#c9d6df": ["--blue-on-dark", "濃色面の上の小さい文字"],
  "#eef3f5": ["--surface-footer", "淡い面の地色"],
  "#d6dade": ["--line", "区切り面"],
  "#cfd2d4": ["--line-card", "枠線。完全一致"],
  "#cfd4d7": ["--line-card", "枠線と面"],
  "#c8cccf": ["--line-card", "入力欄の枠線"],
};

const parse = (h) => {
  const s = h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
  return { r: parseInt(s.slice(1, 3), 16), g: parseInt(s.slice(3, 5), 16), b: parseInt(s.slice(5, 7), 16) };
};
const maxDelta = (a, b) => {
  const x = parse(a);
  const y = parse(b);
  return Math.max(Math.abs(x.r - y.r), Math.abs(x.g - y.g), Math.abs(x.b - y.b));
};

const css = readFileSync(FILE, "utf8");
const splitAt = css.indexOf("* {");
const head = css.slice(0, splitAt);
let body = css.slice(splitAt);

console.log("リテラル   → トークン            変化量  用途");
console.log("-".repeat(78));

let total = 0;
for (const [literal, [token, why]] of Object.entries(MAP)) {
  const re = new RegExp(literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![0-9a-fA-F])", "g");
  const n = (body.match(re) ?? []).length;
  if (n === 0) continue;
  total += n;
  const d = maxDelta(literal, TOKENS[token]);
  console.log(
    `${literal.padEnd(10)} → ${token.padEnd(20)} ${String(d).padStart(3)}/255  ${why}  (${n} 箇所)`
  );
  if (!DRY) body = body.replace(re, `var(${token})`);
}

console.log("-".repeat(78));
console.log(`置換合計: ${total} 箇所`);

if (!DRY) writeFileSync(FILE, head + body);

const remaining = (readFileSync(FILE, "utf8").slice(splitAt).match(/#[0-9a-fA-F]{3,8}\b/g) ?? []);
console.log(`トークン定義ブロック外の色リテラル残存: ${remaining.length} 件`);
if (remaining.length) console.log(`  ${[...new Set(remaining)].join(", ")}`);
process.exitCode = remaining.length === 0 ? 0 : 1;
