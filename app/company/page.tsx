import type { Metadata } from "next";
import Image from "next/image";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb, ConsultationBand, PageHero, PageLead, SectionTitle } from "@/components/page-elements";

export const metadata: Metadata = {
  title: "会社情報｜やっとる建設",
  description: "福岡で、住まいの安心を支える地域のリフォーム会社です。福岡市のやっとる建設株式会社。",
};

export default function CompanyPage() {
  return (
    <SiteFrame>
      <main>
        <PageHero title="会社情報" lead="福岡で、住まいの安心を支える地域のリフォーム会社です。" image="/service-exterior.webp" alt="地域の住まいを支えるやっとる建設" position="center 58%" />
        <Breadcrumb items={[["会社情報"]]} />
        <PageLead title={<>近所の頼れる職人のような、<br />話しやすい会社でありたい。</>}><p>分からないことを分からないままにせず、納得して工事を任せていただけるよう、丁寧な説明を心がけています。</p></PageLead>
        <section className="image-copy-split section-wrap company-message">
          <div className="split-image"><Image src="/hero-living.webp" alt="安心して暮らせるように整えた住まい" fill sizes="(max-width: 800px) 100vw, 52vw" /></div>
          <div className="split-copy"><SectionTitle title="住まいのことを、長く相談できる関係へ。" /><p>工事を受けることだけが目的ではありません。今の住まいに何が必要かを一緒に考え、工事後も気軽に声をかけていただける会社を目指しています。</p><p className="signature">代表取締役　山田 太郎</p></div>
        </section>
        <section className="sub-section soft-section"><div className="section-wrap company-overview"><SectionTitle title="会社概要" centered /><dl><div><dt>会社名</dt><dd>やっとる建設株式会社</dd></div><div><dt>代表者</dt><dd>山田 太郎</dd></div><div><dt>設立</dt><dd>2012年</dd></div><div><dt>所在地</dt><dd>福岡県福岡市博多区博多駅前○丁目○-○</dd></div><div><dt>電話番号</dt><dd><a href="tel:0921234567">092-123-4567</a></dd></div><div><dt>営業時間</dt><dd>9:00〜18:00（日曜・祝日定休）</dd></div><div><dt>事業内容</dt><dd>外壁塗装、屋根塗装、水まわりリフォーム、戸建てリフォーム</dd></div><div><dt>建設業許可</dt><dd>福岡県知事許可（般-4）第12345号</dd></div></dl><p className="data-note">代表者名・設立年・所在地・電話番号・建設業許可は、公開前に正式情報へ差し替えてください。</p></div></section>
        <ConsultationBand />
      </main>
    </SiteFrame>
  );
}
