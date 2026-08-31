import type { Metadata } from "next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SiteFrame } from "@/components/site-chrome";
import { Breadcrumb, ConsultationBand, PageHero, PageLead } from "@/components/page-elements";
import { faqGroups } from "@/lib/site-data";

export const metadata: Metadata = { title: "よくある質問｜やっとる建設" };

export default function FaqPage() {
  return (
    <SiteFrame>
      <main>
        <PageHero title="よくある質問" lead="ご相談前に多くいただく質問をまとめています。" image="/service-kitchen.webp" alt="使いやすく整えた明るいキッチン" />
        <Breadcrumb items={[["よくある質問"]]} />
        <PageLead title={<>費用や工事について、<br />気になることからご確認ください。</>}><p>ここにない質問や、住まいの状態に合わせた確認が必要なことは、お問い合わせページからご相談いただけます。</p></PageLead>
        <section className="sub-section narrow-section faq-groups">
          {faqGroups.map((group, groupIndex) => <section key={group.title}><h2>{group.title}</h2><Accordion type="single" collapsible className="faq-list">{group.items.map(([question, answer], index) => <AccordionItem value={`${groupIndex}-${index}`} key={question}><AccordionTrigger>{question}</AccordionTrigger><AccordionContent>{answer}</AccordionContent></AccordionItem>)}</Accordion></section>)}
        </section>
        <ConsultationBand />
      </main>
    </SiteFrame>
  );
}
