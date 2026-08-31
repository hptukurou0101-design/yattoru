#!/usr/bin/env node
/**
 * レイアウトの実測監査（フェーズ1 No.10 / No.12 / No.13 / No.16）
 *
 * ヘッドレスブラウザで実際に描画し、計算済みスタイルと実寸を取り出す。
 *   No.10 同じ役割のセクションの上下余白が同一か → 各セクションの padding-block 実測値
 *   No.12 位置がマージン相殺や静的位置に依存していないか
 *          → セクション間の実隙間と、それを作っている宣言（padding / margin / gap）の対応
 *   No.13 min-height の余りが片側に落ちていないか
 *          → min-height 指定要素の内側上下スペースの実測
 *   No.16 余白が「前に別要素が来る前提」になっていないか
 *          → 各コンテナの最初の子の上方向余白（margin-top 依存かどうか）
 *
 * 使い方:
 *   node scripts/check/layout-audit.mjs --url http://127.0.0.1:4173/
 *   node scripts/check/layout-audit.mjs --url http://127.0.0.1:4173/ --width 1280 --json
 */
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : d;
};
const URL_ARG = opt("url", "http://127.0.0.1:4173/");
const WIDTH = Number(opt("width", "1280"));
const AS_JSON = argv.includes("--json");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
await page.goto(URL_ARG, { waitUntil: "networkidle" });

const data = await page.evaluate(() => {
  const label = (el) =>
    el.tagName.toLowerCase() +
    (el.id ? `#${el.id}` : "") +
    (typeof el.className === "string" && el.className.trim()
      ? "." + el.className.trim().split(/\s+/).join(".")
      : "");

  const px = (v) => Math.round(parseFloat(v) || 0);

  // --- No.10 / No.12: 最上位セクションの余白と隙間 ---
  const main = document.querySelector("main");
  const sections = main ? [...main.children] : [];
  const sectionRows = sections.map((el, i) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const prev = i > 0 ? sections[i - 1] : null;
    const prevRect = prev ? prev.getBoundingClientRect() : null;
    const prevCs = prev ? getComputedStyle(prev) : null;
    return {
      index: i,
      selector: label(el),
      paddingTop: px(cs.paddingTop),
      paddingBottom: px(cs.paddingBottom),
      marginTop: px(cs.marginTop),
      marginBottom: px(cs.marginBottom),
      display: cs.display,
      minHeight: cs.minHeight,
      rectTop: Math.round(r.top + window.scrollY),
      rectBottom: Math.round(r.bottom + window.scrollY),
      height: Math.round(r.height),
      // 直前セクションの下端との実隙間。0 なら隙間は各自の padding で作られている
      gapFromPrev: prevRect ? Math.round(r.top - prevRect.bottom) : null,
      prevMarginBottom: prevCs ? px(prevCs.marginBottom) : null,
    };
  });

  // --- No.13: min-height 指定要素の上下スペース ---
  const minHeightRows = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.minHeight === "0px" || cs.minHeight === "auto" || !cs.minHeight) continue;
    const r = el.getBoundingClientRect();
    if (r.height === 0) continue;
    const kids = [...el.children].map((c) => c.getBoundingClientRect()).filter((k) => k.height > 0);
    if (kids.length === 0) continue;
    const contentTop = Math.min(...kids.map((k) => k.top));
    const contentBottom = Math.max(...kids.map((k) => k.bottom));
    minHeightRows.push({
      selector: label(el),
      minHeight: cs.minHeight,
      height: Math.round(r.height),
      display: cs.display,
      alignItems: cs.alignItems,
      justifyContent: cs.justifyContent,
      slackTop: Math.round(contentTop - r.top),
      slackBottom: Math.round(r.bottom - contentBottom),
    });
  }

  // --- No.16: コンテナ先頭の子が margin-top に依存していないか ---
  const firstChildRows = [];
  const containers = [main, ...sections, ...document.querySelectorAll(".section-wrap")].filter(Boolean);
  for (const c of new Set(containers)) {
    const first = c.firstElementChild;
    if (!first) continue;
    const fcs = getComputedStyle(first);
    const ccs = getComputedStyle(c);
    firstChildRows.push({
      container: label(c),
      firstChild: label(first),
      containerPaddingTop: px(ccs.paddingTop),
      firstChildMarginTop: px(fcs.marginTop),
      // margin-top を持つ先頭要素は「前に別要素が来る前提」の可能性がある
      dependsOnPrecedingSibling: px(fcs.marginTop) > 0,
    });
  }

  // --- No.14 補助: 幅いっぱい要素の space-between ---
  const spaceBetween = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.justifyContent !== "space-between") continue;
    const r = el.getBoundingClientRect();
    const parent = el.parentElement;
    const pr = parent ? parent.getBoundingClientRect() : null;
    spaceBetween.push({
      selector: label(el),
      width: Math.round(r.width),
      parentWidth: pr ? Math.round(pr.width) : null,
      fillsParent: pr ? Math.abs(r.width - pr.width) < 2 : null,
      childCount: el.children.length,
      display: cs.display,
    });
  }

  return { sectionRows, minHeightRows, firstChildRows, spaceBetween };
});

