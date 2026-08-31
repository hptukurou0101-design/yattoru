/// <reference types="@cloudflare/workers-types" />

// Cloudflare Worker のバインディング型定義。
// .openai/hosting.json で d1 / r2 が null の場合はバインディングが注入されないため、
// すべて optional として宣言し、利用側（db/index.ts）で存在チェックを行う。
declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
