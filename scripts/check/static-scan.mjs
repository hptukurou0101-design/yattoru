#!/usr/bin/env node
/**
 * ソース静的走査（フェーズ1 No.11 / No.15 / No.20〜No.27）
 *
 *   No.11 同じ役割の要素の構造差分（カード系コンポーネントの構造一覧）
 *   No.15 クラス名と使用箇所の対応表（別用途への流用を洗い出す材料）
 *   No.20/25 仮文言の残留
 *   No.21 リンク先「#」・ダミーURL・ダミー画像
 *   No.22 console.log 等のデバッグ残留
 *   No.23 未参照のコンポーネント／アセット
 *   No.24 設定ファイルのプロジェクト名
 *   No.26 電話番号の残留
 *   No.27 メールアドレスの残留
 *
 * 使い方:
 *   node scripts/check/static-scan.mjs
 *   node scripts/check/static-scan.mjs --json
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const AS_JSON = process.argv.includes("--json");

const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".json", ".md", ".html", ".svg"]);
const SKIP_DIR = new Set(["node_modules", ".git", "dist", ".wrangler", ".sites-runtime", "reports", "drizzle"]);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walk(ROOT).map((p) => path.relative(ROOT, p).replace(/\\/g, "/"));
const textFiles = allFiles.filter((f) => TEXT_EXT.has(path.extname(f).toLowerCase()));
const read = (f) => readFileSync(path.join(ROOT, f), "utf8");

/** サイト本体のソース（検査スクリプト自身と雛形は除外） */
const SITE_SRC = textFiles.filter(
  (f) => /^(app|components|hooks|lib|worker|db|build|types)\//.test(f) && !f.startsWith("scripts/")
);
/** 実際に画面を構成しているファイル */
const PAGE_SRC = SITE_SRC.filter((f) => f.startsWith("app/"));

const grepAll = (files, re) => {
  const hits = [];
  for (const f of files) {
    const lines = read(f).split(/\r?\n/);
    lines.forEach((line, i) => {
      const m = line.match(re);
      if (m) hits.push({ file: f, line: i + 1, match: m[0], excerpt: line.trim().slice(0, 140) });
    });
  }
  return hits;
};

// ---------- No.20 / No.25 仮文言 ----------
// 「後で」単独だと「前後で」「直後で」に誤反応するため、作業メモらしい形に限定する
const placeholderText = grepAll(
  SITE_SRC,
  /(準備中|coming\s*soon|lorem\s+ipsum|ダミー|dummy\s+text|サンプルテキスト|TODO|FIXME|(?:後|あとで)(?:で)?(?:直す|対応|修正|やる))/i
);

// ---------- 伏字・仮の事実値 ----------
const maskedFacts = grepAll(PAGE_SRC, /(○|×××|〇〇|＊＊|\bXXXX?\b)/);

// ---------- No.21 リンク先 # / ダミーURL ----------
const anchorHrefs = grepAll(PAGE_SRC, /href="#[^"]*"/);
// Tailwind の `placeholder:` バリアントを誤検出しないよう、ドメイン形でのみ判定する
const dummyUrls = grepAll(
  SITE_SRC,
  /(example\.(com|org|net)|placehold\.(co|it|jp)|placeholder\.com|lorempixel|via\.placeholder|dummyimage\.com|picsum\.photos|https?:\/\/localhost)/i
);

