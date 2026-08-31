import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb, ConsultationBand, PageHero, PageLead } from "@/components/page-elements";

export const metadata: Metadata = { title: "お知らせ｜やっとる建設" };

const news = [
  ["2026.08.31", "お知らせ", "ホームページを公開しました。", "やっとる建設のホームページをご覧いただき、ありがとうございます。施工事例や住まいの情報を順次掲載します。"],
  ["2026.08.20", "お知らせ", "住まいのリフォーム相談を受け付けています。", "外壁・屋根・水まわりなど、住まいで気になることがあればお問い合わせください。"],
] as const;

export default function NewsPage() {
  return (
    <SiteFrame>
      <main>
        <PageHero title="お知らせ" lead="やっとる建設からのお知らせと、住まいに役立つ情報を掲載します。" image="/service-exterior.webp" alt="リフォームした戸建て住宅" position="center 58%" />
        <Breadcrumb items={[["お知らせ"]]} />
        <PageLead title={<>住まいを考えるときの、<br />判断材料になる情報を。</>}><p>会社からのお知らせに加え、外壁・屋根のメンテナンスや水まわりリフォームについて分かりやすくお伝えします。</p></PageLead>
        <section className="sub-section section-wrap news-archive">{news.map(([date, category, title, text]) => <article key={date}><header><time>{date}</time><span>{category}</span></header><h2>{title}</h2><p>{text}</p></article>)}</section>
        <ConsultationBand />
      </main>
    </SiteFrame>
  );
}
