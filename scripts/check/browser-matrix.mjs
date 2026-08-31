#!/usr/bin/env node
/**
 * ブラウザ横断・画面幅・UI 動作の検査（フェーズ2 No.83〜86 / 89〜94 / 98〜102 / 104）
 *
 *   No.83 Chromium（Chrome / Edge 相当）
 *   No.84 WebKit（Safari 相当）
 *   No.85 Firefox
 *   No.86 新しい CSS 機能の非対応時の挙動
 *   No.89-92 360/375/390/414 / 768/900 / 1024 / 1440px
 *   No.94 body の横スクロール
 *   No.98-100 ハンバーガーメニューの開閉・リンク・Esc・背面スクロール
 *   No.101-102 アンカーリンクの移動位置とスムーススクロール
 *   No.104 prefers-reduced-motion
 *
 * 使い方:
 *   node scripts/check/browser-matrix.mjs --url http://127.0.0.1:4173/
 *   node scripts/check/browser-matrix.mjs --url http://127.0.0.1:4173/ --shot
 */
import { chromium, firefox, webkit } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : d;
};
const URL_ARG = opt("url", "http://127.0.0.1:4173/");
const SHOT = argv.includes("--shot");
const AS_JSON = argv.includes("--json");
const WIDTHS = (opt("widths", "360,375,390,414,768,900,1024,1440") ?? "").split(",").map(Number).filter(Boolean);
const SHOT_DIR = path.join(process.cwd(), "reports", "phase2", "browsers");

const ENGINES = { chromium, webkit, firefox };
const report = { url: URL_ARG, checkedAt: new Date().toISOString(), engines: {} };

