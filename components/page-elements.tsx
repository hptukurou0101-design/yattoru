import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Mail, Phone } from "lucide-react";

export function PageHero({
  title,
  lead,
  image,
  alt,
  position = "center",
}: {
  title: string;
  lead: string;
  image: string;
  alt: string;
  position?: string;
}) {
  return (
    <section className="page-hero">
      <Image src={image} alt={alt} fill priority sizes="100vw" style={{ objectPosition: position }} />
      <div className="page-hero-shade" />
      <div className="page-hero-copy">
        <h1>{title}</h1>
        <p>{lead}</p>
      </div>
    </section>
  );
}

export function Breadcrumb({ items }: { items: Array<[string, string?]> }) {
  return (
    <nav className="breadcrumb section-wrap" aria-label="パンくずリスト">
      <Link href="/">トップ</Link>
      {items.map(([label, href], index) => (
        <span key={`${label}-${index}`}>
          <ChevronRight aria-hidden="true" />
          {href ? <a href={href}>{label}</a> : <span aria-current="page">{label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function PageLead({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="page-lead section-wrap">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

export function SectionTitle({
  title,
  text,
  centered = false,
}: {
  title: string;
  text?: string;
  centered?: boolean;
}) {
  return (
    <div className={`sub-section-title${centered ? " centered" : ""}`}>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="line-button subpage-link" href={href}>
      {children}
      <ChevronRight className="section-arrow" aria-hidden="true" />
    </a>
  );
}

export function ConsultationBand() {
  return (
    <section className="sub-consult">
      <div className="section-wrap sub-consult-inner">
        <div>
          <h2>住まいで気になることがあれば、<br />まずはお話をお聞かせください。</h2>
          <p>工事内容や費用が決まっていなくても大丈夫です。今のお悩みを伺い、必要な進め方をご案内します。</p>
        </div>
        <div className="sub-consult-actions">
          <a href="/contact"><Mail aria-hidden="true" />住まいのことを相談する<ChevronRight aria-hidden="true" /></a>
          <a href="tel:0921234567"><Phone aria-hidden="true" />092-123-4567</a>
          <small>受付時間 9:00〜18:00／日曜・祝日定休</small>
        </div>
      </div>
    </section>
  );
}

export function NumberedSteps({
  steps,
}: {
  steps: Array<{ title: string; text: string }>;
}) {
  return (
    <ol className="numbered-steps">
      {steps.map((step, index) => (
        <li key={step.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div><h3>{step.title}</h3><p>{step.text}</p></div>
        </li>
      ))}
    </ol>
  );
}
