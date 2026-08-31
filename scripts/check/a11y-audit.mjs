#!/usr/bin/env node
/**
 * アクセシビリティと画像・性能構造の実測（フェーズ3 No.116〜124 / 127）
 *
 *   No.116 本文・ボタンのコントラスト比（WCAG 2.1 の相対輝度で算出。自己申告ではなく実測）
 *   No.117 タップ領域 44×44px 以上（クリック可能領域で判定）
 *   No.118 Tab だけで全導線を辿れるか、フォーカスが見えるか
 *   No.119 意味のある画像の alt / 装飾画像の空 alt
 *   No.120 アイコンだけのリンクの aria-label
 *   No.121 画像の配信形式
 *   No.122 width/height または aspect-ratio の指定
 *   No.123 loading 属性（FV は遅延させない）
 *   No.124 元画像と表示サイズの比（2倍・3倍への耐性）
 *   No.127 読み込み時のレイアウトのガタつき（CLS）
 *
 * 使い方:
 *   node scripts/check/a11y-audit.mjs --url http://127.0.0.1:4173/
 *   node scripts/check/a11y-audit.mjs --url http://127.0.0.1:4173/ --width 390
 *   node scripts/check/a11y-audit.mjs --url http://127.0.0.1:4173/ --json
 */
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : d;
};
const URL_ARG = opt("url", "http://127.0.0.1:4173/");
const WIDTH = Number(opt("width", "1280"));
const AS_JSON = argv.includes("--json");

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: WIDTH, height: 900 } });
const page = await context.newPage();

/* ---- No.127 CLS: 読み込み中のレイアウト移動量を計測する ---- */
await page.addInitScript(() => {
  window.__cls = 0;
  window.__clsSources = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.hadRecentInput) continue;
      window.__cls += entry.value;
      for (const s of entry.sources ?? []) {
        window.__clsSources.push({
          node: s.node ? s.node.nodeName + (s.node.className ? "." + String(s.node.className).split(" ")[0] : "") : "?",
          value: entry.value,
        });
      }
    }
  }).observe({ type: "layout-shift", buffered: true });
});

