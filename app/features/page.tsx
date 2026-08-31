import type { Metadata } from "next";
import Image from "next/image";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb, ConsultationBand, PageHero, PageLead, SectionTitle } from "@/components/page-elements";

export const metadata: Metadata = {
  title: "私たちの特長｜やっとる建設",
  description: "相談しやすく、仕事はきっちり。住まいに長く向き合います。福岡市のやっとる建設株式会社。",
};

const promises = [
  ["ご予算を踏まえて考える", "ご希望をすべて並べるだけではなく、優先したい⁠ことを一緒に整理します。ご予算の中で納得できる進め方を考えます。"],
  ["分かる言葉で説明する", "専門用語だけで話を進めず、必要な工事とその理由、選べる方法を一つずつご説明します。"],
  ["工事後も相談を受ける", "完成して終わりではありません。気になる点やこれからのメンテナンスについても、身近な相談相手として対応します。"],
] as const;

export default function FeaturesPage() {
  return (
    <SiteFrame>
      <main>
        <PageHero title="私たちが大切にしている⁠こと" lead="相談しやすく、仕事はきっちり。住まいに長く向き合います。" image="/hero-02-exterior.webp" alt="外壁と屋根を整えた戸建て住宅の外観" position="center 62%" />
        <Breadcrumb items={[["私たちの特長"]]} />
        <PageLead title={<>工事の前も、工事のあとも、<br />安心して話せる会社でありたい。</>}>
          <p>リフォームは、完成するまで仕上がりが見えにくい工事です。だからこそ、私たちはご希望とご予算を最初に確認し、必要なことを分かりやすくお伝えします。</p>
          <p>納得できないことを残したまま進めず、工事が終わったあとも相談できる関係を大切にしています。</p>
        </PageLead>

        <section className="sub-section section-wrap">
          <SectionTitle title="3つのお約束" text="やっとる建設が、すべてのご相談で大切にする基本姿勢です。" centered />
          <div className="promise-grid">
            {promises.map(([title, text], index) => (
              <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </section>

        <section className="image-copy-split section-wrap">
          <div className="split-image"><Image src="/hero-living.webp" alt="暮らしに合わせて整えた住まい" fill sizes="(max-width: 800px) 100vw, 52vw" /></div>
          <div className="split-copy">
            <SectionTitle title="住まい全体を見て、必要な順番を考えます。" />
            <p>気になっている場所だけでなく、建物の状態やこれからの暮らし方も確認します。今すぐ行う工事と、少し先に考えてよい工事を整理する⁠ことで、判断しやすいご提案につなげます。</p>
            <p>工事内容が決まっていない段階でも、まずは今のお悩みをお聞かせください。</p>
          </div>
        </section>
        <ConsultationBand />
      </main>
    </SiteFrame>
  );
}
