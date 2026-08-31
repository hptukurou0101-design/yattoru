#!/usr/bin/env node
/**
 * 下層ページで追加された文字サイズ・行間のトークン化
 *
 *   font-size   … 新しい値は :root に追加して 1 対 1 で命名（値は変えない）
 *   line-height … 既存の 4 段（--lh-flat / tight / base / loose）に寄せる
 *                 寄せた際の変化量を必ず出力する
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "app/globals.css";
let c = readFileSync(FILE, "utf8");

/** 新ページで増えた文字サイズ。値は変えず名前を与えるだけ。 */
const NEW_FS = {
  "--fs-hero-lg": "clamp(34px, 3.1vw, 48px)",
  "--fs-hero-sm": "clamp(31px, 3vw, 44px)",
  "--fs-h2-xl": "clamp(27px, 2.35vw, 36px)",
  "--fs-h2-l": "clamp(27px, 2.25vw, 35px)",
  "--fs-h2-m": "clamp(26px, 2.45vw, 37px)",
  "--fs-h2-s": "clamp(25px, 2.2vw, 34px)",
  "--fs-xxl": "29px",
  "--fs-x": "28px",
  "--fs-l": "21px",
  "--fs-ml": "18px",
  "--fs-pico": "9px",
};

/** 既存トークンで賄える値 */
const EXIST_FS = {
  "27px": "--fs-xl",
  "26px": "--fs-lg",
  "25px": "--fs-md",
  "24px": "--fs-base-lg",
  "20px": "--fs-base",
  "19px": "--fs-sm",
  "17px": "--fs-body",
  "16px": "--fs-body-sm",
  "15px": "--fs-ui",
  "14px": "--fs-ui-sm",
  "13px": "--fs-caption",
  "12px": "--fs-caption-sm",
  "11px": "--fs-note",
  "10px": "--fs-micro",
  "8px": "--fs-nano",
  "7px": "--fs-nano-sm",
};

/** 行間は 4 段に寄せる */
const LH = {
  "1": "--lh-flat",
  "1.45": "--lh-tight", "1.5": "--lh-tight", "1.55": "--lh-tight", "1.6": "--lh-tight", "1.64": "--lh-tight", "1.65": "--lh-tight",
  "1.7": "--lh-base", "1.72": "--lh-base", "1.75": "--lh-base", "1.8": "--lh-base", "1.85": "--lh-base", "1.9": "--lh-base",
  "1.95": "--lh-loose", "2": "--lh-loose", "2.05": "--lh-loose", "2.1": "--lh-loose", "2.2": "--lh-loose",
};
const LH_VALUE = { "--lh-flat": 1, "--lh-tight": 1.6, "--lh-base": 1.8, "--lh-loose": 2 };

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ---- :root に新しい文字サイズを追加 ---- */
const anchor = "  --fs-nano-sm: 7px;";
if (!c.includes("--fs-hero-lg")) {
  const add =
    "\n\n  /* ---- 下層ページで追加された文字サイズ ---- */\n" +
    Object.entries(NEW_FS).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  if (!c.includes(anchor)) {
    console.error("トークン定義の挿入位置が見つかりません");
    process.exit(1);
  }
  c = c.replace(anchor, anchor + add);
  console.log(`:root に文字サイズトークンを ${Object.keys(NEW_FS).length} 個追加`);
}

const splitAt = c.indexOf("* {");
const head = c.slice(0, splitAt);
let body = c.slice(splitAt);

let nfs = 0;
for (const [tok, val] of Object.entries(NEW_FS)) {
  const re = new RegExp("font-size:\\s*" + esc(val) + "\\s*;", "g");
  nfs += (body.match(re) ?? []).length;
  body = body.replace(re, `font-size: var(${tok});`);
}
for (const [val, tok] of Object.entries(EXIST_FS)) {
  const re = new RegExp("font-size:\\s*" + esc(val) + "\\s*;", "g");
  nfs += (body.match(re) ?? []).length;
  body = body.replace(re, `font-size: var(${tok});`);
}

console.log("\n行間の寄せ（変化量つき）:");
let nlh = 0;
for (const [val, tok] of Object.entries(LH)) {
  const re = new RegExp("line-height:\\s*" + esc(val) + "\\s*;", "g");
  const n = (body.match(re) ?? []).length;
  if (n > 0) {
    nlh += n;
    const delta = (LH_VALUE[tok] - Number(val)).toFixed(2);
    console.log(`  ${val.padEnd(5)} → ${tok.padEnd(12)} 差 ${String(delta).padStart(6)}  (${n} 箇所)`);
  }
  body = body.replace(re, `line-height: var(${tok});`);
}

writeFileSync(FILE, head + body);
console.log(`\nfont-size ${nfs} 箇所 / line-height ${nlh} 箇所 を置換`);

const after = readFileSync(FILE, "utf8").slice(splitAt);
const leftFs = after.match(/font-size:(?!\s*var\()[^;]+;/g) ?? [];
const leftLh = after.match(/line-height:(?!\s*var\()[^;]+;/g) ?? [];
console.log(`残: font-size ${leftFs.length} 件 ${[...new Set(leftFs)].join(" ")}`);
console.log(`残: line-height ${leftLh.length} 件 ${[...new Set(leftLh)].join(" ")}`);
process.exitCode = leftFs.length + leftLh.length === 0 ? 0 : 1;
