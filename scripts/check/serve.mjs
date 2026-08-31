#!/usr/bin/env node
/**
 * 検証用サーバの起動・停止（フェーズ0以降で繰り返し使う道具）
 *
 * 本番ビルドの検証には 2 つのサーバが必要:
 *   :3000  vinext start        … 本番 SSR
 *   :4173  preview-server.mjs  … dist/client を実配信し、他は :3000 へプロキシ
 *
 * 再ビルドのたびに :3000 を再起動しないと古い SSR 出力が返るため、
 * 「停止 → 起動 → 疎通確認」を 1 コマンドにまとめる。
 *
 * 使い方:
 *   node scripts/check/serve.mjs start   # 停止してから起動し、疎通確認まで行う
 *   node scripts/check/serve.mjs stop    # 両方停止
 *   node scripts/check/serve.mjs status  # 稼働確認のみ
 */
import { spawn, execFileSync } from "node:child_process";
import { openSync, mkdirSync } from "node:fs";
import path from "node:path";

const MODE = process.argv[2] ?? "start";
const ROOT = process.cwd();
const LOG_DIR = path.join(ROOT, ".sites-runtime", "logs");
const PORTS = { ssr: 3000, preview: 4173 };

function killPort(port) {
  if (process.platform !== "win32") {
    try {
      const pids = execFileSync("bash", ["-lc", `lsof -ti tcp:${port} || true`], { encoding: "utf8" }).trim();
      for (const pid of pids.split("\n").filter(Boolean)) process.kill(Number(pid), "SIGKILL");
    } catch {
      /* 稼働していなければ何もしない */
    }
    return;
  }
  try {
    execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `$ErrorActionPreference='SilentlyContinue'; Get-NetTCPConnection -LocalPort ${port} -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`,
      ],
      { stdio: "ignore" }
    );
  } catch {
    /* 稼働していなければ何もしない */
  }
}

async function probe(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`, { headers: { connection: "close" } });
    return res.status;
  } catch {
    return null;
  }
}

async function waitReady(port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = await probe(port);
    if (status) return status;
    await new Promise((r) => setTimeout(r, 400));
  }
  return null;
}

if (MODE === "stop" || MODE === "start") {
  for (const port of Object.values(PORTS)) killPort(port);
  if (MODE === "stop") {
    console.log("[serve] :3000 / :4173 を停止しました");
    process.exit(0);
  }
}

if (MODE === "status") {
  let allUp = true;
  for (const [name, port] of Object.entries(PORTS)) {
    const status = await probe(port);
    if (!status) allUp = false;
    console.log(`[serve] ${name.padEnd(7)} :${port} -> ${status ?? "停止中"}`);
  }
  // process.exit() は fetch の keep-alive ソケット破棄と競合するため exitCode で終了する
  process.exitCode = allUp ? 0 : 1;
}

if (MODE === "start") {
mkdirSync(LOG_DIR, { recursive: true });
const out = (name) => openSync(path.join(LOG_DIR, `${name}.log`), "a");

// vinext の CLI 本体を node で直接起動する（.cmd を shell 経由で呼ぶと非推奨警告が出るため）
const vinextBin = path.join(ROOT, "node_modules", "vinext", "dist", "cli.js");
const ssr = spawn(process.execPath, [vinextBin, "start"], {
  cwd: ROOT,
  detached: true,
  stdio: ["ignore", out("ssr"), out("ssr")],
  env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/wrangler.log" },
});
ssr.unref();

const preview = spawn(process.execPath, ["scripts/check/preview-server.mjs"], {
  cwd: ROOT,
  detached: true,
  stdio: ["ignore", out("preview"), out("preview")],
});
preview.unref();

const ssrStatus = await waitReady(PORTS.ssr);
const previewStatus = await waitReady(PORTS.preview);

console.log(`[serve] ssr     :${PORTS.ssr} -> ${ssrStatus ?? "起動失敗"}`);
console.log(`[serve] preview :${PORTS.preview} -> ${previewStatus ?? "起動失敗"}`);
console.log(`[serve] ログ: ${path.relative(ROOT, LOG_DIR)}`);

process.exitCode = ssrStatus && previewStatus ? 0 : 1;
}
