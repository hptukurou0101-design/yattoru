import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb } from "@/components/page-elements";

export const metadata: Metadata = { title: "サイト利用規約｜やっとる建設" };

export default function TermsPage() {
  return (
    <SiteFrame>
      <main>
        <header className="text-page-header"><h1>サイト利用規約</h1><p>当サイトをご利用いただく際のご案内</p></header>
        <Breadcrumb items={[["サイト利用規約"]]} />
        <article className="legal-page section-wrap">
          <p>この利用規約は、やっとる建設株式会社（以下「当社」）が運営するウェブサイトの利用条件を定めるものです。</p>
          <section><h2>1．掲載情報について</h2><p>当サイトでは正確な情報の掲載に努めますが、内容の完全性や最新性を保証するものではありません。工事内容、費用、期間は建物の状態やご要望によって異なり、個別のお見積もりをもって確定します。</p></section>
          <section><h2>2．著作権</h2><p>当サイトに掲載する文章、写真、デザイン等の権利は、当社または正当な権利者に帰属します。許可なく転載、複製、改変することを禁止します。</p></section>
          <section><h2>3．外部サイトへのリンク</h2><p>当サイトから外部サイトへ移動した場合、移動先の内容や利用によって生じた損害について当社は責任を負いません。</p></section>
          <section><h2>4．免責事項</h2><p>当サイトの利用または利用できなかったことにより生じた損害について、当社に故意または重大な過失がある場合を除き、責任を負いません。</p></section>
          <section><h2>5．規約の変更</h2><p>必要に応じて本規約を変更することがあります。変更後の内容は当サイトへ掲載した時点から適用されます。</p></section>
          <p className="data-note">会社情報と施行日は、正式情報を確認したうえで公開前に更新してください。</p>
        </article>
      </main>
    </SiteFrame>
  );
}
