#!/usr/bin/env node
/**
 * 受領した実写 3 枚を、工種ごとの正しい枠に割り当てる
 *
 * これまで屋根塗装は外壁塗装と同じ画像を流用していた。
 * 屋根の作業写真が届いたので、専用の画像に差し替えて重複を解消する。
 *
 *   service-exterior.webp  外壁塗装      … 壁面と屋根が写る戸建ての外観
 *   service-roof.webp      屋根塗装      … 屋根の上で塗装している作業写真（新規）
 *   service-water.webp     水まわり      … 洗面と浴室（旧 service-kitchen.webp を置き換え）
 *
 * alt も実物に合わせて書き換える。
 * 旧画像はキッチンだったため「キッチン」と書かれていたが、
 * 新しい写真は洗面と浴室なので、そのままでは内容と食い違う。
 */
import { readFileSync, writeFileSync } from "node:fs";

/** [ファイル, 置換前, 置換後, 説明] */
const EDITS = [
  // ---- 屋根塗装: 外壁と同じ画像を使っていたのをやめ、専用の写真にする ----
  ["app/page.tsx", `    title: "屋根塗装",
    description:
      "見えにくい屋根の状態も丁寧に確認します。\\n劣化の程度とご予算を踏まえ、\\n無理のない工事方法をご提案します。",
    image: "/service-exterior.webp",
    alt: "塗装後の屋根と外壁",`,
   `    title: "屋根塗装",
    description:
      "見えにくい屋根の状態も丁寧に確認します。\\n劣化の程度とご予算を踏まえ、\\n無理のない工事方法をご提案します。",
    image: "/service-roof.webp",
    alt: "屋根の上でローラーを使って塗装する職人",`,
   "トップ サービスカード 屋根塗装"],

  ["app/reform/roof/page.tsx", `    image: "/service-exterior.webp",`,
   `    image: "/service-roof.webp",`,
   "/reform/roof のヒーロー"],

  // ---- 水まわり: 画像名とあわせて alt も洗面・浴室に直す ----
  ["app/page.tsx", `    image: "/service-kitchen.webp",
    alt: "使いやすくリフォームしたキッチン",`,
   `    image: "/service-water.webp",
    alt: "入れ替えた洗面台と浴室",`,
   "トップ サービスカード 水まわり"],

  ["app/page.tsx", `    image: "/service-kitchen.webp",
    alt: "収納と動線を整えたキッチン",`,
   `    image: "/service-water.webp",
    alt: "入れ替えた洗面台と浴室",`,
   "トップ 施工事例カード"],

  ["app/page.tsx", `<Image src="/service-kitchen.webp" alt="リフォーム後の明るいキッチン" fill sizes="(max-width: 800px) 100vw, 46vw" />`,
   `<Image src="/service-water.webp" alt="入れ替えた洗面台と浴室" fill sizes="(max-width: 800px) 100vw, 46vw" />`,
   "トップ 相談セクション"],

  ["app/contact/page.tsx", `image="/service-kitchen.webp" alt="リフォーム後の明るいキッチン"`,
   `image="/service-water.webp" alt="入れ替えた洗面台と浴室"`,
   "/contact のヒーロー"],

  ["app/faq/page.tsx", `image="/service-kitchen.webp" alt="使いやすく整えた明るいキッチン"`,
   `image="/service-water.webp" alt="入れ替えた洗面台と浴室"`,
   "/faq のヒーロー"],

  ["app/reform/water/page.tsx", `    image: "/service-kitchen.webp",`,
   `    image: "/service-water.webp",`,
   "/reform/water のヒーロー"],
];

let n = 0;
for (const [file, from, to, label] of EDITS) {
  const s = readFileSync(file, "utf8");
  const count = s.split(from).length - 1;
  if (count !== 1) {
    console.error(`一致数が ${count} 件（1 件であるべき）: ${label}\n  ${file}`);
    process.exit(1);
  }
  writeFileSync(file, s.split(from).join(to));
  n++;
  console.log(`  ${label}`);
}

/* ---- lib/site-data.ts は行番号で場所が決まっているため個別に扱う ---- */
{
  const F = "lib/site-data.ts";
  let s = readFileSync(F, "utf8");
  const subs = [
    // reformServices の 2 番目（屋根塗装）
    [`    title: "屋根塗装",`, `    title: "屋根塗装",`, null],
  ];
  void subs;
  // 屋根塗装のブロックだけ image を差し替える
  const roofBlock = s.match(/\{[^{}]*title: "屋根塗装"[^{}]*\}/s);
  if (!roofBlock) {
    console.error("lib/site-data.ts に屋根塗装のブロックが見つかりません");
    process.exit(1);
  }
  const fixedRoof = roofBlock[0].replace(`"/service-exterior.webp"`, `"/service-roof.webp"`)
    .replace(/alt: "[^"]*"/, `alt: "屋根の上でローラーを使って塗装する職人"`);
  s = s.replace(roofBlock[0], fixedRoof);

  // 残りの service-kitchen 参照を water へ
  const kitchenCount = s.split(`"/service-kitchen.webp"`).length - 1;
  s = s.split(`"/service-kitchen.webp"`).join(`"/service-water.webp"`);
  s = s.replace(/alt: "使いやすくリフォームしたキッチン"/g, `alt: "入れ替えた洗面台と浴室"`);
  s = s.replace(/alt: "収納と動線を整えたキッチン"/g, `alt: "入れ替えた洗面台と浴室"`);

  writeFileSync(F, s);
  console.log(`  lib/site-data.ts（屋根 1 件 / 水まわり ${kitchenCount} 件）`);
  n += 1 + kitchenCount;
}

console.log(`\n${n} 箇所を差し替えました`);
