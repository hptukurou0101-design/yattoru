#!/usr/bin/env node
/**
 * UI 要素の実測監査（フェーズ2 No.53〜56 / 60 / 63〜66 / 74〜82 / 95〜97 / 103）
 *
 * ヘッドレスブラウザで描画し、計算済みスタイルから以下を列挙する。
 *   No.53 要素間の余白（gap / margin）の値と件数
 *   No.54 全ボタンの高さ・角丸・文字サイズ・内側余白
 *   No.55 全カードの余白・角丸・枠線・影
 *   No.56 全入力欄の高さ・枠線・角丸
 *   No.60 カードグリッドの出現セクション数
 *   No.63 汎用語の出現箇所
 *   No.64-66 ファーストビュー内のテキスト全文
 *   No.74/75 FV と末尾の CTA
 *   No.76 モバイル追従 CTA の実装と表示条件
 *   No.77 電話番号の tel: リンク化
 *   No.78 全 CTA 文言
 *   No.80/81 CTA 前の「流れ」「FAQ」セクション
 *   No.82 SNS リンク
 *   No.95-97 全リンクの href / target / rel
 *   No.103 動きのある要素の一覧
 *
 * 使い方:
 *   node scripts/check/ui-audit.mjs --url http://127.0.0.1:4173/
 *   node scripts/check/ui-audit.mjs --url http://127.0.0.1:4173/ --json
 */
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : d;
};
const URL_ARG = opt("url", "http://127.0.0.1:4173/");
const WIDTH = Number(opt("width", "1280"));
const MOBILE_WIDTH = Number(opt("mobile-width", "390"));
const AS_JSON = argv.includes("--json");

/** 業種を問わず使える抽象語。出現箇所を並べるだけで、良し悪しは判断しない。 */
const GENERIC_WORDS = [
  "最適化", "ソリューション", "DX推進", "DX", "伴走", "ワンストップ", "トータルサポート",
  "お客様第一", "安心・安全", "地域密着", "高品質", "プロフェッショナル", "ニーズにお応え",
  "きめ細やか", "豊富な実績", "確かな技術", "笑顔", "未来", "価値創造", "シナジー",
];

const browser = await chromium.launch();