await browser.close();

if (AS_JSON) {
  console.log(JSON.stringify({ url: URL_ARG, width: WIDTH, ...data }, null, 2));
} else {
  console.log(`[layout] ${URL_ARG}  幅 ${WIDTH}px\n`);

  console.log("=== No.10 / No.12  main 直下セクションの余白と隙間 ===");
  console.log("idx  padTop padBot  marTop marBot  gapPrev  height  セレクタ");
  for (const s of data.sectionRows) {
    console.log(
      `${String(s.index).padStart(3)}  ${String(s.paddingTop).padStart(6)} ${String(s.paddingBottom).padStart(6)}  ` +
        `${String(s.marginTop).padStart(6)} ${String(s.marginBottom).padStart(6)}  ` +
        `${String(s.gapFromPrev ?? "-").padStart(7)}  ${String(s.height).padStart(6)}  ${s.selector}`
    );
  }
  const padTops = [...new Set(data.sectionRows.map((s) => s.paddingTop))].sort((a, b) => a - b);
  const padBots = [...new Set(data.sectionRows.map((s) => s.paddingBottom))].sort((a, b) => a - b);
  console.log(`  padding-top の値の種類    : ${padTops.length} (${padTops.join(", ")})`);
  console.log(`  padding-bottom の値の種類 : ${padBots.length} (${padBots.join(", ")})`);
  const collapse = data.sectionRows.filter((s) => s.gapFromPrev !== null && s.gapFromPrev !== 0);
  console.log(`  セクション間に実隙間があるもの（margin 由来の疑い）: ${collapse.length} 件`);
  for (const c of collapse) console.log(`      ! ${c.selector}  gap=${c.gapFromPrev}px  自marginTop=${c.marginTop}  前marginBottom=${c.prevMarginBottom}`);

  console.log("\n=== No.13  min-height 指定要素の上下スペース ===");
  if (data.minHeightRows.length === 0) console.log("  該当なし");
  for (const m of data.minHeightRows) {
    const imbalance = Math.abs(m.slackTop - m.slackBottom);
    console.log(
      `  ${m.selector}\n      min-height=${m.minHeight} 実高=${m.height} display=${m.display} align-items=${m.alignItems}` +
        `\n      上スペース=${m.slackTop}px  下スペース=${m.slackBottom}px  差=${imbalance}px${imbalance > 8 ? "  ← 片側寄り" : ""}`
    );
  }

  console.log("\n=== No.16  コンテナ先頭の子が margin-top に依存していないか ===");
  const dep = data.firstChildRows.filter((f) => f.dependsOnPrecedingSibling);
  console.log(`  先頭要素に margin-top が付いているもの: ${dep.length} / ${data.firstChildRows.length} 件`);
  for (const f of dep) console.log(`      ! ${f.container} > ${f.firstChild}  marginTop=${f.firstChildMarginTop} (親 paddingTop=${f.containerPaddingTop})`);

  console.log("\n=== No.14  justify-content: space-between の使用箇所 ===");
  if (data.spaceBetween.length === 0) console.log("  該当なし（0件）");
  for (const s of data.spaceBetween) {
    console.log(`  ${s.selector}  幅=${s.width} 親幅=${s.parentWidth} 親幅いっぱい=${s.fillsParent} 子要素数=${s.childCount}`);
  }
}