for (const [name, engine] of Object.entries(ENGINES)) {
  let browser;
  try {
    browser = await engine.launch();
  } catch (e) {
    report.engines[name] = { error: String(e).slice(0, 200) };
    continue;
  }
  const version = browser.version();
  const widths = [];

  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    await page.goto(URL_ARG, { waitUntil: "networkidle" });

    const m = await page.evaluate((vw) => {
      const doc = document.documentElement;
      const isInsideFixed = (el) => {
        for (let n = el; n && n !== document.body; n = n.parentElement) {
          if (getComputedStyle(n).position === "fixed") return true;
        }
        return false;
      };
      let overflowing = 0;
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if ((r.right > vw + 1 || r.left < -1) && !isInsideFixed(el)) overflowing++;
      }
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        horizontalScroll: doc.scrollWidth > doc.clientWidth + 1,
        overflowing,
        h1: document.querySelectorAll("h1").length,
        docHeight: doc.scrollHeight,
      };
    }, width);

    if (SHOT && (width === 390 || width === 1280 || width === 1440)) {
      mkdirSync(SHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(SHOT_DIR, `${name}-w${width}.png`), fullPage: false });
    }

    widths.push({ width, ...m, consoleErrors: consoleErrors.length, pageErrors: pageErrors.length });
    await ctx.close();
  }

  /* ---- 新しい CSS 機能の対応状況（No.86）---- */
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL_ARG, { waitUntil: "networkidle" });
  const cssSupport = await page.evaluate(() => ({
    "word-break: auto-phrase": CSS.supports("word-break", "auto-phrase"),
    ":has()": (() => { try { document.querySelector(":has(*)"); return true; } catch { return false; } })(),
    "minmax()": CSS.supports("grid-template-columns", "minmax(0, 1fr)"),
    "backdrop-filter": CSS.supports("backdrop-filter", "blur(10px)"),
    "clamp()": CSS.supports("font-size", "clamp(1px, 2vw, 3px)"),
    "custom properties": CSS.supports("color", "var(--x)"),
  }));

  /* ---- :has() 非対応時に会社情報カードが消えないか（No.86 の実挙動）---- */
  const infoAreaVisible = await page.evaluate(() => {
    const el = document.querySelector(".info-area");
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { display: cs.display, columns: cs.gridTemplateColumns, childrenVisible: [...el.children].filter((c) => c.getBoundingClientRect().height > 0).length };
  });

  /* ---- モバイルメニューの操作（No.98〜100）---- */
  const mctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const mp = await mctx.newPage();
  await mp.goto(URL_ARG, { waitUntil: "networkidle" });
  const menu = { summaryVisible: null, opensOnClick: null, linkCount: null, linkWorks: null, closesOnEsc: null, backgroundScrollLocked: null };
  try {
    const summary = mp.locator(".mobile-menu summary");
    menu.summaryVisible = await summary.isVisible();
    await summary.click();
    await mp.waitForTimeout(300);
    menu.opensOnClick = await mp.locator(".mobile-menu nav").isVisible();
    menu.linkCount = await mp.locator(".mobile-menu nav a").count();

    // 背面スクロールの固定は「スクロールしている要素の overflow が hidden か」で判定する。
    // overflow:hidden はユーザー操作（ホイール / タッチ）を止めるが、
    // window.scrollTo() によるプログラム的なスクロールは仕様上そのまま通るため、
    // scrollTo の結果で判定してはいけない。
    const lockState = await mp.evaluate(() => {
      const scroller = document.scrollingElement ?? document.documentElement;
      return {
        scrollerTag: scroller.tagName.toLowerCase(),
        scrollerOverflowY: getComputedStyle(scroller).overflowY,
        htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
        bodyOverflowY: getComputedStyle(document.body).overflowY,
      };
    });
    menu.backgroundScrollLocked = lockState.scrollerOverflowY === "hidden";
    menu.lockState = lockState;

    await mp.keyboard.press("Escape");
    await mp.waitForTimeout(300);
    menu.closesOnEsc = !(await mp.locator(".mobile-menu nav").isVisible());

    if (!menu.closesOnEsc) await summary.click();
    await mp.waitForTimeout(200);
    await summary.click();
    await mp.waitForTimeout(200);
    await mp.locator('.mobile-menu nav a[href="#works"]').click();
    await mp.waitForTimeout(900);
    menu.linkWorks = await mp.evaluate(() => {
      const t = document.querySelector("#works");
      if (!t) return null;
      const rect = t.getBoundingClientRect();
      return { scrollY: Math.round(window.scrollY), targetTopFromViewport: Math.round(rect.top) };
    });
  } catch (e) {
    menu.error = String(e).slice(0, 160);
  }
  await mctx.close();

  /* ---- アンカーの着地位置とスムーススクロール（No.101〜102）---- */
  const actx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const ap = await actx.newPage();
  await ap.goto(URL_ARG, { waitUntil: "networkidle" });
  const scrollBehavior = await ap.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  const scrollPaddingTop = await ap.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop);
  const headerHeight = await ap.evaluate(() => Math.round(document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0));
  const anchors = [];
  for (const id of ["strength", "first", "service", "works", "voice", "company", "faq", "contact"]) {
    const exists = await ap.locator(`#${id}`).count();
    if (!exists) { anchors.push({ id, exists: false }); continue; }
    await ap.evaluate(() => window.scrollTo(0, 0));
    await ap.waitForTimeout(150);
    // デスクトップ幅では隠れているリンク（モバイルメニュー内）があるため、見えているものを使う
    const link = ap.locator(`a[href="#${id}"]:visible`).first();
    if ((await link.count()) === 0) {
      anchors.push({ id, exists: true, note: "この幅では可視なリンクが無い" });
      continue;
    }
    await link.click();
    await ap.waitForTimeout(1200);
    const pos = await ap.evaluate((i) => {
      const t = document.getElementById(i);
      return { top: Math.round(t.getBoundingClientRect().top), scrollY: Math.round(window.scrollY) };
    }, id);
    anchors.push({ id, exists: true, ...pos });
  }

  /* ---- prefers-reduced-motion（No.104）---- */
  await ap.emulateMedia({ reducedMotion: "reduce" });
  await ap.reload({ waitUntil: "networkidle" });
  const reduced = await ap.evaluate(() => {
    const el = document.querySelector(".header-contact") ?? document.querySelector("a");
    const cs = getComputedStyle(el);
    return {
      matches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      transitionDuration: cs.transitionDuration,
      animationDuration: cs.animationDuration,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    };
  });
  await actx.close();
  await ctx.close();
  await browser.close();

  report.engines[name] = { version, widths, cssSupport, infoAreaVisible, menu, anchors, scrollBehavior, scrollPaddingTop, headerHeight, reduced };
}

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const [name, r] of Object.entries(report.engines)) {
    console.log(`\n########## ${name} ${r.version ?? ""} ##########`);
    if (r.error) { console.log(`  起動できません: ${r.error}`); continue; }
    console.log("  No.89-94 画面幅ごとの実測");
    for (const w of r.widths) {
      console.log(
        `    ${String(w.width).padStart(5)}px  scrollW=${String(w.scrollWidth).padStart(5)}  横スクロール=${w.horizontalScroll ? "あり" : "なし"}  はみ出し=${w.overflowing}  h1=${w.h1}  console error=${w.consoleErrors}  pageerror=${w.pageErrors}`
      );
    }
    console.log("  No.86 新しい CSS 機能の対応");
    for (const [k, v] of Object.entries(r.cssSupport)) console.log(`    ${k.padEnd(24)} ${v ? "対応" : "非対応"}`);
    console.log(`    .info-area: display=${r.infoAreaVisible?.display} columns=${r.infoAreaVisible?.columns} 表示中の子=${r.infoAreaVisible?.childrenVisible}`);
    console.log("  No.98-100 モバイルメニュー");
    console.log(`    ハンバーガー表示=${r.menu.summaryVisible}  クリックで開く=${r.menu.opensOnClick}  リンク数=${r.menu.linkCount}`);
    console.log(
      `    Escで閉じる=${r.menu.closesOnEsc}  背面スクロール固定=${r.menu.backgroundScrollLocked}` +
        ` (スクロール要素=${r.menu.lockState?.scrollerTag} overflow-y=${r.menu.lockState?.scrollerOverflowY} / html=${r.menu.lockState?.htmlOverflowY} / body=${r.menu.lockState?.bodyOverflowY})`
    );
    console.log(`    メニュー内リンクの移動結果=${JSON.stringify(r.menu.linkWorks)}${r.menu.error ? "  error=" + r.menu.error : ""}`);
    console.log(`  No.101-102 アンカー着地  scroll-behavior=${r.scrollBehavior}  scroll-padding-top=${r.scrollPaddingTop}  ヘッダー高=${r.headerHeight}px`);
    for (const a of r.anchors) console.log(`    #${a.id.padEnd(9)} ${a.exists ? `着地時の要素上端=${String(a.top).padStart(4)}px (scrollY=${a.scrollY})` : "対象なし"}`);
    console.log(`  No.104 prefers-reduced-motion: matches=${r.reduced.matches} transition=${r.reduced.transitionDuration} animation=${r.reduced.animationDuration} scroll-behavior=${r.reduced.scrollBehavior}`);
  }
}
