# 変換前の原本

`public/` に置く必要のない、変換前の画像原本を保管する場所。
ここに置いたファイルはビルド成果物に含まれず、配信もされない。

| ファイル | 用途 |
|---|---|
| `hero-living.png` | `public/hero-living.webp` の変換元 |
| `service-exterior.png` | `public/service-exterior.webp` の変換元 |
| `service-kitchen.png` | `public/service-kitchen.webp` の変換元 |

再変換するときは `public/` に戻してから次を実行する。

```bash
node scripts/check/convert-images.mjs
```

**注意**: これらの原本は幅 1672px しかなく、ヒーローと特長パネルでは
表示幅に対して 1.31〜1.46 倍しかない（基準は 2 倍）。
2560px 以上の原本が支給され次第、差し替えること。