// ---------- No.22 デバッグ残留 ----------
const debugLeft = grepAll(SITE_SRC, /(console\.(log|debug|info|table|dir)\s*\(|\bdebugger\b)/);

// ---------- No.26 電話番号 / No.27 メール ----------
const phones = grepAll(PAGE_SRC, /(tel:\+?[0-9-]{9,}|0\d{1,4}-\d{1,4}-\d{3,4})/);
const emails = grepAll(PAGE_SRC, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);

// ---------- No.15 クラス名と使用箇所 ----------
const cssClasses = new Map(); // class -> 定義行
if (existsSync(path.join(ROOT, "app/globals.css"))) {
  const css = read("app/globals.css").split(/\r?\n/);
  css.forEach((line, i) => {
    for (const m of line.matchAll(/(^|[\s,>+~])\.([a-zA-Z][\w-]*)/g)) {
      const name = m[2];
      if (!cssClasses.has(name)) cssClasses.set(name, []);
      cssClasses.get(name).push(i + 1);
    }
  });
}
const classUsage = [];
for (const [name, defLines] of cssClasses) {
  const uses = grepAll(PAGE_SRC, new RegExp(`className="[^"]*\\b${name}\\b[^"]*"`));
  classUsage.push({
    class: name,
    definedAtLines: defLines.length,
    usedCount: uses.length,
    usedAt: uses.map((u) => `${u.file}:${u.line}`),
  });
}
const unusedClasses = classUsage.filter((c) => c.usedCount === 0);
// 複数の異なる役割ブロックで使い回されているクラス（流用の候補）
const sharedClasses = classUsage.filter((c) => c.usedCount >= 2);

// ---------- No.23 未参照のコンポーネント／アセット ----------
const referencedText = SITE_SRC.map(read).join("\n") + "\n" + PAGE_SRC.map(read).join("\n");
const componentFiles = allFiles.filter((f) => f.startsWith("components/"));
const unusedComponents = componentFiles.filter((f) => {
  const base = path.basename(f, path.extname(f));
  return !new RegExp(`components/ui/${base}["']|from ["']@/components/ui/${base}["']`).test(referencedText);
});
const publicAssets = allFiles.filter((f) => f.startsWith("public/"));
const unusedAssets = publicAssets.filter((f) => {
  const web = "/" + f.replace(/^public\//, "");
  return !referencedText.includes(web);
});
const otherDirs = ["examples", "db", "drizzle"].filter((d) => existsSync(path.join(ROOT, d)));
const unusedDirs = otherDirs.filter((d) => {
  const files = allFiles.filter((f) => f.startsWith(d + "/"));
  return files.every((f) => {
    const base = path.basename(f, path.extname(f));
    return !PAGE_SRC.some((p) => read(p).includes(base));
  });
});

// ---------- No.24 設定ファイルのプロジェクト名 ----------
const pkg = JSON.parse(read("package.json"));
const layout = existsSync(path.join(ROOT, "app/layout.tsx")) ? read("app/layout.tsx") : "";
const projectNames = {
  "package.json:name": pkg.name,
  "package.json:displayName": pkg.displayName ?? null,
  "app/layout.tsx:title": (layout.match(/title:\s*"([^"]*)"/) ?? [])[1] ?? null,
  "README.md:先頭見出し": existsSync(path.join(ROOT, "README.md")) ? read("README.md").split("\n")[0] : null,
  ".openai/hosting.json:project_id": existsSync(path.join(ROOT, ".openai/hosting.json"))
    ? JSON.parse(read(".openai/hosting.json")).project_id
    : null,
};

// ---------- No.11 同じ役割の要素の構造 ----------
const page = existsSync(path.join(ROOT, "app/page.tsx")) ? read("app/page.tsx") : "";
const cardStructures = [];
for (const [, cls] of page.matchAll(/className="(service-card|work-card|voice[^"]*|company-card|faq-card)"/g)) {
  cardStructures.push(cls);
}

const report = {
  checkedAt: new Date().toISOString(),
  counts: {
    siteSourceFiles: SITE_SRC.length,
    placeholderText: placeholderText.length,
    maskedFacts: maskedFacts.length,
    anchorHrefs: anchorHrefs.length,
    dummyUrls: dummyUrls.length,
    debugLeft: debugLeft.length,
    phones: phones.length,
    emails: emails.length,
    unusedComponents: unusedComponents.length,
    unusedAssets: unusedAssets.length,
    unusedClasses: unusedClasses.length,
  },
  placeholderText,
  maskedFacts,
  anchorHrefs,
  dummyUrls,
  debugLeft,
  phones,
  emails,
  classUsage: classUsage.sort((a, b) => b.usedCount - a.usedCount),
  unusedClasses,
  sharedClasses,
  unusedComponents,
  unusedAssets,
  unusedDirs,
  projectNames,
  cardStructures,
};

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const list = (title, arr, fmt = (h) => `${h.file}:${h.line}  ${h.excerpt}`) => {
    console.log(`\n=== ${title}: ${arr.length} 件 ===`);
    for (const h of arr.slice(0, 40)) console.log(`  ${typeof h === "string" ? h : fmt(h)}`);
    if (arr.length > 40) console.log(`  ...ほか ${arr.length - 40} 件`);
  };

  console.log(`[static] サイト本体のソース: ${SITE_SRC.length} ファイル（app/ は ${PAGE_SRC.length}）`);
  list("No.20/25 仮文言の残留", placeholderText);
  list("伏字・仮の事実値（○ 等）", maskedFacts);
  list("No.21 href=\"#...\"（ページ内アンカー含む）", anchorHrefs);
  list("No.21 ダミーURL・ダミー画像", dummyUrls);
  list("No.22 デバッグ残留", debugLeft);
  list("No.26 電話番号", phones);
  list("No.27 メールアドレス", emails);
  list("No.23 未参照コンポーネント", unusedComponents);
  list("No.23 未参照アセット", unusedAssets);
  list("No.23 未参照ディレクトリ", unusedDirs);
  list("No.15 未使用クラス（CSS 定義のみ）", unusedClasses.map((c) => `.${c.class}`));

  console.log(`\n=== No.15 複数箇所で使われているクラス（流用候補）: ${sharedClasses.length} 件 ===`);
  for (const c of sharedClasses) console.log(`  .${c.class.padEnd(20)} 使用 ${c.usedCount} 箇所  ${c.usedAt.join(", ")}`);

  console.log(`\n=== No.24 設定ファイルのプロジェクト名 ===`);
  for (const [k, v] of Object.entries(projectNames)) console.log(`  ${k.padEnd(34)}: ${v}`);
}
