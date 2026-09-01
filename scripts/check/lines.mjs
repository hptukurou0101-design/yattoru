#!/usr/bin/env node
/**
 * 指定した要素が「実際に何行で、どこで折れているか」を幅ごとに書き出す。
 *
 * 文言を直したあと、その段落が意図した位置で折れているかを目視ではなく実測で確かめるためのもの。
 * Range API で 1 文字ずつ矩形を取り、上端が変わったところを行の切れ目とみなす。
 *
 * 使い方:
 *   node scripts/check/lines.mjs <パス> <セレクタ> [幅,幅,...]
 * 例:
 *   node scripts/check/lines.mjs / ".feature-content p:nth-of-type(2)"
 */
import { chromium } from "playwright";

const [path = "/", selector, widthArg] = process.argv.slice(2);
if (!selector) {
  console.error("セレクタを指定してください");
  process.exit(1);
}
const WIDTHS = (widthArg ?? "1440,1280,1024,900,760,390").split(",").map(Number);

/** 要素の中の文字を 1 つずつ測り、上端が変わったところで行に切り分ける */
function readLines(el) {
  const texts = [];
  (function walk(node) {
    if (node.nodeType === 3) texts.push(node);
    else node.childNodes.forEach(walk);
  })(el);

  const range = document.createRange();
  const lines = [];
  let current = "";
  let top = null;
  for (const node of texts) {
    for (let i = 0; i < node.textContent.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const y = Math.round(range.getBoundingClientRect().top);
      if (top === null) top = y;
      if (y !== top) {
        lines.push(current);
        current = "";
        top = y;
      }
      current += node.textContent[i];
    }
  }
  lines.push(current);
  return lines;
}

const browser = await chromium.launch();
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 1400 } });
  await page.goto(`http://127.0.0.1:4173${path}`, { waitUntil: "networkidle" });
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const box = await el.boundingBox();
  const lines = await el.evaluate(readLines);
  const short = lines.filter((l) => l.length > 0 && l.length <= 5);
  console.log(`  ${String(width).padStart(4)}px  幅 ${Math.round(box.width)}px  ${lines.length} 行${short.length ? "   ← 5 字以下の行あり" : ""}`);
  lines.forEach((l, i) => console.log(`      ${i + 1}: ${l}  (${l.length}字)`));
  await page.close();
}
await browser.close();
