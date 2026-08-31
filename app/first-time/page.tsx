import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb, ConsultationBand, NumberedSteps, PageHero, PageLead, SectionTitle } from "@/components/page-elements";

export const metadata: Metadata = { title: "初めてのリフォーム｜やっとる建設" };

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
        <PageHero title="初めてリフォームを検討する方へ" lead="分からないことを、一つずつ整理しながら進めます。" image="/hero-living.png" alt="明るく整えたリビングダイニング" position="center 54%" />
        <Breadcrumb items={[["初めての方へ"]]} />
        <PageLead title={<>「いくらかかるのか」「希望どおりになるのか」<br />その不安からお聞かせください。</>}>
          <p>最初から工事内容を決めていただく必要はありません。現在困っていること、変えたいこと、ご予算を確認しながら、必要な工事を一緒に考えます。</p>
        </PageLead>
        <section className="sub-section narrow-section">
          <SectionTitle title="ご相談から完成後まで" text="工事内容によって順番や期間は変わります。具体的な工程はお見積もり時にご説明します。" centered />
          <NumberedSteps steps={steps} />
        </section>
        <section className="sub-section soft-section">
          <div className="section-wrap">
            <SectionTitle title="安心してご検討いただくために" centered />
            <div className="two-note-grid">
              <article><h3>費用が変わる場合は、工事前にご説明します。</h3><p>現地確認後に追加工事が必要だと分かった場合は、理由と金額をお伝えします。確認をいただかずに工事を進めることはありません。</p></article>
              <article><h3>施工中の暮らしへの影響もお伝えします。</h3><p>水まわりが使えない時間、音やにおいが出る工程、在宅の必要がある日などを、工事前にご案内します。</p></article>
            </div>
          </div>
        </section>
        <ConsultationBand />
      </main>
    </SiteFrame>
  );
}
