/**
 * 水まわりリフォームの説明に添える間取り図。
 *
 * 写真ではなく線画なので、素材の支給を待たずにこの場で描いている。
 * 特定の物件の図面ではなく、話の流れを説明するための一般的な例。
 *
 * 実装の方針:
 *   - 画像ファイルではなくインライン SVG にしている。
 *     外部 SVG を <img> で読むと書体がページと切り離され、和文が別の字面になる。
 *     インラインならページと同じ書体で描画され、拡大しても線がぼけない
 *   - 色は globals.css のトークンをそのまま参照する。
 *     配色を変えたときに図だけ取り残されないようにするため
 *   - 凡例は SVG の外（HTML）に出している。
 *     SVG 内の文字は図と一緒に縮むため、360px 幅では 9px 相当まで小さくなる。
 *     HTML なら本文と同じ大きさを保てる
 *   - 図形は aria-hidden にし、読み上げは <title> に集約している
 *
 * 座標系: viewBox 60,80 - 1140,850。壁の外側 90..1110 × 110..820 が住戸。
 */

/** 水まわりとして淡い青で塗る部屋 */
const WET_ROOMS = [
  { x: 600, y: 110, w: 250, h: 240, label: "浴室", labelY: 316 },
  { x: 600, y: 350, w: 250, h: 210, label: "洗面室", labelY: 538 },
  { x: 600, y: 560, w: 250, h: 140, label: "トイレ", labelY: 600 },
] as const;