async function measure(width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(URL_ARG, { waitUntil: "networkidle" });
  const data = await page.evaluate((genericWords) => {
    const label = (el) =>
      el.tagName.toLowerCase() +
      (el.id ? `#${el.id}` : "") +
      (typeof el.className === "string" && el.className.trim()
        ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
        : "");
    const px = (v) => Math.round(parseFloat(v) || 0);
    const tally = (arr) => {
      const m = new Map();
      for (const v of arr) m.set(v, (m.get(v) ?? 0) + 1);
      return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
    };

    // ---- ボタン（リンク型 CTA を含む）----
    const buttonSelectors = [
      ".hero-button", ".white-button", ".line-button", ".wide-button",
      ".header-contact", ".primary-action", ".secondary-action", ".fixed-main", ".fixed-sub",
    ];
    const buttons = [];
    for (const sel of buttonSelectors) {
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        buttons.push({
          selector: sel,
          height: Math.round(r.height),
          radius: cs.borderRadius,
          fontSize: cs.fontSize,
          padding: `${px(cs.paddingTop)} ${px(cs.paddingRight)} ${px(cs.paddingBottom)} ${px(cs.paddingLeft)}`,
          border: cs.borderTopWidth === "0px" ? "なし" : `${cs.borderTopWidth} ${cs.borderTopColor}`,
          text: (el.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
        });
      }
    }

    // ---- カード ----
    const cardSelectors = [".service-card", ".work-card", ".voice-grid article", ".company-card", ".faq-card"];
    const cards = [];
    for (const sel of cardSelectors) {
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        cards.push({
          selector: sel,
          padding: `${px(cs.paddingTop)} ${px(cs.paddingRight)} ${px(cs.paddingBottom)} ${px(cs.paddingLeft)}`,
          radius: cs.borderRadius,
          border: cs.borderTopWidth === "0px" ? "なし" : `${cs.borderTopWidth} solid`,
          shadow: cs.boxShadow === "none" ? "なし" : cs.boxShadow,
          background: cs.backgroundColor,
        });
      }
    }

    // ---- 入力欄 ----
    const inputs = [...document.querySelectorAll("input, textarea, select")].map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { tag: el.tagName.toLowerCase(), type: el.getAttribute("type"), height: Math.round(r.height), radius: cs.borderRadius, border: cs.borderTopWidth };
    });

    // ---- 要素間の余白（gap / margin-bottom）----
    const gaps = [];
    const margins = [];
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (cs.display.includes("grid") || cs.display.includes("flex")) {
        if (cs.gap && cs.gap !== "normal" && cs.rowGap !== "0px") gaps.push(cs.gap);
      }
      const mb = px(cs.marginBottom);
      if (mb > 0) margins.push(mb + "px");
    }

    // ---- カードグリッドの出現セクション ----
    const cardGrids = [...document.querySelectorAll(".service-grid, .works-grid, .voice-grid")].map((el) => {
      const sec = el.closest("section");
      return { grid: label(el), section: sec ? label(sec) : "(なし)", children: el.children.length };
    });

    // ---- ファーストビューのテキスト ----
    const vh = window.innerHeight;
    const fvTexts = [];
    for (const el of document.querySelectorAll("h1, h2, p, span, a, li")) {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0 && el.innerText && el.children.length === 0) {
        const t = el.innerText.replace(/\s+/g, " ").trim();
        if (t) fvTexts.push({ tag: el.tagName.toLowerCase(), top: Math.round(r.top), text: t });
      }
    }

    // ---- 全リンク ----
    const links = [...document.querySelectorAll("a[href]")].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        href: el.getAttribute("href"),
        text: (el.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 30),
        target: el.getAttribute("target"),
        rel: el.getAttribute("rel"),
        top: Math.round(r.top + window.scrollY),
        external: /^https?:\/\//i.test(el.getAttribute("href") ?? ""),
      };
    });

    // ---- 追従 CTA ----
    const fixedEls = [];
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (cs.position === "fixed" && cs.display !== "none") {
        const r = el.getBoundingClientRect();
        fixedEls.push({ selector: label(el), display: cs.display, top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), visible: r.width > 0 && r.height > 0 });
      }
    }

    // ---- 動きのある要素 ----
    const animated = [];
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if ((cs.transitionDuration && cs.transitionDuration !== "0s") || (cs.animationName && cs.animationName !== "none")) {
        animated.push({ selector: label(el), transition: cs.transitionProperty + " " + cs.transitionDuration, animation: cs.animationName });
      }
    }

    // ---- 汎用語 ----
    const bodyText = document.body.innerText.replace(/\s+/g, " ");
    const generic = genericWords
      .map((w) => ({ word: w, count: (bodyText.match(new RegExp(w, "g")) ?? []).length }))
      .filter((x) => x.count > 0);

    // ---- 電話番号 ----
    const phonePattern = /0\d{1,4}-\d{1,4}-\d{3,4}/g;
    const phoneOccurrences = [];
    // script / style の中身は画面に出ないので除外する（RSC ペイロードの誤検出防止）
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        n.parentElement && /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(n.parentElement.tagName)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
    });
    let node;
    while ((node = walker.nextNode())) {
      const hits = node.textContent.match(phonePattern);
      if (!hits) continue;
      const parentLink = node.parentElement.closest("a[href^='tel:']");
      for (const h of hits) {
        phoneOccurrences.push({ number: h, inTelLink: Boolean(parentLink), container: label(node.parentElement) });
      }
    }

    // ---- セクション構成 ----
    const sections = [...document.querySelectorAll("main > section")].map((el, i) => ({
      order: i + 1,
      selector: label(el),
      heading: (el.querySelector("h1,h2")?.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
    }));

    return {
      buttons, cards, inputs, cardGrids, fvTexts, links, fixedEls, animated, generic, phoneOccurrences, sections,
      gapTally: tally(gaps), marginTally: tally(margins),
      documentHeight: document.documentElement.scrollHeight,
    };
  }, GENERIC_WORDS);
  await page.close();
  return data;
}

const desktop = await measure(WIDTH);
const mobile = await measure(MOBILE_WIDTH);
await browser.close();

const out = { url: URL_ARG, checkedAt: new Date().toISOString(), desktop: { width: WIDTH, ...desktop }, mobile: { width: MOBILE_WIDTH, ...mobile } };

