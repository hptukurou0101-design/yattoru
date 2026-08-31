#!/usr/bin/env node
/**
 * 書体・文字サイズ・行間のトークン化（フェーズ2 No.48〜No.51 の作業スクリプト）
 *
 *   font-family : :root の --font-body / --font-heading 参照に一本化
 *   font-size   : :root の --fs-* 階層への 1 対 1 参照に置換（値は変えない）
 *   line-height : --lh-flat / --lh-tight / --lh-base / --lh-loose の 4 段に集約
 *                 （※ 行間だけは値が変わる。対応表は下の LINE_HEIGHT を参照）
 *
 * 使い方:
 *   node scripts/check/tokenize-type.mjs
 *   node scripts/check/tokenize-type.mjs --check   … 残存の確認のみ
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "app/globals.css";
const CHECK_ONLY = process.argv.includes("--check");

/** font-size の実値 → トークン。値は変えない。 */
const FONT_SIZE = {
  "clamp(32px, 3.05vw, 44px)": "var(--fs-hero)",
  "clamp(28px, 2.45vw, 38px)": "var(--fs-h2-lg)",
  "clamp(27px, 2.25vw, 34px)": "var(--fs-h2)",
  "clamp(26px, 8vw, 34px)": "var(--fs-h2-mobile)",
  "clamp(25px, 2.25vw, 34px)": "var(--fs-h2-sm)",
  "clamp(19px, 1.65vw, 24px)": "var(--fs-lead)",
  "27px": "var(--fs-xl)",
  "26px": "var(--fs-lg)",
  "25px": "var(--fs-md)",
  "24px": "var(--fs-base-lg)",
  "20px": "var(--fs-base)",
  "19px": "var(--fs-sm)",
  "17px": "var(--fs-body)",
  "16px": "var(--fs-body-sm)",
  "15px": "var(--fs-ui)",
  "14px": "var(--fs-ui-sm)",
  "13px": "var(--fs-caption)",
  "12px": "var(--fs-caption-sm)",
  "11px": "var(--fs-note)",
  "10px": "var(--fs-micro)",
  "8px": "var(--fs-nano)",
  "7px": "var(--fs-nano-sm)",
};

/**
 * line-height の実値 → トークン。ここだけは値が変わる。
 * 12 種類あった行間を 4 段に集約する。丸め幅は最大 0.10（例: 1.5 → 1.6）。
 */
const LINE_HEIGHT = {
  "1": "var(--lh-flat)",       // 変化なし
  "1.5": "var(--lh-tight)",    // 1.5  -> 1.6
  "1.55": "var(--lh-tight)",   // 1.55 -> 1.6
  "1.6": "var(--lh-tight)",    // 変化なし
  "1.64": "var(--lh-tight)",   // 1.64 -> 1.6
  "1.7": "var(--lh-base)",     // 1.7  -> 1.8
  "1.75": "var(--lh-base)",    // 1.75 -> 1.8
  "1.85": "var(--lh-base)",    // 1.85 -> 1.8
  "1.9": "var(--lh-base)",     // 1.9  -> 1.8
  "1.95": "var(--lh-loose)",   // 1.95 -> 2
  "2": "var(--lh-loose)",      // 変化なし
  "2.05": "var(--lh-loose)",   // 2.05 -> 2
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const css = readFileSync(FILE, "utf8");
const splitAt = css.indexOf("* {");
const head = css.slice(0, splitAt);
let body = css.slice(splitAt);

if (!CHECK_ONLY) {
  const counts = { "font-family": 0, "font-size": 0, "line-height": 0 };

  // font-family は body の 1 宣言のみ。トークン参照に置き換える。
  body = body.replace(
    /font-family:[^;]+;/g,
    () => {
      counts["font-family"]++;
      return "font-family: var(--font-body);";
    }
  );

  for (const [from, to] of Object.entries(FONT_SIZE)) {
    const re = new RegExp("font-size:\\s*" + escapeRe(from) + "\\s*;", "g");
    counts["font-size"] += (body.match(re) ?? []).length;
    body = body.replace(re, `font-size: ${to};`);
  }

  for (const [from, to] of Object.entries(LINE_HEIGHT)) {
    const re = new RegExp("line-height:\\s*" + escapeRe(from) + "\\s*;", "g");
    counts["line-height"] += (body.match(re) ?? []).length;
    body = body.replace(re, `line-height: ${to};`);
  }

  writeFileSync(FILE, head + body);
  for (const [k, v] of Object.entries(counts)) console.log(`[tokenize-type] ${k}: ${v} 箇所を置換`);
}

const after = readFileSync(FILE, "utf8").slice(splitAt);
const leftFamily = after.match(/font-family:(?!\s*var\()[^;]+;/g) ?? [];
const leftSize = after.match(/font-size:(?!\s*var\()[^;]+;/g) ?? [];
const leftLh = after.match(/line-height:(?!\s*var\()[^;]+;/g) ?? [];

console.log(`[tokenize-type] 定義箇所以外の font-family : ${leftFamily.length} 件 ${leftFamily.join(" ")}`);
console.log(`[tokenize-type] トークン化されていない font-size : ${leftSize.length} 件 ${[...new Set(leftSize)].join(" ")}`);
console.log(`[tokenize-type] トークン化されていない line-height: ${leftLh.length} 件 ${[...new Set(leftLh)].join(" ")}`);

process.exitCode = leftFamily.length + leftSize.length + leftLh.length === 0 ? 0 : 1;
