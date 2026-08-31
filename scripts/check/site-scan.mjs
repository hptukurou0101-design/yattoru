#!/usr/bin/env node
/**
 * サイト全ページ横断の検査（下層ページ追加後の全体検査）
 *
 * 既存の単ページ用スクリプトを各ルートに対して実行し、結果を集計する。
 * 個々のスクリプトを作り替えず再利用するため、検査ロジックは 1 箇所に保たれる。
 *
 *   render     … 全幅での横スクロール / はみ出し / コンソールエラー
 *   a11y       … コントラスト / タップ領域 / alt / aria-label / CLS
 *   jp         … 和文の改行（8 幅）
 *   seo        … title / description / canonical / h1 / 見出し階層
 *
 * 使い方:
 *   node scripts/check/site-scan.mjs --base http://127.0.0.1:4173
 *   node scripts/check/site-scan.mjs --base http://127.0.0.1:4173 --only render,a11y
 *   node scripts/check/site-scan.mjs --base http://127.0.0.1:4173 --out reports/phase5
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { listRoutes } from "./pages.mjs";

const argv = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : d;
};
const BASE = (opt("base", "http://127.0.0.1:4173") ?? "").replace(/\/$/, "");
const ONLY = (opt("only", "render,a11y,jp,seo") ?? "").split(",").map((s) => s.trim());
const OUT = opt("out", null);
const ROUTES = opt("paths", null) ? opt("paths").split(",") : listRoutes();

if (OUT) mkdirSync(OUT, { recursive: true });

const run = (args) => {
  try {
    return { out: execFileSync(process.execPath, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 }), code: 0 };
  } catch (e) {
    return { out: (e.stdout ?? "") + (e.stderr ?? ""), code: e.status ?? 1 };
  }
};

const num = (text, re) => {
  const m = text.match(re);
  return m ? Number(m[1]) : null;
};

const rows = [];
console.log(`[site-scan] ${ROUTES.length} ページ × ${ONLY.join(" / ")}\n`);

for (const route of ROUTES) {
  const url = BASE + route;
  const row = { route };

  if (ONLY.includes("render")) {
    const r = run(["scripts/check/render.mjs", "--url", url]);
    row.widthsNG = (r.out.match(/横スクロール=あり/g) ?? []).length;
    row.overflow = (r.out.match(/はみ出し要素=(\d+)/g) ?? []).reduce((a, s) => a + Number(s.split("=")[1]), 0);
    row.consoleErr = (r.out.match(/console error=(\d+)/g) ?? []).reduce((a, s) => a + Number(s.split("=")[1]), 0);
    row.pageErr = (r.out.match(/pageerror=(\d+)/g) ?? []).reduce((a, s) => a + Number(s.split("=")[1]), 0);
    row.h1 = num(r.out, /h1 の数: (\d+)/);
    if (OUT) writeFileSync(path.join(OUT, `render${route.replace(/\//g, "_") || "_top"}.txt`), r.out);
  }

  if (ONLY.includes("a11y")) {
    const r = run(["scripts/check/a11y-audit.mjs", "--url", url]);
    row.contrastNG = num(r.out, /基準未満 (\d+) 箇所/);
    row.tapNG = num(r.out, /タップ領域 44×44px（\d+ 箇所 \/ 未満 (\d+) 箇所）/);
    row.altNG = num(r.out, /alt 属性なし (\d+) 枚/);
    row.ariaNG = num(r.out, /aria-label なし (\d+) 箇所/);
    row.cls = num(r.out, /CLS = ([\d.]+)/);
    row.tabStops = num(r.out, /Tab 順（(\d+) ストップ/);
    row.tabFocus = num(r.out, /フォーカス可視 (\d+)/);
    if (OUT) writeFileSync(path.join(OUT, `a11y${route.replace(/\//g, "_") || "_top"}.txt`), r.out);
  }

  if (ONLY.includes("jp")) {
    const r = run(["scripts/check/jp-lines.mjs", "--url", url]);
    row.jp = num(r.out, /合計: (\d+) 件/);
    if (OUT) writeFileSync(path.join(OUT, `jp${route.replace(/\//g, "_") || "_top"}.txt`), r.out);
  }

  rows.push(row);
  const cells = [
    row.widthsNG !== undefined ? `横スクロール ${row.widthsNG}` : null,
    row.overflow !== undefined ? `はみ出し ${row.overflow}` : null,
    row.consoleErr !== undefined ? `err ${row.consoleErr + row.pageErr}` : null,
    row.contrastNG !== undefined ? `コントラスト ${row.contrastNG}` : null,
    row.tapNG !== undefined ? `タップ ${row.tapNG}` : null,
    row.ariaNG !== undefined ? `aria ${row.ariaNG}` : null,
    row.jp !== undefined ? `和文 ${row.jp}` : null,
  ].filter(Boolean);
  console.log(`  ${route.padEnd(24)} ${cells.join("  /  ")}`);
}

if (ONLY.includes("seo")) {
  const r = run(["scripts/check/seo-audit.mjs", "--base", BASE, "--paths", ROUTES.join(",")]);
  if (OUT) writeFileSync(path.join(OUT, "seo-audit.txt"), r.out);
  console.log("\n" + r.out.split("\n").filter((l) => /title 重複|description重複|robots\.txt|sitemap\.xml|noindex/.test(l)).join("\n"));
}

/* ---------- 集計 ---------- */
const sum = (k) => rows.reduce((a, r) => a + (r[k] ?? 0), 0);
console.log("\n==================== 集計 ====================");
if (ONLY.includes("render")) {
  console.log(`  横スクロールの発生した幅   : ${sum("widthsNG")} 件`);
  console.log(`  はみ出し要素               : ${sum("overflow")} 件`);
  console.log(`  console error / pageerror  : ${sum("consoleErr")} / ${sum("pageErr")} 件`);
  const badH1 = rows.filter((r) => r.h1 !== 1);
  console.log(`  h1 が 1 個でないページ     : ${badH1.length} 件 ${badH1.map((r) => `${r.route}(${r.h1})`).join(" ")}`);
}
if (ONLY.includes("a11y")) {
  console.log(`  コントラスト基準未満       : ${sum("contrastNG")} 件`);
  console.log(`  タップ領域 44px 未満       : ${sum("tapNG")} 件`);
  console.log(`  alt 属性なし               : ${sum("altNG")} 枚`);
  console.log(`  aria-label なしアイコン    : ${sum("ariaNG")} 件`);
  const badCls = rows.filter((r) => (r.cls ?? 0) > 0.1);
  console.log(`  CLS > 0.1 のページ         : ${badCls.length} 件 ${badCls.map((r) => `${r.route}(${r.cls})`).join(" ")}`);
  const badFocus = rows.filter((r) => r.tabStops !== r.tabFocus);
  console.log(`  フォーカス不可視のページ   : ${badFocus.length} 件`);
}
if (ONLY.includes("jp")) console.log(`  和文改行の検出             : ${sum("jp")} 件`);
console.log("==============================================");

if (OUT) writeFileSync(path.join(OUT, "site-scan.json"), JSON.stringify({ base: BASE, checkedAt: new Date().toISOString(), rows }, null, 2));
