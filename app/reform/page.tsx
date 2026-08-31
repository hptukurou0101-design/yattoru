import type { Metadata } from "next";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb, ConsultationBand, PageHero, PageLead, SectionTitle } from "@/components/page-elements";
import { reformServices } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "リフォーム｜やっとる建設",
  description: "外壁・屋根・水まわりを中心に、戸建てリフォームに対応します。福岡市のやっとる建設株式会社。",
};

export default function ReformPage() {
  return (
    <SiteFrame>
      <main>
        <PageHero title="リフォーム" lead="外壁・屋根・水まわりを中心に、戸建てリフォームに対応します。" image="/hero-03-water.webp" alt="入れ替えた浴室と洗面室" position="center 55%" />
        <Breadcrumb items={[["リフォーム"]]} />
        <PageLead title={<>必要な工事を見極め、<br />暮らしに合う方法をご提案します。</>}>
          <p>建物の状態、ご希望、ご予算によって、選ぶべき工事は変わります。まずは現状を確認し、今行うことと将来考える⁠ことを整理します。</p>
        </PageLead>
        <section className="sub-section section-wrap">
          <SectionTitle title="主なリフォーム" text="各ページで、工事内容とご相談の目安をご案内しています。" centered />
          <div className="reform-menu-grid">
            {reformServices.map((service) => (
              <article key={service.href}>
                <a className="reform-menu-image" href={service.href} aria-label={`${service.title}の詳細`}><Image src={service.image} alt={service.alt} fill sizes="(max-width: 800px) 100vw, 33vw" /></a>
                <div><h3>{service.title}</h3><p>{service.text}</p><a className="text-arrow-link" href={service.href}>詳しく見る<ChevronRight aria-hidden="true" /></a></div>
              </article>
            ))}
          </div>
        </section>
        <section className="sub-section soft-section">
          <div className="section-wrap">
            <SectionTitle title="そのほかの戸建てリフォーム" centered />
            <ul className="plain-service-list">
              <li>浴室・洗面・トイレ</li><li>内装・床・壁紙</li><li>収納・間取りの見直し</li><li>玄関・窓・建具</li><li>雨どい・防水</li><li>小規模な修理のご相談</li>
            </ul>
            <p className="center-note">対応の可否は建物の状態や施工地域によって異なります。まずは工事を検討している場所をお聞かせください。</p>
          </div>
        </section>
        <ConsultationBand />
      </main>
    </SiteFrame>
  );
}
