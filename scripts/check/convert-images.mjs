#!/usr/bin/env node
/**
 * 画像の形式変換（フェーズ3 No.121）
 *
 * public/ の PNG を WebP と AVIF に変換し、変換前後のサイズを比較する。
 * 元の PNG は削除せず残す（差し戻せるようにするため）。
 *
 * 変換だけを行い、参照先の書き換えはしない（--rewrite を付けたときのみ書き換える）。
 *
 * 使い方:
 *   node scripts/check/convert-images.mjs            … 変換して比較表を出す
 *   node scripts/check/convert-images.mjs --rewrite  … app/page.tsx の参照も .webp に変える
 */
import sharp from "sharp";
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const REWRITE = process.argv.includes("--rewrite");
const DIR = "public";

const pngs = readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".png"));
const rows = [];

for (const file of pngs) {
  const src = path.join(DIR, file);
  const base = file.replace(/\.png$/i, "");
  const before = statSync(src).size;

  const webpPath = path.join(DIR, `${base}.webp`);
  const avifPath = path.join(DIR, `${base}.avif`);

  await sharp(src).webp({ quality: 82, effort: 5 }).toFile(webpPath);
  await sharp(src).avif({ quality: 55, effort: 5 }).toFile(avifPath);

  const meta = await sharp(src).metadata();
  rows.push({
    file,
    width: meta.width,
    height: meta.height,
    png: before,
    webp: statSync(webpPath).size,
    avif: statSync(avifPath).size,
  });
}

const kb = (n) => `${(n / 1024).toFixed(0)}KB`;
console.log("ファイル".padEnd(24) + "寸法".padEnd(12) + "PNG".padEnd(10) + "WebP".padEnd(10) + "AVIF".padEnd(10) + "WebP 削減率");
let totalPng = 0;
let totalWebp = 0;
let totalAvif = 0;
for (const r of rows) {
  totalPng += r.png;
  totalWebp += r.webp;
  totalAvif += r.avif;
  console.log(
    r.file.padEnd(24) +
      `${r.width}x${r.height}`.padEnd(12) +
      kb(r.png).padEnd(10) +
      kb(r.webp).padEnd(10) +
      kb(r.avif).padEnd(10) +
      `${Math.round((1 - r.webp / r.png) * 100)}%`
  );
}
console.log("-".repeat(78));
console.log(
  "合計".padEnd(24) + "".padEnd(12) + kb(totalPng).padEnd(10) + kb(totalWebp).padEnd(10) + kb(totalAvif).padEnd(10) +
    `${Math.round((1 - totalWebp / totalPng) * 100)}%`
);

if (REWRITE) {
  const FILE = "app/page.tsx";
  let s = readFileSync(FILE, "utf8");
  let n = 0;
  for (const r of rows) {
    const from = `"/${r.file}"`;
    const to = `"/${r.file.replace(/\.png$/i, ".webp")}"`;
    const c = s.split(from).length - 1;
    n += c;
    s = s.split(from).join(to);
  }
  writeFileSync(FILE, s);
  console.log(`\napp/page.tsx の参照 ${n} 箇所を .webp に書き換えました`);
}
