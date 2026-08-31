#!/usr/bin/env node
/**
 * ビルド鮮度・配信内容の同一性チェック（フェーズ0 No.3 / No.6 の検査道具）
 *
 * 「いま見ている URL が最新のソースか」を、目視ではなく機械的に判定する。
 *
 *  1. ソース最終更新時刻 と dist/ の生成時刻を比較（dist が古ければ NG）
 *  2. --url 指定時、その URL の HTML を取得し
 *     a. app/page.tsx から自動抽出した日本語マーカー文字列が含まれるか
 *     b. HTML が参照している /assets/*.js が dist/client/assets に実在するか
 *     を検証する
 *
 * 使い方:
 *   node scripts/check/freshness.mjs
 *   node scripts/check/freshness.mjs --url http://localhost:8787/
 *   node scripts/check/freshness.mjs --url http://localhost:8787/ --json
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const AS_JSON = argv.includes("--json");
const urlIdx = argv.indexOf("--url");
const URL_ARG = urlIdx >= 0 ? argv[urlIdx + 1] : null;

const SOURCE_TARGETS = [
  "app", "components", "hooks", "lib", "public", "worker", "db", "vendor", "build",
  "package.json", "next.config.ts", "vite.config.ts", "postcss.config.mjs", "tsconfig.json",
];
const DIST_DIR = path.join(ROOT, "dist");

/** ディレクトリ／ファイルを再帰的に走査し、最も新しい mtime を返す。 */
function newestMtime(target) {
  const abs = path.isAbsolute(target) ? target : path.join(ROOT, target);
  if (!existsSync(abs)) return null;
  const st = statSync(abs);
  if (st.isFile()) return { mtime: st.mtimeMs, file: path.relative(ROOT, abs) };
  let best = null;
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const child = newestMtime(path.join(abs, entry.name));
    if (child && (!best || child.mtime > best.mtime)) best = child;
  }
  return best;
}

let newestSource = null;
for (const t of SOURCE_TARGETS) {
  const r = newestMtime(t);
  if (r && (!newestSource || r.mtime > newestSource.mtime)) newestSource = r;
}
const newestDist = newestMtime(DIST_DIR);

/** app/page.tsx から日本語を含む長めの文字列リテラルをマーカーとして抽出する。 */
function extractMarkers(limit = 5) {
  const src = readFileSync(path.join(ROOT, "app", "page.tsx"), "utf8");
  const found = new Set();
  const re = /"([^"\\\n]{12,})"/g;
  let m;
  while ((m = re.exec(src))) {
    const s = m[1];
    if (!/[ぁ-んァ-ン一-龥]/.test(s)) continue;
    if (s.includes("<") || s.includes("{")) continue;
    found.add(s);
  }
  return [...found].sort().slice(0, limit);
}

const markers = extractMarkers();

/** dist/client/assets に存在する成果物ファイル名一覧 */
function distAssets() {
  const dir = path.join(DIST_DIR, "client", "assets");
  if (!existsSync(dir)) return [];
  return readdirSync(dir);
}

const result = {
  checkedAt: new Date().toISOString(),
  source: newestSource,
  dist: newestDist,
  distIsFresh: null,
  url: URL_ARG,
  markers,
  markersFound: null,
  missingMarkers: [],
  referencedAssets: [],
  missingAssets: [],
  ok: false,
};

if (!newestDist) {
  result.distIsFresh = false;
} else {
  result.distIsFresh = newestDist.mtime >= newestSource.mtime;
}

let ok = result.distIsFresh === true;

if (URL_ARG) {
  let html = "";
  try {
    // keep-alive ソケットが残ると Windows で終了時に libuv アサーションが出るため接続を閉じる
    const res = await fetch(URL_ARG, {
      headers: { "cache-control": "no-cache", connection: "close" },
    });
    result.httpStatus = res.status;
    html = await res.text();
  } catch (e) {
    result.fetchError = String(e);
    ok = false;
  }
  if (html) {
    result.htmlBytes = html.length;
    result.missingMarkers = markers.filter((s) => !html.includes(s));
    result.markersFound = markers.length - result.missingMarkers.length;
    if (result.missingMarkers.length > 0) ok = false;

    const assetRe = /\/assets\/([A-Za-z0-9._-]+\.(?:js|css))/g;
    const refs = new Set();
    let m;
    while ((m = assetRe.exec(html))) refs.add(m[1]);
    result.referencedAssets = [...refs].sort();
    const present = new Set(distAssets());
    result.missingAssets = result.referencedAssets.filter((f) => !present.has(f));
    if (result.missingAssets.length > 0) ok = false;
  }
}

result.ok = ok;

if (AS_JSON) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const fmt = (r) => (r ? `${new Date(r.mtime).toISOString()}  (${r.file})` : "なし");
  console.log(`[freshness] ソース最終更新 : ${fmt(newestSource)}`);
  console.log(`[freshness] dist 最終生成   : ${fmt(newestDist)}`);
  console.log(`[freshness] dist は最新か   : ${result.distIsFresh ? "YES" : "NO"}`);
  if (URL_ARG) {
    console.log(`[freshness] URL             : ${URL_ARG}  (HTTP ${result.httpStatus ?? "-"})`);
    if (result.fetchError) console.log(`[freshness] 取得エラー      : ${result.fetchError}`);
    console.log(`[freshness] マーカー一致    : ${result.markersFound ?? "-"} / ${markers.length}`);
    for (const s of result.missingMarkers) console.log(`  ! 未検出: ${s}`);
    console.log(`[freshness] 参照アセット    : ${result.referencedAssets.length} 件`);
    for (const s of result.missingAssets) console.log(`  ! dist に不在: ${s}`);
  }
  console.log(`[freshness] 判定            : ${ok ? "OK" : "NG"}`);
}

// process.exit() は保留中のソケット破棄と競合するため exitCode で終了させる
process.exitCode = ok ? 0 : 1;
