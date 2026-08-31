#!/usr/bin/env node
/**
 * サイト内の全ページを列挙する（複数ページ対応の共通モジュール兼 CLI）
 *
 * app/ 配下の page.tsx からルートを組み立てる。
 * 各検査スクリプトはこの一覧を使って全ページを走査する。
 *
 * 使い方:
 *   node scripts/check/pages.mjs           … 一覧を表示
 *   node scripts/check/pages.mjs --csv     … カンマ区切りで出力（他スクリプトへ渡す用）
 */
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** app/ 配下を再帰的に辿って page.tsx のあるディレクトリをルートに変換する。 */
export function listRoutes(appDir = "app") {
  const routes = [];
  const walk = (dir, segments) => {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    if (entries.some((e) => e.isFile() && e.name === "page.tsx")) {
      routes.push("/" + segments.join("/"));
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      // ルートグループ (group) や動的セグメント [id] はここでは扱わない
      if (e.name.startsWith("(") || e.name.startsWith("[") || e.name.startsWith("_")) continue;
      walk(path.join(dir, e.name), [...segments, e.name]);
    }
  };
  walk(appDir, []);
  return routes.map((r) => (r === "/" ? "/" : r.replace(/\/+$/, ""))).sort();
}

// 直接実行されたときだけ CLI として動く（Windows でもパス表記が揺れないよう pathToFileURL を使う）
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const routes = listRoutes();
  if (process.argv.includes("--csv")) {
    console.log(routes.join(","));
  } else {
    console.log(`[pages] ${routes.length} ページ`);
    for (const r of routes) console.log(`  ${r}`);
  }
}
