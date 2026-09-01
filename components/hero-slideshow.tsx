/**
 * トップページのヒーロー画像を 3 秒ごとに切り替える表示。
 *
 * 実装方針:
 *   - JavaScript を使わず CSS アニメーションだけで切り替える
 *     （ハイドレーション不要・スクリプトの読み込みを待たずに動く）
 *   - 1 周 9 秒。各画像を 2.4 秒表示し、0.6 秒かけて次へ重ねて切り替える
 *   - 画面幅で横長（PC 用 2400x1000）と縦長（スマホ用 1122x1402）を出し分ける。
 *     出し分けには <picture> を使う。next/image はこの用途（同じ場所に別の画像を出す）に
 *     対応していないため、ここでは素の <img> を使い、
 *     1 枚目に fetchpriority="high" と loading="eager" を付けて LCP を確保する
 *   - 1 枚目のみ内容を説明する alt を持たせ、2・3 枚目は aria-hidden の装飾扱いにする
 *     （読み上げで写真の説明が 3 つ続くのを避けるため）
 *   - 動きを減らす設定のブラウザでは 1 枚目を静止表示する（globals.css で対応）
 */
const SLIDES = [
  {
    pc: "/hero-01-ldk.webp",
    sp: "/hero-01-ldk-sp.webp",
    alt: "梁をあらわしにした明るいリビングダイニング",
  },
  {
    pc: "/hero-02-exterior.webp",
    sp: "/hero-02-exterior-sp.webp",
    alt: "",
  },
  {
    pc: "/hero-03-water.webp",
    sp: "/hero-03-water-sp.webp",
    alt: "",
  },
] as const;

/** スマホ用の画像に切り替える幅。globals.css の --bp-mobile と同じ値。 */
const MOBILE_QUERY = "(max-width: 760px)";

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
          key={slide.pc}
          style={{ animationDelay: `${delayFor(i)}s`, animationDuration: `${CYCLE}s` }}
          aria-hidden={i === 0 ? undefined : true}
        >
          <picture>
            <source media={MOBILE_QUERY} srcSet={slide.sp} type="image/webp" />
            <img
              className="hero-image"
              src={slide.pc}
              alt={slide.alt}
              width={2400}
              height={1000}
              fetchPriority={i === 0 ? "high" : undefined}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </picture>
        </div>
      ))}
    </div>
  );
}
