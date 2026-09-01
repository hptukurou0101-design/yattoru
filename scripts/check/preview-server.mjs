#!/usr/bin/env node
/**
 * 本番成果物の忠実プレビューサーバ（フェーズ0 No.6 の検査道具）
 *
 * 背景:
 *   `vinext start` はローカル環境で dist/client 直下のファイルは配信するが、
 *   dist/client/assets/ 配下のサブディレクトリを解決できず 404 を返す。
 *   そのため「本番ビルドの出力で確認する」ことができない。
 *   （Cloudflare Workers の Static Assets 経由なら配信されるため本番影響は無い）
 *
 * 本サーバの動作:
 *   1. リクエストパスが dist/client 配下の実ファイルなら、それを直接返す（＝本番と同じ成果物）
 *   2. それ以外は upstream（vinext start）へプロキシして SSR された HTML を返す
 *
 * つまり「本番ビルド済みアセット + 本番サーバの SSR 出力」の組み合わせを検証できる。
 *
 * 使い方:
 *   1) 別ターミナルで: node_modules/.bin/vinext start        （既定 3000 番）
 *   2) node scripts/check/preview-server.mjs                 （既定 4173 番で待受）
 *   3) node scripts/check/render.mjs --url http://127.0.0.1:4173/
 *
 * オプション:
 *   --port <n>      待受ポート（既定 4173）
 *   --upstream <u>  プロキシ先（既定 http://127.0.0.1:3000）
 *   --root <dir>    静的配信ルート（既定 dist/client）
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};

const PORT = Number(opt("port", "4173"));
const UPSTREAM = opt("upstream", "http://127.0.0.1:3000").replace(/\/$/, "");
const ROOT = path.resolve(process.cwd(), opt("root", path.join("dist", "client")));

const MIME = {
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

/** ディレクトリトラバーサルを防ぎつつ、ROOT 配下の実ファイルパスを解決する。 */
function resolveStatic(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  if (decoded.includes("\0")) return null;
  const abs = path.resolve(ROOT, "." + decoded);
  if (!abs.startsWith(ROOT)) return null;
  if (!existsSync(abs)) return null;
  const st = statSync(abs);
  return st.isFile() ? abs : null;
}

const server = createServer(async (req, res) => {
  const file = resolveStatic(req.url ?? "/");
  if (file) {
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "content-type": MIME[ext] ?? "application/octet-stream",
      "content-length": statSync(file).size,
      // 検証用サーバなのでブラウザにキャッシュさせない。
      // ヘッダを付けていなかったため、ブラウザが独自判断で古い内容を出し続け、
      // 修正したのに反映されていないように見えることがあった。
      "cache-control": "no-store, must-revalidate",
      "x-served-by": "preview-server(static)",
    });
    createReadStream(file).pipe(res);
    return;
  }

  try {
    const upstreamRes = await fetch(UPSTREAM + (req.url ?? "/"), {
      method: req.method,
      headers: { ...req.headers, host: new URL(UPSTREAM).host, connection: "close" },
      redirect: "manual",
    });
    const buf = Buffer.from(await upstreamRes.arrayBuffer());
    const headers = Object.fromEntries(upstreamRes.headers.entries());
    delete headers["content-encoding"];
    delete headers["content-length"];
    delete headers["transfer-encoding"];
    delete headers["etag"];
    delete headers["last-modified"];
    // HTML も同様にキャッシュさせない
    headers["cache-control"] = "no-store, must-revalidate";
    headers["x-served-by"] = "preview-server(proxy)";
    res.writeHead(upstreamRes.status, headers);
    res.end(buf);
  } catch (e) {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(`preview-server: upstream ${UPSTREAM} へ到達できません\n${String(e)}`);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[preview] 静的ルート : ${path.relative(process.cwd(), ROOT)}`);
  console.log(`[preview] プロキシ先 : ${UPSTREAM}`);
  console.log(`[preview] 待受        : http://127.0.0.1:${PORT}/`);
});
