import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb, PageHero, PageLead, SectionTitle } from "@/components/page-elements";

export const metadata: Metadata = { title: "ご相談・お問い合わせ｜やっとる建設" };

export default function ContactPage() {
  return (
    <SiteFrame>
      <main>
        <PageHero title="ご相談・お問い合わせ" lead="工事内容や費用が決まっていない段階でもご相談いただけます。" image="/service-kitchen.png" alt="リフォーム後の明るいキッチン" />
        <Breadcrumb items={[["ご相談・お問い合わせ"]]} />
        <PageLead title={<>住まいで気になることを、<br />まずはお聞かせください。</>}><p>必要なことはこちらから確認します。まだ希望がまとまっていない場合も、現在のお悩みから一緒に整理します。</p></PageLead>
        <section className="contact-choice section-wrap">
          <a href="tel:0921234567"><Phone aria-hidden="true" /><span><small>お電話でのご相談</small><strong>092-123-4567</strong><em>9:00〜18:00／日曜・祝日定休</em></span></a>
          <a href="mailto:info@yattoru-kensetsu.jp"><Mail aria-hidden="true" /><span><small>メールでのご相談</small><strong>info@yattoru-kensetsu.jp</strong><em>内容を確認後、担当者よりご連絡します</em></span></a>
        </section>
        <section className="sub-section soft-section">
          <div className="contact-form-wrap">
            <SectionTitle title="お問い合わせフォーム" text="以下の項目をご入力ください。写真を添付する場合は、メールでお送りください。" centered />
            <form className="contact-form" action="mailto:info@yattoru-kensetsu.jp" method="post" encType="text/plain">
              <label><span>お名前 <b>必須</b></span><input name="お名前" type="text" required /></label>
              <label><span>電話番号またはメール <b>必須</b></span><input name="ご連絡先" type="text" required /></label>
              <label><span>施工希望地域</span><input name="施工希望地域" type="text" placeholder="例：福岡市博多区" /></label>
              <label><span>希望する連絡方法</span><select name="希望する連絡方法" defaultValue="電話"><option>電話</option><option>メール</option><option>どちらでもよい</option></select></label>
              <label><span>ご相談内容 <b>必須</b></span><textarea name="ご相談内容" rows={7} required placeholder="気になる場所や現在のお悩みをご記入ください。" /></label>
              <label className="check-label"><input name="個人情報保護方針への同意" type="checkbox" required /><span><a href="/privacy">個人情報保護方針</a>に同意する</span></label>
              <button type="submit">入力内容をメールで送る</button>
              <p className="form-note">この確認版では、送信ボタンを押すと端末のメールソフトが開きます。本番公開時は、ご利用のフォーム送信先へ接続してください。</p>
            </form>
          </div>
        </section>
      </main>
    </SiteFrame>
  );
}