await page.goto(URL_ARG, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const data = await page.evaluate(() => {
  const label = (el) =>
    el.tagName.toLowerCase() +
    (el.id ? `#${el.id}` : "") +
    (typeof el.className === "string" && el.className.trim()
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "");

  /* ---------- 色の相対輝度とコントラスト比（WCAG 2.1）---------- */
  const parseColor = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const luminance = ({ r, g, b }) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  /** 祖先をたどって不透明な背景色を求める。画像背景の上は判定不能として null を返す。 */
  const effectiveBg = (el) => {
    let acc = null;
    let onImage = false;
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") onImage = true;
      const c = parseColor(cs.backgroundColor);
      if (!c || c.a === 0) continue;
      acc = acc ? over(acc, c) : c;
      if (acc.a >= 1) return { color: acc, onImage };
    }
    return { color: acc ?? { r: 255, g: 255, b: 255, a: 1 }, onImage };
  };
  const ratio = (a, b) => {
    const l1 = luminance(a);
    const l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  /* ---------- No.116 コントラスト ---------- */
  const contrast = [];
  const seen = new Set();
  for (const el of document.querySelectorAll("p, li, dd, dt, h1, h2, h3, a, span, small, time, button, summary")) {
    const text = (el.textContent ?? "").trim();
    if (!text) continue;
    if ([...el.children].some((c) => (c.textContent ?? "").trim() === text)) continue; // 親子で二重計上しない
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    const fg = parseColor(cs.color);
    if (!fg) continue;
    const bgInfo = effectiveBg(el);
    const fgOn = over(fg, bgInfo.color);
    const cr = ratio(fgOn, bgInfo.color);
    const fontSize = parseFloat(cs.fontSize);
    const bold = Number(cs.fontWeight) >= 700;
    // WCAG: 18pt(24px) 以上、または 14pt(18.66px) 以上の太字は「大きな文字」で 3:1
    const isLarge = fontSize >= 24 || (fontSize >= 18.66 && bold);
    const required = isLarge ? 3 : 4.5;
    const key = `${cs.color}|${cs.fontSize}|${cs.fontWeight}|${label(el)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // 支援技術から隠されている装飾テキストかどうかを記録する（判定の材料にする）
    const ariaHidden = Boolean(el.closest('[aria-hidden="true"]'));
    contrast.push({
      selector: label(el),
      ariaHidden,
      sample: text.replace(/\s+/g, " ").slice(0, 24),
      color: cs.color,
      bg: `rgb(${Math.round(bgInfo.color.r)}, ${Math.round(bgInfo.color.g)}, ${Math.round(bgInfo.color.b)})`,
      onImage: bgInfo.onImage,
      fontSize: cs.fontSize,
      bold,
      ratio: Math.round(cr * 100) / 100,
      required,
      pass: cr >= required,
    });
  }

  /* ---------- No.117 タップ領域 ---------- */
  const tap = [];
  for (const el of document.querySelectorAll("a[href], button, summary, input, select, textarea, [role='button']")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    // 閉じた <details> の中身は画面に出ておらず押せないので対象外
    // （閉じていても getBoundingClientRect は 0 以外を返すことがある）
    if (el.closest("details:not([open])")) continue;

    // チェックボックス／ラジオが <label> に包まれている場合、実際に押せる範囲は
    // ラベル全体になる。要素そのものではなくラベルの寸法で判定する。
    let hitRect = r;
    if (/^(checkbox|radio)$/.test(el.getAttribute("type") ?? "")) {
      const wrapper = el.closest("label");
      if (wrapper) hitRect = wrapper.getBoundingClientRect();
    }

    tap.push({
      selector: label(el),
      text: (el.innerText ?? el.getAttribute("aria-label") ?? "").replace(/\s+/g, " ").trim().slice(0, 22),
      width: Math.round(hitRect.width),
      height: Math.round(hitRect.height),
      pass: hitRect.width >= 44 && hitRect.height >= 44,
    });
  }

  /* ---------- No.119 / 120 画像の alt とアイコンリンク ---------- */
  const images = [...document.querySelectorAll("img")].map((im) => {
    const r = im.getBoundingClientRect();
    return {
      src: (im.currentSrc || im.src).split("?")[0].split("/").pop().slice(0, 40),
      alt: im.getAttribute("alt"),
      hasAltAttr: im.hasAttribute("alt"),
      decorative: im.getAttribute("alt") === "" || im.getAttribute("aria-hidden") === "true",
      loading: im.getAttribute("loading") ?? "(なし)",
      fetchpriority: im.getAttribute("fetchpriority") ?? "(なし)",
      width: im.getAttribute("width"),
      height: im.getAttribute("height"),
      aspectRatio: getComputedStyle(im).aspectRatio,
      hasSize: Boolean(im.getAttribute("width") && im.getAttribute("height")) || getComputedStyle(im).aspectRatio !== "auto",
      naturalWidth: im.naturalWidth,
      naturalHeight: im.naturalHeight,
      displayWidth: Math.round(r.width),
      displayHeight: Math.round(r.height),
      scale: r.width ? Math.round((im.naturalWidth / r.width) * 100) / 100 : null,
      inFirstView: r.top < window.innerHeight && r.bottom > 0,
      format: (im.currentSrc || im.src).match(/\.(avif|webp|png|jpe?g|svg|gif)/i)?.[1]?.toLowerCase() ?? "(URL から判定不可)",
    };
  });

  const iconOnlyLinks = [];
  for (const el of document.querySelectorAll("a[href], button")) {
    const text = (el.innerText ?? "").replace(/\s+/g, "").trim();
    const hasSvg = el.querySelector("svg, img");
    if (text.length === 0 && hasSvg) {
      iconOnlyLinks.push({
        selector: label(el),
        href: el.getAttribute("href"),
        ariaLabel: el.getAttribute("aria-label"),
        title: el.getAttribute("title"),
        pass: Boolean(el.getAttribute("aria-label") || el.getAttribute("title")),
      });
    }
  }

  return {
    contrast,
    tap,
    images,
    iconOnlyLinks,
    cls: window.__cls ?? null,
    clsSources: window.__clsSources ?? [],
  };
});

/* ----------------------------------------------------------------------------
   画像の上に置かれた文字のコントラスト実測

   CSS の background-color をたどる方法では、写真やグラデーションの上に置かれた
   文字の背景を求められない（祖先の背景色は透明で、実際の色は画像とオーバーレイの
   合成結果になる）。
   そこで対象要素の文字色を一時的に透明にしてスクリーンショットを撮り、
   実際に描画された背景ピクセルの平均色を求めて比を計算する。
---------------------------------------------------------------------------- */
// 背景に <img> が敷かれている場合は CSS 上の背景色が透明なままなので、
// 基準未満と出たものはすべてピクセルから測り直す（誤検出を残さないため）。
const onImageTargets = data.contrast.filter((c) => c.onImage || c.ratio === 1 || !c.pass);
if (onImageTargets.length > 0) {
  const sharp = (await import("sharp")).default;
  for (const target of onImageTargets) {
    const box = await page.evaluate((sel) => {
      const nodes = [...document.querySelectorAll("p, h1, h2, h3, a, span, small, time")];
      const el = nodes.find((n) => {
        const label =
          n.tagName.toLowerCase() +
          (n.id ? `#${n.id}` : "") +
          (typeof n.className === "string" && n.className.trim()
            ? "." + n.className.trim().split(/\s+/).slice(0, 2).join(".")
            : "");
        return label === sel.selector && (n.textContent ?? "").trim().startsWith(sel.sample.slice(0, 8));
      });
      if (!el) return null;
      el.scrollIntoView({ block: "center", behavior: "instant" });
      const r = el.getBoundingClientRect();
      el.dataset.contrastProbe = "1";
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    }, target);
    if (!box || box.w < 2 || box.h < 2) continue;

    // 文字を透明にして背景だけを撮る
    await page.addStyleTag({ content: `[data-contrast-probe="1"] { color: transparent !important; }` });
    await page.waitForTimeout(120);
    const shot = await page.screenshot({ clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: box.w, height: box.h } });
    const stats = await sharp(shot).stats();
    const bg = { r: stats.channels[0].mean, g: stats.channels[1].mean, b: stats.channels[2].mean, a: 1 };

    const lum = (c) => {
      const f = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const fgMatch = target.color.match(/rgba?\(([^)]+)\)/);
    const p = fgMatch[1].split(",").map(parseFloat);
    const fg = { r: p[0], g: p[1], b: p[2] };
    const l1 = lum(fg);
    const l2 = lum(bg);
    const cr = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    target.bg = `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`;
    target.ratio = Math.round(cr * 100) / 100;
    target.pass = cr >= target.required;
    target.measuredFromPixels = true;

    await page.evaluate(() => {
      document.querySelectorAll("[data-contrast-probe]").forEach((n) => delete n.dataset.contrastProbe);
    });
  }
}

