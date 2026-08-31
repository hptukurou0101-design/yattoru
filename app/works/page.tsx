import type { Metadata } from "next";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb, ConsultationBand, PageHero, PageLead, SectionTitle } from "@/components/page-elements";
import { workExamples } from "@/lib/site-data";

export const metadata: Metadata = { title: "施工事例｜やっとる建設" };

export default function WorksPage() {
  return (
    <SiteFrame>
      <main>
        <PageHero title="施工事例" lead="ご要望とご予算に向き合い、一つずつ形にした事例をご紹介します。" image="/hero-living.webp" alt="明るくリフォームしたリビングダイニング" position="center 54%" />
        <Breadcrumb items={[["施工事例"]]} />
        <PageLead title={<>工事の内容だけでなく、<br />ご相談からご提案までお伝えします。</>}>
          <p>住まいによって状態も暮らし方も異なります。施工前のお悩み、工事で大切にしたこと、完成後の変化を事例ごとにまとめています。</p>
        </PageLead>
        <section className="sub-section section-wrap">
          <SectionTitle title="リフォーム施工事例" centered />
          <div className="work-filter" aria-label="施工事例の分類"><span className="active">すべて</span><span>外壁・屋根</span><span>キッチン</span><span>LDK</span><span>その他</span></div>
          <div className="works-list-grid">
            {workExamples.map((work) => (
              <article key={work.slug}>
                <a className="works-list-image" href={`/works/${work.slug}`} aria-label={`施工事例「${work.title}」の詳細`}><Image src={work.image} alt={work.alt} fill sizes="(max-width: 760px) 100vw, 50vw" /></a>
                <div className="works-list-copy"><ul>{work.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><h3>{work.title}</h3><a className="text-arrow-link" href={`/works/${work.slug}`}>事例の詳細を見る<ChevronRight aria-hidden="true" /></a></div>
              </article>
            ))}
          </div>
          <p className="data-note">施工地域・工期・費用は、正式な事例情報をご提供いただいた段階で各詳細ページへ掲載します。</p>
        </section>
        <ConsultationBand />
      </main>
    </SiteFrame>
  );
}
