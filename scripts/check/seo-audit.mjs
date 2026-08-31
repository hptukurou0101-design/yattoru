#!/usr/bin/env node
/**
 * SEO 内部項目の監査（フェーズ1 No.28〜40）
 *
 * 配信中の HTML を取得し、以下を機械的に抽出・判定する。
 *   - title / meta description の重複（No.28 / No.29）
 *   - h1 の個数と見出し階層の飛び（No.30 / No.31）
 *   - canonical の有無と指しているドメイン（No.32）
 *   - meta robots の noindex（No.33）
 *   - sitemap.xml / robots.txt の生成有無と中身（No.34 / No.35 / No.36）
 *   - JSON-LD の抽出と sameAs の中身（No.37 / No.38 / No.39）
 *   - OGP 画像の実在・寸法・絶対URL（No.40）
 *
 * 使い方:
 *   node scripts/check/seo-audit.mjs --base http://127.0.0.1:4173 --paths /
 *   node scripts/check/seo-audit.mjs --base http://127.0.0.1:4173 --json
 */
const argv = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : d;
};
const AS_JSON = argv.includes("--json");
const BASE = (opt("base", "http://127.0.0.1:4173") ?? "").replace(/\/$/, "");
const PATHS = (opt("paths", "/") ?? "/").split(",").map((s) => s.trim()).filter(Boolean);

async function get(url) {
  try {
    const res = await fetch(url, { headers: { connection: "close" } });
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, headers: Object.fromEntries(res.headers.entries()), buf, text: buf.toString("utf8") };
  } catch (e) {
    return { status: 0, error: String(e), buf: Buffer.alloc(0), text: "" };
  }
}

/** タグ属性をざっくり取り出す（head 内の静的 HTML が対象なので正規表現で十分） */
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i")) ?? tag.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, "i"));
  return m ? m[1] : null;
};
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];

/** PNG / JPEG のバイト列から寸法を読む（外部ライブラリ不要） */
function imageSize(buf) {
  if (buf.length > 24 && buf.toString("ascii", 1, 4) === "PNG") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), format: "png" };
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7), format: "jpeg" };
      }
      i += 2 + len;
    }
  }
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { width: null, height: null, format: "webp" };
  }
  return null;
}

const pages = [];

for (const p of PATHS) {
  const url = BASE + p;
  const res = await get(url);
  const html = res.text;
  const head = html.split(/<\/head>/i)[0] ?? html;

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metas = tags(head, "meta");
  const links = tags(head, "link");

  const metaBy = (name) => {
    const t = metas.find((m) => (attr(m, "name") ?? "").toLowerCase() === name.toLowerCase());
    return t ? attr(t, "content") : null;
  };
  const ogBy = (prop) => {
    const t = metas.find((m) => (attr(m, "property") ?? "").toLowerCase() === prop.toLowerCase());
    return t ? attr(t, "content") : null;
  };
  const linkBy = (rel) => {
    const t = links.find((l) => (attr(l, "rel") ?? "").toLowerCase() === rel.toLowerCase());
    return t ? attr(t, "href") : null;
  };

  // 見出しの階層（SSR された HTML から抽出）
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
    level: Number(m[1]),
    text: m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 60),
  }));
  const jumps = [];
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level - headings[i - 1].level > 1) {
      jumps.push({ from: `h${headings[i - 1].level} "${headings[i - 1].text}"`, to: `h${headings[i].level} "${headings[i].text}"` });
    }
  }

  const jsonLd = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
    try { return JSON.parse(m[1]); } catch { return { __parseError: m[1].slice(0, 200) }; }
  });

  const ogImage = ogBy("og:image");
  let ogImageInfo = null;
  if (ogImage) {
    const abs = /^https?:\/\//i.test(ogImage);
    const imgRes = await get(abs ? ogImage : BASE + (ogImage.startsWith("/") ? ogImage : "/" + ogImage));
    ogImageInfo = { value: ogImage, absolute: abs, status: imgRes.status, size: imageSize(imgRes.buf) };
  }

  pages.push({
    path: p,
    status: res.status,
    title: titleMatch ? titleMatch[1].trim() : null,
    description: metaBy("description"),
    robots: metaBy("robots"),
    canonical: linkBy("canonical"),
    h1Count: headings.filter((h) => h.level === 1).length,
    headings,
    headingJumps: jumps,
    og: {
      title: ogBy("og:title"),
      description: ogBy("og:description"),
      url: ogBy("og:url"),
      type: ogBy("og:type"),
      siteName: ogBy("og:site_name"),
      image: ogImageInfo,
      imageWidth: ogBy("og:image:width"),
      imageHeight: ogBy("og:image:height"),
      twitterCard: metaBy("twitter:card"),
    },
    jsonLd,
  });
}

