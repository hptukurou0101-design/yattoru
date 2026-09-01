import Image from "next/image";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb, ConsultationBand, NumberedSteps, PageHero, PageLead, SectionTitle } from "@/components/page-elements";

export type ReformDetailData = {
  title: string;
  lead: string;
  image: string;
  alt: string;
  position?: string;
  /**
   * ページ下部「工事の進め方」の手前に置く写真。
   *
   * 省略するとヒーローと同じ写真になる。同じページで 2 回同じ写真が出るため、
   * 素材が揃っているページでは必ず別の写真を指定する。
   */
  splitImage?: string;
  splitAlt?: string;
  splitPosition?: string;
  introTitle: React.ReactNode;
  intro: string;
  signsTitle: string;
  signs: Array<[string, string]>;
  workTitle: string;
  workText: string;
  steps: Array<{ title: string; text: string }>;
};

export function ReformDetail({ data }: { data: ReformDetailData }) {
  return (
    <SiteFrame>
      <main>
        <PageHero title={data.title} lead={data.lead} image={data.image} alt={data.alt} position={data.position} />
        <Breadcrumb items={[["リフォーム", "/reform"], [data.title]]} />
        <PageLead title={data.introTitle}><p>{data.intro}</p></PageLead>
        <section className="sub-section section-wrap">
          <SectionTitle title={data.signsTitle} centered />
          <div className="sign-grid">
            {data.signs.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>
        <section className="image-copy-split section-wrap detail-split">
          <div className="split-image"><Image src={data.splitImage ?? data.image} alt={data.splitAlt ?? data.alt} fill sizes="(max-width: 800px) 100vw, 52vw" style={{ objectPosition: data.splitPosition ?? data.position }} /></div>
          <div className="split-copy"><SectionTitle title={data.workTitle} /><p>{data.workText}</p><p>工事範囲とお見積もりは、現地を確認してから具体的にご案内します。</p></div>
        </section>
        <section className="sub-section narrow-section">
          <SectionTitle title="工事の進め方" centered />
          <NumberedSteps steps={data.steps} />
        </section>
        <ConsultationBand />
      </main>
    </SiteFrame>
  );
}
