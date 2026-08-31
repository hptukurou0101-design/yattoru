#!/usr/bin/env node
/**
 * ヘッドレス描画による実測（フェーズ1以降の共通基盤）
 *
 * 指定 URL を複数の画面幅で実際に描画し、目視ではなく数値で状態を記録する。
 *  - 横スクロール（body 幅 > viewport 幅）の発生有無
 *  - viewport をはみ出している要素の一覧
 *  - 見出し階層（h1〜h4）のアウトライン
 *  - ブラウザコンソールのエラー／警告
 *  - スクリーンショット（reports/screenshots/）
 *
 * 使い方:
 *   node scripts/check/render.mjs --url http://127.0.0.1:3000/
 *   node scripts/check/render.mjs --url http://127.0.0.1:3000/ --widths 360,390,414,768,1024,1280
 *   node scripts/check/render.mjs --url http://127.0.0.1:3000/ --json
 *   node scripts/check/render.mjs --url http://127.0.0.1:3000/ --shot   （スクリーンショットも保存）
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
const has = (name) => argv.includes(`--${name}`);

const URL_ARG = opt("url", "http://127.0.0.1:3000/");
const WIDTHS = (opt("widths", "360,390,414,768,1024,1280") ?? "")
  .split(",")
  .map((n) => Number(n.trim()))
  .filter((n) => Number.isFinite(n) && n > 0);
const AS_JSON = has("json");
const SHOT = has("shot");
const SHOT_DIR = path.join(process.cwd(), "reports", "screenshots");

const browser = await chromium.launch();
const results = [];

for (const width of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
    if (msg.type() === "warning") consoleWarnings.push(msg.text());
  });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));

  await page.goto(URL_ARG, { waitUntil: "networkidle" });

  const measured = await page.evaluate((vw) => {
    const doc = document.documentElement;
    const overflowing = [];

    // position:fixed の要素（画面外に待避させた追従パネル等）と、その子孫は
    // ページの横スクロールを発生させないため対象外にする。
    const isInsideFixed = (el) => {
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        if (getComputedStyle(n).position === "fixed") return true;
      }
      return false;
    };

    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      // 画面右端を 1px 以上超えている要素だけを拾う
      if (r.right > vw + 1 || r.left < -1) {
        if (isInsideFixed(el)) continue;
        overflowing.push({
          selector:
            el.tagName.toLowerCase() +
            (el.id ? `#${el.id}` : "") +
            (el.className && typeof el.className === "string"
              ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
              : ""),
          left: Math.round(r.left),
          right: Math.round(r.right),
        });
      }
    }
    const headings = [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => ({
      level: Number(h.tagName[1]),
      text: h.innerText.replace(/\s+/g, " ").trim().slice(0, 80),
    }));
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      hasHorizontalScroll: doc.scrollWidth > doc.clientWidth + 1,
      overflowing: overflowing.slice(0, 30),
      overflowingCount: overflowing.length,
      headings,
      title: document.title,
    };
  }, width);

  if (SHOT) {
    mkdirSync(SHOT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(SHOT_DIR, `w${width}.png`),
      fullPage: true,
    });
  }

  results.push({
    width,
    ...measured,
    consoleErrors,
    consoleWarnings,
    pageErrors,
  });

  await context.close();
}

await browser.close();

const ng = results.filter(
  (r) => r.hasHorizontalScroll || r.pageErrors.length > 0 || r.consoleErrors.length > 0
);

if (AS_JSON) {
  console.log(JSON.stringify({ url: URL_ARG, checkedAt: new Date().toISOString(), results }, null, 2));
} else {
  console.log(`[render] URL: ${URL_ARG}`);
  for (const r of results) {
    console.log(
      `  w=${String(r.width).padStart(4)}  scrollW=${r.scrollWidth}  横スクロール=${r.hasHorizontalScroll ? "あり" : "なし"}  はみ出し要素=${r.overflowingCount}  console error=${r.consoleErrors.length}  pageerror=${r.pageErrors.length}`
    );
    for (const o of r.overflowing) console.log(`      ! ${o.selector}  left=${o.left} right=${o.right}`);
    for (const e of r.consoleErrors) console.log(`      ! console: ${e.slice(0, 160)}`);
    for (const e of r.pageErrors) console.log(`      ! pageerror: ${e.slice(0, 160)}`);
  }
  const h1s = results[0]?.headings.filter((h) => h.level === 1) ?? [];
  console.log(`[render] h1 の数: ${h1s.length}`);
  console.log(`[render] 判定: ${ng.length === 0 ? "OK" : `NG (${ng.length} 幅で問題)`}`);
  if (SHOT) console.log(`[render] スクリーンショット: ${path.relative(process.cwd(), SHOT_DIR)}`);
}

process.exitCode = ng.length === 0 ? 0 : 1;
