#!/usr/bin/env node
/**
 * 水まわりの新しい写真が、カードとヒーローでどう切り抜かれるかを撮って確かめる。
 *
 * 写真の主役（作業している職人）が枠の外に出ていないかを見るためのもの。
 * 画像そのものではなく「枠に実際に写っている部分」を撮る。
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "reports/water";
mkdirSync(OUT, { recursive: true });

const TARGETS = [
  // [出力名, URL, セレクタ, 画面幅]
  ["card-1280", "/", ".service-grid > article:nth-child(3) .service-image", 1280],
  ["card-900", "/", ".service-grid > article:nth-child(3) .service-image", 900],
  ["card-390", "/", ".service-grid > article:nth-child(3) .service-image", 390],
  ["hero-1440", "/reform/water", ".page-hero", 1440],
  ["hero-1280", "/reform/water", ".page-hero", 1280],
  ["hero-760", "/reform/water", ".page-hero", 760],
  ["hero-390", "/reform/water", ".page-hero", 390],
  ["menu-1280", "/reform", ".reform-menu-grid > article:nth-child(3) .reform-menu-image", 1280],
];

const browser = await chromium.launch();
for (const [name, path, selector, width] of TARGETS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`http://127.0.0.1:4173${path}`, { waitUntil: "networkidle" });
  const el = page.locator(selector).first();
  if (await el.count() === 0) {
    console.log(`  ${name}: セレクタが見つかりません（${selector}）`);
    await page.close();
    continue;
  }
  const box = await el.boundingBox();
  await el.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  ${name}: ${Math.round(box.width)}x${Math.round(box.height)}  (${(box.width / box.height).toFixed(2)}:1)`);
  await page.close();
}
await browser.close();
