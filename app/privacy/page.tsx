import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb } from "@/components/page-elements";

export const metadata: Metadata = {
  title: "プライバシーポリシー｜やっとる建設",
  description: "個人情報の取り扱いについて。福岡市のやっとる建設株式会社。",
};

export default function PrivacyPage() {
  return (
    <SiteFrame>
      <main>
        <header className="text-page-header"><h1>プライバシーポリシー</h1><p>個人情報の取り扱いについて</p></header>
        <Breadcrumb items={[["プライバシーポリシー"]]} />
        <article className="legal-page section-wrap">
          <p>やっとる建設株式会社（以下「当社」）は、お客様からお預かりする個人情報を適切に取り扱う⁠ため、以下の方針を定めます。</p>
          <section><h2>1．取得する情報</h2><p>当社は、お問い合わせやお見積もりのご依頼に際し、お名前、住所、電話番号、メールアドレス、ご相談内容、施工対象となる住まいの情報などを取得する場合があります。</p></section>
          <section><h2>2．利用目的</h2><p>取得した情報は、お問い合わせへの回答、現地調査やお見積もりのご連絡、工事の実施、アフターフォロー、当社サービスに関するご案内の⁠ために利用します。</p></section>
          <section><h2>3．第三者への提供</h2><p>法令に基づく場合を除き、ご本人の同意なく個人情報を第三者へ提供しません。工事の実施に必要な範囲で協力会社へ取り扱いを委託する場合は、適切な管理を行います。</p></section>
          <section><h2>4．安全管理</h2><p>個人情報への不正アクセス、紛失、漏えいを防ぐ⁠ため、必要な安全管理措置を講じます。</p></section>
          <section><h2>5．開示・訂正・削除</h2><p>ご本人から個人情報の開示、訂正、利用停止、削除のご希望があった場合は、ご本人確認のうえ適切に対応します。</p></section>
          <section><h2>6．お問い合わせ窓口</h2><p>やっとる建設株式会社<br />福岡県福岡市博多区博多駅前○丁目○-○<br />電話：092-123-4567</p></section>
          <p className="data-note">会社情報と施行日は、正式情報を確認したうえで公開前に更新してください。</p>
        </article>
      </main>
    </SiteFrame>
  );
}