if (AS_JSON) {
  console.log(JSON.stringify(out, null, 2));
} else {
  const tally = (arr, key) => {
    const m = new Map();
    for (const x of arr) m.set(x[key], (m.get(x[key]) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([v, c]) => `${v} (${c}件)`).join(" / ");
  };

  console.log(`[ui] ${URL_ARG}  デスクトップ ${WIDTH}px / モバイル ${MOBILE_WIDTH}px\n`);

  console.log(`=== No.54 ボタン (${desktop.buttons.length} 個) ===`);
  console.log(`  高さ    : ${tally(desktop.buttons, "height")}`);
  console.log(`  角丸    : ${tally(desktop.buttons, "radius")}`);
  console.log(`  文字   : ${tally(desktop.buttons, "fontSize")}`);
  console.log(`  内側余白: ${tally(desktop.buttons, "padding")}`);
  console.log(`  枠線    : ${tally(desktop.buttons, "border")}`);
  for (const b of desktop.buttons) console.log(`    ${b.selector.padEnd(20)} h=${String(b.height).padStart(3)} r=${b.radius} fs=${b.fontSize} p=[${b.padding}]  "${b.text}"`);

  console.log(`\n=== No.55 カード (${desktop.cards.length} 個) ===`);
  console.log(`  内側余白: ${tally(desktop.cards, "padding")}`);
  console.log(`  角丸    : ${tally(desktop.cards, "radius")}`);
  console.log(`  枠線    : ${tally(desktop.cards, "border")}`);
  console.log(`  影      : ${tally(desktop.cards, "shadow")}`);

  console.log(`\n=== No.56 入力欄 (${desktop.inputs.length} 個) ===`);
  console.log(desktop.inputs.length === 0 ? "  該当なし（フォーム未実装）" : JSON.stringify(desktop.inputs, null, 2));

  console.log(`\n=== No.53 要素間の余白 ===`);
  console.log(`  gap        : ${desktop.gapTally.map((g) => `${g.value} (${g.count})`).join(" / ")}`);
  console.log(`  margin-bottom の種類: ${desktop.marginTally.length} 種  ${desktop.marginTally.slice(0, 14).map((g) => `${g.value}(${g.count})`).join(" ")}`);

  console.log(`\n=== No.60 カードグリッドの出現 (${desktop.cardGrids.length} 箇所) ===`);
  for (const g of desktop.cardGrids) console.log(`  ${g.section}  →  ${g.grid}  子要素 ${g.children}`);

  console.log(`\n=== No.61 セクション構成 ===`);
  for (const s of desktop.sections) console.log(`  ${String(s.order).padStart(2)}. ${s.selector.padEnd(44)} ${s.heading}`);

  console.log(`\n=== No.63 汎用語の出現 ===`);
  console.log(desktop.generic.length === 0 ? "  0 件" : desktop.generic.map((g) => `  ${g.word}: ${g.count} 回`).join("\n"));

  console.log(`\n=== No.64-66 ファーストビューのテキスト（1280px, 上から） ===`);
  for (const t of desktop.fvTexts) console.log(`  [${String(t.top).padStart(4)}px] <${t.tag}> ${t.text}`);

  console.log(`\n=== No.74/75 CTA の位置 ===`);
  const ctas = desktop.links.filter((l) => /相談|問い合わせ|見る|電話|メール/.test(l.text));
  for (const c of ctas) console.log(`  [${String(c.top).padStart(5)}px / 全長 ${desktop.documentHeight}px] "${c.text}" -> ${c.href}`);

  console.log(`\n=== No.76 追従要素（fixed）===`);
  console.log("  デスクトップ:", desktop.fixedEls.map((f) => `${f.selector}(${f.display})`).join(", ") || "なし");
  console.log("  モバイル    :", mobile.fixedEls.map((f) => `${f.selector}(${f.display})`).join(", ") || "なし");

  console.log(`\n=== No.77 電話番号の出現と tel: リンク ===`);
  for (const p of desktop.phoneOccurrences) console.log(`  ${p.number}  tel:リンク=${p.inTelLink ? "あり" : "なし"}  ${p.container}`);

  console.log(`\n=== No.95-97 リンク一覧 (${desktop.links.length} 本) ===`);
  const ext = desktop.links.filter((l) => l.external);
  console.log(`  外部リンク: ${ext.length} 本`);
  for (const l of ext) console.log(`    ${l.href}  target=${l.target ?? "なし"} rel=${l.rel ?? "なし"}`);
  const schemes = new Map();
  for (const l of desktop.links) {
    const s = /^(mailto|tel|https?):/.test(l.href) ? l.href.split(":")[0] : l.href.startsWith("#") ? "ページ内アンカー" : "相対パス";
    schemes.set(s, (schemes.get(s) ?? 0) + 1);
  }
  console.log(`  内訳: ${[...schemes.entries()].map(([k, v]) => `${k} ${v}本`).join(" / ")}`);

  console.log(`\n=== No.82 SNS リンク ===`);
  const sns = desktop.links.filter((l) => /line|instagram|facebook|twitter|x\.com/i.test(l.href ?? ""));
  console.log(sns.length === 0 ? "  0 本（SNS への導線なし）" : sns.map((l) => `  ${l.href}`).join("\n"));

  console.log(`\n=== No.103 動きのある要素 (${desktop.animated.length} 個) ===`);
  const animTally = new Map();
  for (const a of desktop.animated) animTally.set(a.transition, (animTally.get(a.transition) ?? 0) + 1);
  for (const [k, v] of animTally) console.log(`  ${k}  (${v} 要素)`);
}
