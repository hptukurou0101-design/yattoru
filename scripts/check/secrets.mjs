#!/usr/bin/env node
/**
 * 秘密情報スキャナ（フェーズ0 No.7 の検査道具）
 *
 * git 追跡下の全ファイルを走査し、APIキー・パスワード・トークン・秘密鍵の
 * 混入を検出する。検出0件で exit 0、1件以上で exit 1。
 *
 * 使い方:
 *   node scripts/check/secrets.mjs
 *   node scripts/check/secrets.mjs --json
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const AS_JSON = process.argv.includes("--json");

/** 検出ルール。name は報告用、re は行単位で当てる正規表現。 */
const RULES = [
  { name: "private-key-block", re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: "aws-access-key-id", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "github-token", re: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { name: "openai-key", re: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: "google-api-key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "slack-token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "stripe-key", re: /\b[sr]k_(?:live|test)_[A-Za-z0-9]{20,}\b/ },
  { name: "jwt", re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: "bearer-literal", re: /Bearer\s+[A-Za-z0-9._~+/-]{24,}={0,2}/ },
  { name: "assigned-api-key", re: /\b(?:api[_-]?key|apikey|access[_-]?token|auth[_-]?token|client[_-]?secret)\b\s*[:=]\s*["'][^"']{12,}["']/i },
  { name: "assigned-password", re: /\b(?:password|passwd|pwd|secret)\b\s*[:=]\s*["'][^"']{6,}["']/i },
  { name: "cloudflare-api-token", re: /\bCLOUDFLARE_API_TOKEN\b\s*[:=]\s*["']?[A-Za-z0-9_-]{20,}/ },
];

/** 誤検出しやすい行を除外する。 */
const ALLOW = [
  /"integrity"\s*:\s*"sha\d+-/, // package-lock.json のハッシュ
  /process\.env\./, // 環境変数参照は秘密そのものではない
  /\bplaceholder\b/i,
  /\bexample\b/i,
  /\bYOUR_[A-Z_]+\b/,
  /type\s+\w*(?:Secret|Password|Token)/i, // 型定義
];

/** バイナリ・巨大ファイルは対象外。 */
const SKIP_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".pdf",
  ".woff", ".woff2", ".ttf", ".otf", ".eot", ".zip", ".mp4", ".webm",
]);
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * 走査対象ファイル一覧。
 * 追跡済み（--cached）に加え、未追跡だが .gitignore で除外されていないファイル（--others
 * --exclude-standard）も対象にする。コミット前の新規ファイルを取りこぼさないため。
 */
function trackedFiles() {
  const out = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  );
  return [...new Set(out.split("\0").filter(Boolean))];
}

const findings = [];
const skipped = [];

for (const rel of trackedFiles()) {
  const ext = path.extname(rel).toLowerCase();
  if (SKIP_EXT.has(ext)) continue;
  const abs = path.join(ROOT, rel);
  let size;
  try {
    size = statSync(abs).size;
  } catch {
    continue;
  }
  if (size > MAX_BYTES) {
    skipped.push({ file: rel, reason: `size ${size} > ${MAX_BYTES}` });
    continue;
  }
  const text = readFileSync(abs, "utf8");
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ALLOW.some((re) => re.test(line))) continue;
    for (const rule of RULES) {
      if (rule.re.test(line)) {
        findings.push({
          rule: rule.name,
          file: rel,
          line: i + 1,
          excerpt: line.trim().slice(0, 160),
        });
      }
    }
  }
}

// .env 系ファイルが追跡されていないかも確認する
const envTracked = trackedFiles().filter((f) => /(^|\/)\.env(\.|$)/.test(f));
for (const f of envTracked) {
  findings.push({ rule: "tracked-env-file", file: f, line: 0, excerpt: ".env 系ファイルが git 追跡下にある" });
}

const result = {
  scannedAt: new Date().toISOString(),
  rules: RULES.length,
  findings,
  skipped,
};

if (AS_JSON) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`[secrets] ルール数: ${RULES.length}`);
  console.log(`[secrets] 走査対象: git 追跡ファイル（バイナリ/${MAX_BYTES}B超を除く）`);
  if (skipped.length) {
    console.log(`[secrets] スキップ: ${skipped.length} 件`);
    for (const s of skipped) console.log(`  - ${s.file} (${s.reason})`);
  }
  if (findings.length === 0) {
    console.log("[secrets] 検出: 0 件");
  } else {
    console.log(`[secrets] 検出: ${findings.length} 件`);
    for (const f of findings) console.log(`  ! ${f.rule}  ${f.file}:${f.line}  ${f.excerpt}`);
  }
}

process.exit(findings.length === 0 ? 0 : 1);
