import Image from "next/image";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb, ConsultationBand, PageHero, SectionTitle } from "@/components/page-elements";

type Work = {
  title: string;
  image: string;
  alt: string;
  tags: readonly string[];
  request: string;
  proposal: string;
};

export function WorkDetail({ work }: { work: Work }) {
  return (
    <SiteFrame>
      <main>
        <PageHero title="施工事例" lead={work.title} image={work.image} alt={work.alt} position="center 54%" />
        <Breadcrumb items={[["施工事例", "/works"], [work.title]]} />
        <article className="work-detail section-wrap">
          <header><ul>{work.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><h1>{work.title}</h1></header>
          <div className="work-detail-image"><Image src={work.image} alt={work.alt} fill sizes="(max-width: 800px) 100vw, 1120px" /></div>
          <dl className="work-data"><div><dt>建物の種類</dt><dd>戸建て</dd></div><div><dt>施工地域</dt><dd>正式データへ差し替え</dd></div><div><dt>工事期間</dt><dd>正式データへ差し替え</dd></div><div><dt>費用の目安</dt><dd>正式データへ差し替え</dd></div></dl>
          <section className="work-story"><SectionTitle title="お客様のご要望" /><p>{work.request}</p></section>
          <section className="work-story"><SectionTitle title="やっとる建設からのご提案" /><p>{work.proposal}</p></section>
          <p className="data-note">このページはレイアウト確認用です。施工地域・期間・費用・担当者コメントは、公開許可を得た正式情報へ差し替えてください。</p>
        </article>
        <ConsultationBand />
      </main>
    </SiteFrame>
  );
}