/* ---------- No.118 Tab 順とフォーカスの可視性 ---------- */
// コントラスト測定でスクロールとスタイル注入をしているため、素の状態に戻してから測る
await page.goto(URL_ARG, { waitUntil: "networkidle" });
await page.evaluate(() => window.scrollTo(0, 0));
const tabOrder = [];
for (let i = 0; i < 60; i++) {
  await page.keyboard.press("Tab");
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!el.dataset.a11yUid) {
      window.__uid = (window.__uid ?? 0) + 1;
      el.dataset.a11yUid = String(window.__uid);
    }
    return {
      uid: el.dataset.a11yUid,
      tag: el.tagName.toLowerCase(),
      text: (el.innerText ?? el.getAttribute("aria-label") ?? "").replace(/\s+/g, " ").trim().slice(0, 26),
      href: el.getAttribute("href"),
      outlineWidth: cs.outlineWidth,
      outlineStyle: cs.outlineStyle,
      outlineColor: cs.outlineColor,
      boxShadow: cs.boxShadow === "none" ? null : cs.boxShadow.slice(0, 40),
      visible: r.width > 0 && r.height > 0,
    };
  });
  if (!info) break;
  // 同じ要素に戻ってきたら 1 周したとみなす。
  // テキストの無いリンクが連続すると内容が同一になるため、要素そのものの識別子で比較する。
  if (tabOrder.some((t) => t.uid === info.uid)) break;
  tabOrder.push(info);
}

await browser.close();

const focusVisible = tabOrder.filter(
  (t) => (t.outlineStyle !== "none" && parseFloat(t.outlineWidth) > 0) || t.boxShadow
);

const out = {
  url: URL_ARG,
  width: WIDTH,
  checkedAt: new Date().toISOString(),
  ...data,
  tabOrder,
  summary: {
    contrastFail: data.contrast.filter((c) => !c.pass).length,
    contrastTotal: data.contrast.length,
    tapFail: data.tap.filter((t) => !t.pass).length,
    tapTotal: data.tap.length,
    imagesWithoutAlt: data.images.filter((i) => !i.hasAltAttr).length,
    imagesWithoutSize: data.images.filter((i) => !i.hasSize).length,
    iconLinksWithoutLabel: data.iconOnlyLinks.filter((i) => !i.pass).length,
    tabStops: tabOrder.length,
    tabStopsWithVisibleFocus: focusVisible.length,
    cls: data.cls,
  },
};