const robotsTxt = await get(BASE + "/robots.txt");
const sitemapXml = await get(BASE + "/sitemap.xml");

const sitemapUrls = sitemapXml.status === 200
  ? [...sitemapXml.text.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((m) => m[1].trim())
  : [];

const noindexPaths = pages.filter((p) => (p.robots ?? "").includes("noindex")).map((p) => p.path);

const report = {
  checkedAt: new Date().toISOString(),
  base: BASE,
  pages,
  duplicates: {
    title: Object.entries(pages.reduce((a, p) => ((a[p.title ?? "(なし)"] = (a[p.title ?? "(なし)"] ?? 0) + 1), a), {})).filter(([, n]) => n > 1),
    description: Object.entries(pages.reduce((a, p) => ((a[p.description ?? "(なし)"] = (a[p.description ?? "(なし)"] ?? 0) + 1), a), {})).filter(([, n]) => n > 1),
  },
  robotsTxt: { status: robotsTxt.status, body: robotsTxt.status === 200 ? robotsTxt.text.slice(0, 2000) : null },
  sitemapXml: { status: sitemapXml.status, urls: sitemapUrls },
  noindexPaths,
  noindexInSitemap: sitemapUrls.filter((u) => noindexPaths.some((p) => u.endsWith(p))),
};

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`[seo] base: ${BASE}   対象ページ数: ${pages.length}`);
  for (const p of pages) {
    console.log(`\n--- ${p.path} (HTTP ${p.status}) ---`);
    console.log(`  title       : ${p.title ?? "(なし)"}`);
    console.log(`  description : ${p.description ?? "(なし)"}`);
    console.log(`  canonical   : ${p.canonical ?? "(なし)"}`);
    console.log(`  robots      : ${p.robots ?? "(なし)"}`);
    console.log(`  h1 の数     : ${p.h1Count}`);
    console.log(`  見出しの飛び: ${p.headingJumps.length === 0 ? "なし" : ""}`);
    for (const j of p.headingJumps) console.log(`      ! ${j.from}  →  ${j.to}`);
    console.log(`  og:image    : ${p.og.image ? `${p.og.image.value} (絶対URL=${p.og.image.absolute}, HTTP ${p.og.image.status}, ${p.og.image.size ? `${p.og.image.size.width}x${p.og.image.size.height}` : "寸法不明"})` : "(なし)"}`);
    console.log(`  og:title/type/url : ${p.og.title ?? "-"} / ${p.og.type ?? "-"} / ${p.og.url ?? "-"}`);
    console.log(`  twitter:card: ${p.og.twitterCard ?? "(なし)"}`);
    console.log(`  JSON-LD     : ${p.jsonLd.length} 件`);
    for (const j of p.jsonLd) console.log(`      @type=${j["@type"] ?? "?"}  sameAs=${JSON.stringify(j.sameAs ?? null)}`);
  }
  console.log(`\n[seo] title 重複    : ${report.duplicates.title.length === 0 ? "なし" : JSON.stringify(report.duplicates.title)}`);
  console.log(`[seo] description重複: ${report.duplicates.description.length === 0 ? "なし" : JSON.stringify(report.duplicates.description)}`);
  console.log(`[seo] robots.txt    : HTTP ${report.robotsTxt.status}`);
  console.log(`[seo] sitemap.xml   : HTTP ${report.sitemapXml.status}  URL数 ${sitemapUrls.length}`);
  console.log(`[seo] noindex ページ: ${noindexPaths.length === 0 ? "なし" : noindexPaths.join(", ")}`);
  console.log(`[seo] noindex かつ sitemap 掲載: ${report.noindexInSitemap.length} 件`);
}
