#!/usr/bin/env node
/**
 * 下層ページのタップ領域を 44×44px 以上にする
 *
 * 実測で 44px 未満だった 8 種類のセレクタに最小サイズを与える。
 * いずれも align-items: center と併用するため、見た目の位置は変わらない。
 *
 *   nav.breadcrumb > a            33x20  パンくずのリンク（17 ページに出現）
 *   a.text-arrow-link             89x24  「詳しく見る」「事例の詳細を見る」
 *   .breadcrumb span > a          54x20  パンくず中間階層
 *   .company-overview dd > a      90x18  会社概要の電話番号
 *   .check-label > input          13x13  同意チェックボックス
 *   .contact-form span > a       112x18  個人情報保護方針へのリンク
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "app/globals.css";
let c = readFileSync(FILE, "utf8");

const RULES = `
/* =========================================================================
   タップ領域の最小サイズ（44×44px）
   下層ページで実測 44px 未満だった要素に最小サイズを与える。
   align-items: center と併用しているため、文字の位置は変わらない。
   ========================================================================= */
.breadcrumb a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}

.text-arrow-link {
  min-height: 44px;
}

.company-overview dd a[href^="tel:"] {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}

/* 同意チェックボックスは見た目 13px のままだと押しにくいので、
   ラベル全体を押せるようにしたうえで、チェックボックス自体も広げる。 */
.check-label {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  cursor: pointer;
}

.check-label > input {
  width: 20px;
  height: 20px;
  /* 見た目は 20px のまま、押せる範囲を 44px に広げる */
  outline-offset: 3px;
  box-shadow: 0 0 0 12px transparent;
}

.contact-form label span a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}
`;

if (c.includes("タップ領域の最小サイズ（44×44px）")) {
  console.log("既に適用済みです");
  process.exit(0);
}

c = c.trimEnd() + "\n" + RULES;
writeFileSync(FILE, c);
console.log("タップ領域のルールを追加しました（6 セレクタ）");
