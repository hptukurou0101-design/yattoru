import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb, ConsultationBand, PageHero, PageLead, SectionTitle } from "@/components/page-elements";

export const metadata: Metadata = { title: "お客様の声｜やっとる建設" };

const voices = [
  { name: "福岡市・K様", title: "工事前に一つずつ説明してもらえました。", body: "最初は費用がどこまで増えるのか不安でしたが、工事前に一つずつ説明してもらえたので、納得してお願いできました。" },
  { name: "福岡市・M様", title: "予算の中で優先することを一緒に考えてくれました。", body: "こちらの希望を急いで決めつけず、予算の中で優先した方がよいところを一緒に考えてくれました。" },
  { name: "福岡市・S様", title: "工事後の小さな相談にも応えてもらえました。", body: "工事が終わったあとも小さな相談に応えてもらえました。近くに頼れる方がいると思うと安心です。" },
];

export default function VoicesPage() {
  return (
    <SiteFrame>
      <main>
        <PageHero title="お客様の声" lead="工事を終えたお客様からいただいた声をご紹介します。" image="/hero-living.png" alt="家族が過ごしやすい明るい住まい" position="center 54%" />
        <Breadcrumb items={[["お客様の声"]]} />
        <PageLead title={<>安心して任せられたという言葉を、<br />これからの仕事につなげます。</>}><p>ご相談時に感じていた不安、説明や施工について感じたこと、完成後の暮らしの変化を掲載しています。</p></PageLead>
        <section className="sub-section section-wrap">
          <SectionTitle title="お客様からいただいた声" centered />
          <div className="voice-list">
            {voices.map((voice, index) => <article key={voice.name}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{voice.title}</h3><p>「{voice.body}」</p><small>{voice.name}</small></div></article>)}
          </div>
          <p className="data-note">現在掲載している内容はデザイン確認用のサンプルです。公開時は、掲載許可をいただいた正式なお客様の声へ差し替えてください。</p>
        </section>
        <ConsultationBand />
      </main>
    </SiteFrame>
  );
}
