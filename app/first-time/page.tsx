import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb, ConsultationBand, NumberedSteps, PageHero, PageLead, SectionTitle } from "@/components/page-elements";
import { WrapText } from "@/components/wrap-text";

export const metadata: Metadata = {
  title: "初めての方へ｜やっとる建設",
  description: "分からないことを、一つずつ整理しながら進めます。福岡市のやっとる建設株式会社。",
};

const steps = [
  { title: "お問い合わせ", text: "気になる場所や現在のお悩みを、電話またはお問い合わせフォームからお聞かせください。" },
  { title: "現地確認", text: "住まいの状態と工事が必要な範囲を確認します。" },
  { title: "ご希望と予算の確認", text: "実現したいこととご予算を伺い、優先順位を一緒に整理します。" },
  { title: "プラン・お見積もり", text: "工事内容、費用、工期、工事中の暮らしへの影響をご説明します。" },
  { title: "ご契約・施工", text: "内容にご納得いただいたあと、ご契約と施工へ進みます。" },
  { title: "完成確認", text: "仕上がりを一緒に確認し、設備の使い方やお手入れ方法をご案内します。" },
  { title: "アフターフォロー", text: "施工後に気になる点が出た場合もご相談いただけます。" },
];

export default function FirstTimePage() {
  return (
    <SiteFrame>
      <main>
        <PageHero title="初めての方へ" lead="分からないことを、一つずつ整理しながら進めます。" image="/hero-01-ldk.webp" alt="梁をあらわしにした明るいリビングダイニング" position="center 58%" />
        <Breadcrumb items={[["初めての方へ"]]} />
        <PageLead title={<>「いくらかかるのか」「希望どおりに仕上がるのか」<br />まずは、気になっていることをお聞かせください。</>}>
          <p>最初から工事内容を決めていただく必要はありません。</p>
          <p>現在困っている⁠こと、変えたいこと、ご予算を確認しながら、必要な工事を一緒に考えます。</p>
        </PageLead>
        <section className="sub-section narrow-section">
          <SectionTitle title="ご相談から完成後まで" text={"工事内容によって順番や期間は変わります。\n具体的な工程はお見積もり時にご説明します。"} centered />
          <NumberedSteps steps={steps} />
        </section>
        <section className="sub-section soft-section">
          <div className="section-wrap">
            <SectionTitle title="安心してご検討いただく⁠ために" centered />
            <div className="two-note-grid">
              <article><h3>費用が変わる場合は、必ず事前にお伝えします。</h3><p><WrapText text={"現地確認の結果、追加工事が必要となる場合は、理由と金額をご説明し、お客様のご了承をいただいてから進めます。\nご了承なく追加工事を行うことはありません。"} /></p></article>
              <article><h3>工事中の過ごし方も、事前にご案内します。</h3><p>水まわりを使えない時間や、音・においが発生する工程、在宅をお願いする日など、普段の暮らしに影響する内容をあらかじめお伝えします。</p></article>
            </div>
          </div>
        </section>
        <ConsultationBand />
      </main>
    </SiteFrame>
  );
}
