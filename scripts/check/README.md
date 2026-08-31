# 検査スクリプト（scripts/check/）

チェックリストの各項目を「目視ではなく証拠で」判定するための道具。
各スクリプトは **検出0件で exit 0 / 1件以上で exit 1** を返すため、そのまま合否判定に使える。

| スクリプト | 対応するチェック項目 | 役割 |
|---|---|---|
| `env-report.mjs` | フェーズ0 No.3 | Node/npm/git バージョン、git HEAD、主要依存、dist 生成時刻を収集。検査結果の再現条件を記録する |
| `freshness.mjs` | フェーズ0 No.3 / No.6 | ソース最終更新 と dist 生成時刻を比較。`--url` 指定時は配信中 HTML に最新ソース由来のマーカー文字列と実在アセットが含まれるかを検証 |
| `secrets.mjs` | フェーズ0 No.7 | 追跡済み＋未追跡（.gitignore 除外を除く）ファイルを走査し、APIキー・秘密鍵・トークン・パスワードの混入を検出 |
| `preview-server.mjs` | フェーズ0 No.6 | 本番成果物（`dist/client`）を実配信しつつ、それ以外を `vinext start` にプロキシする検証用サーバ |
| `render.mjs` | フェーズ1以降の共通基盤 | Playwright で複数画面幅を実描画し、横スクロール・はみ出し要素・見出し階層・コンソールエラーを実測 |

## 本番出力の確認手順（開発サーバーで判断しないための手順）

`vinext start` はローカルでは `dist/client/assets/` 配下を 404 にしてしまい、
本番成果物のままでは検証できない（Cloudflare Workers の Static Assets 経由なら配信されるため本番影響は無い）。
そのため以下の 2 段構えで確認する。

```bash
# 1) 本番ビルド
npm run build

# 2) 本番サーバ（SSR）を起動
WRANGLER_LOG_PATH=.wrangler/wrangler.log node_modules/.bin/vinext start   # :3000

# 3) 本番成果物を忠実配信するプレビューサーバを起動
node scripts/check/preview-server.mjs                                      # :4173

# 4) 検査
node scripts/check/freshness.mjs --url http://127.0.0.1:4173/
node scripts/check/render.mjs     --url http://127.0.0.1:4173/
```

> Windows では `npm run start` は POSIX 形式の環境変数指定のため失敗する。
> 上記のとおり bash から直接 `vinext start` を起動すること。

## そのほかの使い方

```bash
# 環境レポート
node scripts/check/env-report.mjs
node scripts/check/env-report.mjs --json

# ビルド鮮度（dist がソースより新しいか）
node scripts/check/freshness.mjs

# 秘密情報スキャン
node scripts/check/secrets.mjs

# 画面幅を指定して実描画＋スクリーンショット保存
node scripts/check/render.mjs --url http://127.0.0.1:4173/ --widths 360,390,414,768,1024,1280 --shot
```

## 判定に使う既存コマンド

| 項目 | コマンド | 合格条件 |
|---|---|---|
| 本番ビルド | `npm run build` | exit 0、エラー・警告なし |
| 型チェック | `npx tsc --noEmit` | exit 0、出力なし |
| Lint | `npm run lint` | exit 0、出力なし |

## 検査手段が無い項目の扱い

上記の道具で検証できない項目は、**推測で OK を付けず「未確認」**として報告する。
目視での代替は行わない。
