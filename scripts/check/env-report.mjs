#!/usr/bin/env node
/**
 * 実行環境レポート（フェーズ0 No.3 の補助証拠）
 *
 * 検査結果を再現するために必要な環境情報を機械的に収集する。
 * 「どのコードを、どの環境でビルドしたか」を後から照合できるようにする。
 *
 * 使い方:
 *   node scripts/check/env-report.mjs
 *   node scripts/check/env-report.mjs --json
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const AS_JSON = process.argv.includes("--json");

const IS_WIN = process.platform === "win32";

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

/** npm は Windows ではバッチファイルのため cmd 経由で呼ぶ（shell:true は非推奨警告が出る）。 */
function runNpm(args) {
  return IS_WIN ? run("cmd", ["/c", "npm", ...args]) : run("npm", args);
}

const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));

const report = {
  collectedAt: new Date().toISOString(),
  project: { name: pkg.name, version: pkg.version, displayName: pkg.displayName ?? null },
  runtime: {
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    npm: runNpm(["-v"]),
    git: run("git", ["--version"]),
  },
  git: {
    head: run("git", ["rev-parse", "HEAD"]),
    headShort: run("git", ["rev-parse", "--short", "HEAD"]),
    branch: run("git", ["rev-parse", "--abbrev-ref", "HEAD"]),
    dirtyFiles: (run("git", ["status", "--porcelain"]) ?? "").split("\n").filter(Boolean).length,
  },
  keyDeps: Object.fromEntries(
    ["next", "react", "vinext", "vite", "tailwindcss", "wrangler", "typescript"].map((n) => [
      n,
      pkg.dependencies?.[n] ?? pkg.devDependencies?.[n] ?? null,
    ])
  ),
  dist: existsSync(path.join(ROOT, "dist"))
    ? { exists: true, mtime: new Date(statSync(path.join(ROOT, "dist")).mtimeMs).toISOString() }
    : { exists: false },
  nodeModules: existsSync(path.join(ROOT, "node_modules")),
  hostingJson: existsSync(path.join(ROOT, ".openai", "hosting.json"))
    ? JSON.parse(readFileSync(path.join(ROOT, ".openai", "hosting.json"), "utf8"))
    : null,
};

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`[env] 収集時刻   : ${report.collectedAt}`);
  console.log(`[env] プロジェクト: ${report.project.name}@${report.project.version}`);
  console.log(`[env] Node/OS    : ${report.runtime.node} / ${report.runtime.platform}`);
  console.log(`[env] npm / git  : ${report.runtime.npm} / ${report.runtime.git}`);
  console.log(`[env] git HEAD   : ${report.git.headShort} (${report.git.branch})  未コミット変更 ${report.git.dirtyFiles} 件`);
  console.log(`[env] 主要依存   : ${Object.entries(report.keyDeps).map(([k, v]) => `${k}@${v}`).join(", ")}`);
  console.log(`[env] dist       : ${report.dist.exists ? report.dist.mtime : "なし"}`);
  console.log(`[env] hosting    : ${JSON.stringify(report.hostingJson)}`);
}
