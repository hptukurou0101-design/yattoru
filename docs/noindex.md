# 検索避け（noindex）の入れ方と外し方

公開前のテストサイトが検索結果に出てしまわないよう、検索避けを入れています。
**本番公開のときは必ず外してください。外し忘れると検索に一切出ません。**

## 入っている場所（2 箇所）

| ファイル | 役割 |
|---|---|
| `app/layout.tsx` の `<meta name="robots" content="noindex, nofollow" />` | 全ページの `<head>` に検索避けを出す |
| `public/robots.txt` | `/robots.txt` を `Disallow: /` で返す |

下層ページ（`app/company/page.tsx` など 17 ページ）はすべてこのルートレイアウトを通るため、
1 箇所の指定が全 18 ページに効きます。個別の対応は不要です。

### なぜ `metadata.robots` を使っていないか

Next.js の標準では `export const metadata = { robots: {...} }` と書くのが正式ですが、
**このプロジェクトのビルダー `vinext 0.0.50` は `robots` を出力しません**（実測で確認）。
`title` / `description` / `icons` は出力されるため、対応範囲の問題です。

同じ理由で `app/robots.ts`（Next.js の robots ファイル規約）も 404 になったため、
`public/robots.txt` に静的ファイルとして置いています。

そのため、レイアウトの JSX に `<meta>` を直接書き、React 19 の hoisting で
`<head>` に持ち上げる方法を採っています。将来 vinext が対応したら標準の書き方へ戻せます。

## 外す手順

1. `app/layout.tsx` から `<meta name="robots" ... />` の行と、その上のコメントを削除する
2. `public/robots.txt` を公開用の内容に書き換える

```
User-agent: *
Allow: /

Sitemap: https://（本番ドメイン）/sitemap.xml
```

3. ビルドし直して、下の「確認方法」で消えたことを確かめる

## 確認方法

ビルドしてサーバーを起動し、実際に返る HTML を見ます。
**`dist/` を直接 grep しても確認できません**（HTML ファイルとして出力されないため）。

```bash
npm run build
WRANGLER_LOG_PATH=.wrangler/wrangler.log npx vinext start
```

サーバーは **3000 番**で起動します。別のターミナルで:

```bash
for p in / /company /contact /faq /features /first-time /news /privacy /reform \
         /reform/exterior /reform/roof /reform/water /terms /voices /works \
         /works/bright-ldk /works/exterior-roof /works/kitchen-flow; do
  printf '%-24s ' "$p"
  curl -s "http://127.0.0.1:3000$p" | grep -o '<meta name="robots"[^>]*>' || echo '(なし)'
done

curl -s http://127.0.0.1:3000/robots.txt
```

- 検索避けが**効いている**とき → 18 行すべてに `content="noindex, nofollow"`、robots.txt は `Disallow: /`
- 検索避けを**外した**とき → 18 行すべて `(なし)`、robots.txt は `Allow: /`

### ポートが埋まっているとき

前回のサーバーが残っていると、**古い内容を返し続けて修正が反映されていないように見えます**。
実際にこの作業中に一度ハマりました。

```bash
netstat -ano | grep ':3000.*LISTENING'   # PID を調べる
taskkill //PID <PID> //F                 # 止める
```

## 注意

- 検索避けは「検索結果に出さない」だけで、**URL を知っている人は誰でも見られます**。
  関係者以外に見せたくない場合は、別途アクセス制限が必要です。
- 一度インデックスされたページを後から `noindex` にしても、検索結果から消えるまで時間がかかります。
  公開前の今のうちに入れておくのが正しい順序です。
- `robots.txt` の `Disallow` と `noindex` メタタグは役割が違います。`Disallow` はクロール自体を止めるため、
  **クロールされないとメタタグの `noindex` も読まれません**。本番で確実に消したいページがある場合は、
  `Disallow` を外して `noindex` だけを残す必要があります。今回は公開前で全面拒否のため両方入れています。