export function WaterFloorPlan() {
  return (
    <figure className="floor-plan-figure">
      <svg
        className="floor-plan"
        viewBox="60 80 1080 770"
        role="img"
        aria-labelledby="floor-plan-title"
      >
        <title id="floor-plan-title">
          キッチンから洗面室へつながる家事動線を示した間取り図。
          浴室・洗面室・トイレを水まわりとして色分けしています。
        </title>

        <g aria-hidden="true">
          {/* ---- 室の塗り分け ---- */}
          {/* LDK は L 字。水まわりの下をまわって玄関ホールに接する */}
          <path d="M90 110 H600 V700 H850 V820 H90 Z" fill="var(--paper)" />
          {WET_ROOMS.map((r) => (
            <rect key={r.label} x={r.x} y={r.y} width={r.w} height={r.h} fill="var(--blue-pale)" />
          ))}
          <rect x="850" y="110" width="260" height="710" fill="var(--paper)" />

          {/* ---- 設備 ---- */}
          {/* キッチン: 上端の壁に沿った I 型。左からコンロ・調理台・シンク */}
          <g fill="none" stroke="var(--ink-10)" strokeWidth="3">
            <rect x="130" y="140" width="370" height="66" fill="var(--off-white)" />
            <rect x="368" y="152" width="118" height="42" rx="4" />
            <circle cx="172" cy="163" r="13" />
            <circle cx="208" cy="163" r="13" />
            <circle cx="190" cy="192" r="13" />
          </g>
          {/* ダイニングテーブルと椅子 */}
          <g fill="none" stroke="var(--ink-10)" strokeWidth="3">
            <rect x="185" y="470" width="240" height="130" rx="10" />
            <rect x="212" y="432" width="52" height="26" rx="6" />
            <rect x="346" y="432" width="52" height="26" rx="6" />
            <rect x="212" y="612" width="52" height="26" rx="6" />
            <rect x="346" y="612" width="52" height="26" rx="6" />
          </g>
          {/* 浴室: 浴槽と洗い場 */}
          <g fill="none" stroke="var(--ink-10)" strokeWidth="3">
            <rect x="616" y="126" width="218" height="96" rx="12" />
            <line x1="616" y1="248" x2="834" y2="248" />
          </g>
          {/* 洗面室: 洗面台と洗濯機 */}
          <g fill="none" stroke="var(--ink-10)" strokeWidth="3">
            <rect x="616" y="366" width="124" height="46" />
            <ellipse cx="678" cy="389" rx="30" ry="15" />
            <rect x="756" y="366" width="78" height="78" />
            <circle cx="795" cy="405" r="24" />
          </g>
          {/* トイレ: 室名を上に置くため、便器は室の下寄せ */}
          <g fill="none" stroke="var(--ink-10)" strokeWidth="3">
            <rect x="692" y="618" width="66" height="18" />
            <path d="M700 636 h50 a24 24 0 0 1 0 56 h-50 a24 24 0 0 1 0-56 Z" />
          </g>
          {/* 玄関: たたきと上がり框 */}
          <g fill="none" stroke="var(--ink-10)" strokeWidth="3">
            <rect x="1000" y="360" width="110" height="120" fill="var(--off-white)" />
            <line x1="1000" y1="360" x2="1000" y2="480" strokeWidth="6" />
          </g>

          {/* ---- 家事動線: キッチンから洗面室へ ---- */}
          <path
            d="M470 230 V400 H612"
            fill="none"
            stroke="var(--blue)"
            strokeWidth="4"
            strokeDasharray="14 12"
            strokeLinecap="round"
          />
          <path d="M634 400 l-24 -12 v24 Z" fill="var(--blue)" />

          {/* ---- 間仕切り壁 ---- */}
          <g stroke="var(--ink)" strokeWidth="6" strokeLinecap="square">
            {/* LDK と水まわりの間（引戸の開口 400..500 を空ける） */}
            <line x1="600" y1="110" x2="600" y2="400" />
            <line x1="600" y1="500" x2="600" y2="700" />
            {/* 浴室と洗面室の間（引戸の開口 660..780 を空ける） */}
            <line x1="600" y1="350" x2="660" y2="350" />
            <line x1="780" y1="350" x2="850" y2="350" />
            {/* 洗面室とトイレの間 */}
            <line x1="600" y1="560" x2="850" y2="560" />
            {/* 水まわりと玄関ホールの間（開き戸の開口を 2 か所空ける） */}
            <line x1="850" y1="110" x2="850" y2="400" />
            <line x1="850" y1="500" x2="850" y2="590" />
            <line x1="850" y1="680" x2="850" y2="700" />
            {/* LDK と玄関ホールの間（引戸の開口 730..800 を空ける） */}
            <line x1="850" y1="700" x2="850" y2="730" />
            <line x1="850" y1="800" x2="850" y2="820" />
            {/* 水まわりの下端 */}
            <line x1="600" y1="700" x2="850" y2="700" />
          </g>

          {/* ---- 建具: 引戸は 2 本線、開き戸は四分円 ---- */}
          <g stroke="var(--ink-10)" strokeWidth="3" fill="none">
            <line x1="600" y1="404" x2="600" y2="496" />
            <line x1="608" y1="404" x2="608" y2="496" />
            <line x1="664" y1="350" x2="776" y2="350" />
            <line x1="664" y1="342" x2="776" y2="342" />
            <line x1="850" y1="704" x2="850" y2="796" />
            <line x1="858" y1="704" x2="858" y2="796" />
            {/* 洗面室 → 玄関ホール */}
            <path d="M850 400 v100" strokeWidth="4" />
            <path d="M850 400 A100 100 0 0 1 950 500" />
            {/* トイレ → 玄関ホール */}
            <path d="M850 590 v90" strokeWidth="4" />
            <path d="M850 680 A90 90 0 0 0 940 590" />
          </g>

          {/* ---- 外壁 ---- */}
          <rect x="90" y="110" width="1020" height="710" fill="none" stroke="var(--ink)" strokeWidth="10" />

          {/* ---- 室名 ---- */}
          <g fill="var(--ink)" fontSize="40" textAnchor="middle" fontWeight="500">
            <text x="300" y="330">LDK</text>
            <text x="980" y="200">玄関ホール</text>
          </g>
          <g fill="var(--blue-deep)" fontSize="36" textAnchor="middle" fontWeight="600">
            {WET_ROOMS.map((r) => (
              <text key={r.label} x={r.x + r.w / 2} y={r.labelY}>{r.label}</text>
            ))}
          </g>
          <g fill="var(--ink-10)" fontSize="30" textAnchor="middle">
            <text x="315" y="252">キッチン</text>
            <text x="1055" y="524">玄関</text>
          </g>
        </g>
      </svg>

      <figcaption className="floor-plan-legend">
        <span className="floor-plan-key floor-plan-key-wet">水まわり</span>
        <span className="floor-plan-key floor-plan-key-flow">家事動線</span>
        <span className="floor-plan-note">※ 図は一般的な間取りの例です</span>
      </figcaption>
    </figure>
  );
}
