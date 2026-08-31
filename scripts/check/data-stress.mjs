#!/usr/bin/env node
/**
 * データ耐性試験（フェーズ1 No.17 / No.18 / No.19）
 *
 * app/page.tsx を一時的に書き換えて本番ビルドし、実描画で挙動を確かめてから
 * 必ず元に戻す。git 管理下なので復元は `git checkout -- app/page.tsx` で行う。
 *
 *   --mode empty    … 一覧データ（services / works / voices / faqs）を 0 件にする
 *                     → 見出しだけ残って空白にならないか（No.17）
 *                     → 画面に undefined / null が出ないか（No.18）
 *   --mode longest  … 会社名・代表者名・サービス名を想定最長値に置き換える
 *                     → 崩れないか（No.19）
 *
 * 使い方:
 *   node scripts/check/data-stress.mjs --mode empty
 *   node scripts/check/data-stress.mjs --mode longest
 *
 * 前提: ビルドとサーバ起動を行うため数十秒かかる。
 *       実行後は app/page.tsx が元に戻り、dist も元データで再ビルドされる。
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : d;
};
const MODE = opt("mode", "empty");
const ROOT = process.cwd();
const PAGE = path.join(ROOT, "app", "page.tsx");
const OUT_DIR = path.join(ROOT, "reports", "phase1");
const URL = "http://127.0.0.1:4173/";

/** 想定最長値。実在の値ではなく、崩れを見るための上限テスト用。 */
const LONGEST = [
  ["やっとる建設株式会社", "やっとる建設ホームリフォームサービス株式会社福岡博多支店"],
  ["山田 太郎", "山田 太郎左衛門三郎"],
  ["外壁塗装", "外壁塗装・屋根塗装トータルメンテナンスパック"],
  ["水まわりリフォーム", "キッチン・浴室・洗面・トイレ水まわり一括リフォーム"],
  ["福岡県知事許可（般-4）第12345号", "福岡県知事許可（般-4）第12345号／一級建築士事務所登録 第A1234号"],
];

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8", stdio: "pipe", ...opts });

/** npm は Windows ではバッチファイルのため cmd 経由で呼ぶ（shell:true は非推奨警告が出る）。 */
const runNpm = (args) =>
  process.platform === "win32" ? run("cmd", ["/c", "npm", ...args]) : run("npm", args);

/** 一覧データの配列リテラルを [] に置き換える（括弧の対応を数えて範囲を決める） */
function emptyArrays(src) {
  let s = src;
  for (const name of ["services", "works", "voices", "faqs"]) {
    const start = s.indexOf(`const ${name} = [`);
    if (start < 0) throw new Error(`配列が見つかりません: ${name}`);
    const open = s.indexOf("[", start);
    let depth = 0;
    let end = -1;
    for (let j = open; j < s.length; j++) {
      if (s[j] === "[") depth++;
      else if (s[j] === "]" && --depth === 0) { end = j; break; }
    }
    if (end < 0) throw new Error(`括弧が閉じていません: ${name}`);
    s = s.slice(0, open) + "[]" + s.slice(end + 1);
  }
  return s;
}

function longestValues(src) {
  let s = src;
  for (const [from, to] of LONGEST) s = s.split(from).join(to);
  return s;
}

mkdirSync(OUT_DIR, { recursive: true });
const original = readFileSync(PAGE, "utf8");

try {
  const patched = MODE === "empty" ? emptyArrays(original) : longestValues(original);
  writeFileSync(PAGE, patched);
  console.log(`[stress] mode=${MODE} で app/page.tsx を一時置換しました`);

  runNpm(["run", "build"]);
  console.log("[stress] 本番ビルド完了");

  run(process.execPath, ["scripts/check/serve.mjs", "start"]);

  const res = await fetch(URL, { headers: { connection: "close" } });
  const html = await res.text();
  const htmlPath = path.join(OUT_DIR, `${MODE}-data.html`);
  writeFileSync(htmlPath, html);
  console.log(`[stress] HTML を保存: ${path.relative(ROOT, htmlPath)}  (${html.length} bytes)`);

  console.log("\n--- 可視テキストの検査 ---");
  console.log(run(process.execPath, ["scripts/check/visible-text.mjs", htmlPath]));

  console.log("--- 実描画の検査 ---");
  try {
    console.log(run(process.execPath, ["scripts/check/render.mjs", "--url", URL]));
  } catch (e) {
    console.log(e.stdout ?? String(e));
  }
} finally {
  // git checkout で戻すと未コミットの修正まで巻き戻るため、実行前の内容をそのまま書き戻す
  writeFileSync(PAGE, original);
  console.log("[stress] app/page.tsx を実行前の内容に復元しました");
  runNpm(["run", "build"]);
  run(process.execPath, ["scripts/check/serve.mjs", "start"]);
  console.log("[stress] 元データで再ビルド・再起動しました");
}