if (AS_JSON) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(`[a11y] ${URL_ARG}  幅 ${WIDTH}px\n`);

  console.log(`=== No.116 コントラスト比（実測 ${out.summary.contrastTotal} 箇所 / 基準未満 ${out.summary.contrastFail} 箇所）===`);
  console.log("  比率   基準  判定  文字色 / 背景色                             サイズ  抜粋");
  for (const c of data.contrast.sort((a, b) => a.ratio - b.ratio)) {
    console.log(
      `  ${String(c.ratio).padStart(6)}  ${String(c.required).padStart(3)}  ${c.pass ? "OK" : "NG"}   ` +
        `${c.color.padEnd(22)} / ${c.bg.padEnd(20)} ${c.fontSize.padStart(5)}  ${c.sample}` +
          `${c.measuredFromPixels ? "  ※描画ピクセルから実測" : ""}${c.ariaHidden ? "  ※aria-hidden の装飾" : ""}`
    );
  }

  console.log(`\n=== No.117 タップ領域 44×44px（${out.summary.tapTotal} 箇所 / 未満 ${out.summary.tapFail} 箇所）===`);
  for (const t of data.tap.filter((x) => !x.pass)) console.log(`  NG  ${String(t.width).padStart(4)}×${String(t.height).padStart(3)}  ${t.selector.padEnd(26)} ${t.text}`);
  if (out.summary.tapFail === 0) console.log("  すべて 44×44px 以上");

  console.log(`\n=== No.118 Tab 順（${tabOrder.length} ストップ / フォーカス可視 ${focusVisible.length}）===`);
  tabOrder.forEach((t, i) => {
    const focus = (t.outlineStyle !== "none" && parseFloat(t.outlineWidth) > 0) ? `outline ${t.outlineWidth} ${t.outlineColor}` : t.boxShadow ? "box-shadow" : "なし";
    console.log(`  ${String(i + 1).padStart(2)}. <${t.tag}> ${(t.text || t.href || "").padEnd(28)} フォーカス表示: ${focus}`);
  });

  console.log(`\n=== No.119 画像の alt（${data.images.length} 枚 / alt 属性なし ${out.summary.imagesWithoutAlt} 枚）===`);
  for (const im of data.images) console.log(`  ${im.src.padEnd(14)} alt="${im.alt ?? "(属性なし)"}"`);

  console.log(`\n=== No.120 アイコンだけのリンク・ボタン（${data.iconOnlyLinks.length} 箇所 / aria-label なし ${out.summary.iconLinksWithoutLabel} 箇所）===`);
  if (data.iconOnlyLinks.length === 0) console.log("  該当なし");
  for (const l of data.iconOnlyLinks) console.log(`  ${l.pass ? "OK" : "NG"}  ${l.selector.padEnd(24)} aria-label="${l.ariaLabel ?? "(なし)"}"  href=${l.href}`);

  console.log(`\n=== No.121 配信形式 ===`);
  const fmt = new Map();
  for (const im of data.images) fmt.set(im.format, (fmt.get(im.format) ?? 0) + 1);
  for (const [k, v] of fmt) console.log(`  ${k}: ${v} 枚`);

  console.log(`\n=== No.122 width/height または aspect-ratio（欠落 ${out.summary.imagesWithoutSize} 枚）===`);
  for (const im of data.images) console.log(`  ${im.hasSize ? "OK" : "NG"}  ${im.src.padEnd(14)} width=${im.width ?? "-"} height=${im.height ?? "-"} aspect-ratio=${im.aspectRatio}`);

  console.log(`\n=== No.123 loading 属性 ===`);
  for (const im of data.images) console.log(`  ${im.src.padEnd(14)} loading=${String(im.loading).padEnd(8)} fetchpriority=${String(im.fetchpriority).padEnd(6)} FV内=${im.inFirstView}`);

  console.log(`\n=== No.124 解像度（元画像幅 ÷ 表示幅）===`);
  for (const im of data.images) {
    const v = im.scale ?? 0;
    console.log(`  ${v >= 2 ? "OK" : "NG"}  ${String(v).padStart(5)}倍  ${im.src.padEnd(14)} 元 ${im.naturalWidth}px / 表示 ${im.displayWidth}px`);
  }

  console.log(`\n=== No.127 CLS（読み込み時のレイアウト移動）===`);
  console.log(`  CLS = ${data.cls}  （Google の good 基準は 0.1 以下）`);
  if (data.clsSources.length === 0) console.log("  移動した要素: なし");
  for (const s of data.clsSources) console.log(`  ! ${s.node}  移動量 ${s.value}`);
}

process.exitCode =
  out.summary.contrastFail + out.summary.tapFail + out.summary.imagesWithoutAlt + out.summary.iconLinksWithoutLabel === 0
    ? 0
    : 1;
