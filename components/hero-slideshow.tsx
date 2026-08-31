import Image from "next/image";

/**
 * トップページのヒーロー画像を 3 秒ごとに切り替える表示。
 *
 * 実装方針:
 *   - JavaScript を使わず CSS アニメーションだけで切り替える
 *     （ハイドレーション不要・スクリプトの読み込みを待たずに動く）
 *   - 1 周 9 秒。各画像を 2.4 秒表示し、0.6 秒かけて次へ重ねて切り替える
 *   - 1 枚目だけ priority を付けて LCP を確保し、2・3 枚目は通常読み込み
 *   - 1 枚目のみ内容を説明する alt を持たせ、2・3 枚目は aria-hidden の装飾扱いにする
 *     （読み上げで写真の説明が 3 つ続くのを避けるため）
 *   - 動きを減らす設定のブラウザでは 1 枚目を静止表示する（globals.css で対応）
 */
const SLIDES = [
  {
    src: "/hero-01-ldk.webp",
    alt: "梁をあらわしにした明るいリビングダイニング",
  },
  {
    src: "/hero-02-exterior.webp",
    alt: "",
  },
  {
    src: "/hero-03-water.webp",
    alt: "",
  },
] as const;

/** 1 枚あたりの表示秒数。3 枚なので 1 周は SECONDS * 枚数 = 9 秒。 */
const SECONDS = 3;
const CYCLE = SECONDS * SLIDES.length;

/**
 * 各スライドの animation-delay。
 *
 * 正の遅延（0s / 3s / 6s）にすると、待機中のスライドはまだアニメーションが始まっておらず
 * 基準値の opacity: 0 のまま止まる。その結果、前のスライドが消えるあいだ次が現れず、
 * 一瞬だけ地色が見えてしまう（実測で確認）。
 *
 * 負の遅延にして「すでに 1 周の途中から始まっている」状態にすると、
 * どの切り替わりでも前後が重なって入れ替わる。
 */
const delayFor = (i: number) => -(((SLIDES.length - i) % SLIDES.length) * SECONDS);

export function HeroSlideshow() {
  return (
    <div className="hero-slides">
      {SLIDES.map((slide, i) => (
        <div
          className="hero-slide"
          key={slide.src}
          style={{ animationDelay: `${delayFor(i)}s`, animationDuration: `${CYCLE}s` }}
          aria-hidden={i === 0 ? undefined : true}
        >
          <Image
            className="hero-image"
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}
    </div>
  );
}
