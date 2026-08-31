import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

const services = [
  {
    title: "外壁塗装",
    description:
      "住まいの印象を整えるだけでなく、雨や紫外線から建物を守ります。状態を確かめ、必要な工事をご説明します。",
    image: "/service-exterior.png",
    alt: "外壁塗装後の戸建て住宅",
  },
  {
    title: "屋根塗装",
    description:
      "見えにくい屋根の状態も丁寧に確認します。劣化の程度とご予算を踏まえ、無理のない工事方法をご提案します。",
    image: "/service-exterior.png",
    alt: "塗装後の屋根と外壁",
  },
  {
    title: "水まわりリフォーム",
    description:
      "キッチン・浴室・洗面・トイレを、毎日の使いやすさから見直します。ご希望と必要性を整理して形にします。",
    image: "/service-kitchen.png",
    alt: "使いやすくリフォームしたキッチン",
  },
];

const works = [
  {
    title: "明るさと動線を見直した、家族が集まるLDK",
    meta: ["戸建て", "LDK", "水まわり"],
    image: "/hero-living.png",
    alt: "明るくリフォームしたリビングダイニング",
  },
  {
    title: "外壁と屋根を整え、これからも安心して暮らせる住まいへ",
    meta: ["戸建て", "外壁", "屋根"],
    image: "/service-exterior.png",
    alt: "外壁と屋根をリフォームした住宅",
  },
  {
    title: "毎日の家事がしやすい、すっきりとしたキッチン",
    meta: ["戸建て", "キッチン", "収納"],
    image: "/service-kitchen.png",
    alt: "収納と動線を整えたキッチン",
  },
];

const voices = [
  {
    name: "福岡市・K様",
    body: "最初は費用がどこまで増えるのか不安でしたが、工事前に一つずつ説明してもらえたので、納得してお願いできました。",
  },
  {
    name: "福岡市・M様",
    body: "こちらの希望を急いで決めつけず、予算の中で優先した方がよいところを一緒に考えてくれました。",
  },
  {
    name: "福岡市・S様",
    body: "工事が終わったあとも小さな相談に応えてもらえました。近くに頼れる方がいると思うと安心です。",
  },
];

const faqs = [
  {
    question: "相談したら、すぐ契約しなければいけませんか？",
    answer:
      "いいえ。まずは住まいのお悩みやご希望をお聞かせください。工事内容とお見積もりをご確認いただき、十分にご検討いただけます。",
  },
  {
    question: "予算が決まっていても相談できますか？",
    answer:
      "はい。ご予算と優先したいことを伺い、その範囲でできる方法を整理してご提案します。追加が必要な場合も、工事前に理由と金額をご説明します。",
  },
  {
    question: "工事中も住み続けられますか？",
    answer:
      "工事箇所や内容によって異なります。現地調査の際に、工事期間と暮らしへの影響を具体的にご案内します。",
  },
  {
    question: "工事後の相談にも対応してもらえますか？",
    answer:
      "はい。施工後も気になる点や住まいの小さなお困りごとをご相談いただけます。長く安心して暮らせるようお付き合いを続けます。",
  },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
    </span>
  );
}

function SectionArrow() {
  return <ChevronRight className="section-arrow" aria-hidden="true" />;
}

export default function Home() {
  return (
    <div id="top" className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="やっとる建設株式会社 トップへ">
          <BrandMark />
          <span className="brand-text">
            <strong>やっとる建設</strong>
            <small>YATTORU CONSTRUCTION</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="メインナビゲーション">
          <a href="#strength">私たちの特長</a>
          <a href="#first">初めての方へ</a>
          <a href="#service">リフォーム</a>
          <a href="#works">施工事例</a>
          <a href="#company">会社情報</a>
          <a href="#faq">よくある質問</a>
        </nav>

        <a className="header-contact" href="#contact">
          ご相談・お問い合わせ
        </a>

        <details className="mobile-menu">
          <summary aria-label="メニューを開く">
            <span />
            <span />
            <span />
          </summary>
          <nav aria-label="モバイルナビゲーション">
            <a href="#strength">私たちの特長</a>
            <a href="#first">初めての方へ</a>
            <a href="#service">リフォーム</a>
            <a href="#works">施工事例</a>
            <a href="#voice">お客様の声</a>
            <a href="#company">会社情報</a>
            <a href="#faq">よくある質問</a>
            <a href="#contact">ご相談・お問い合わせ</a>
          </nav>
        </details>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <Image
            className="hero-image"
            src="/hero-living.png"
            alt="丁寧にリフォームされた明るい住まい"
            fill
            priority
            sizes="100vw"
          />
          <div className="hero-shade" />
          <div className="hero-copy">
            <p>住まいの安心を、まじめに、丁寧に。</p>
            <h1 id="hero-title">ご予算も、仕上がりも。<br />納得できるリフォームを。</h1>
          </div>
          <a className="hero-button" href="#works">
            リフォームの施工事例を見る
            <ArrowRight aria-hidden="true" />
          </a>
          <div className="scroll-guide" aria-hidden="true">
            <span>scroll</span>
            <i />
          </div>
        </section>

        <section className="intro" aria-label="やっとる建設の考え方">
          <p>きれいにするだけでなく、<br />これからも安心して暮らせる住まいへ。</p>
          <p>分かりやすい説明と、無理のないご提案で、<br />工事前の不安から施工後まで支えます。</p>
        </section>

        <section id="strength" className="feature-panel">
          <Image
            src="/service-exterior.png"
            alt="丁寧に外壁と屋根を整えた住宅"
            fill
            sizes="(max-width: 768px) 100vw, 86vw"
          />
          <div className="feature-overlay" />
          <div className="feature-content">
            <p className="feature-lead">やっとる建設のリフォーム</p>
            <h2>相談しやすく、仕事はきっちり。</h2>
            <p>ご希望とご予算を最初に整理し、必要な工事と選べる方法を丁寧にご説明します。工事が終わったあとも、住まいのことを気軽に相談できる関係を大切にしています。</p>
            <a className="white-button" href="#first">
              私たちの考え方を知る
              <SectionArrow />
            </a>
          </div>
        </section>

        <section id="first" className="first-guide section-wrap">
          <div className="first-visual">
            <Image
              src="/hero-living.png"
              alt="暮らしに合わせて整えた住まい"
              fill
              sizes="(max-width: 800px) 100vw, 48vw"
            />
          </div>
          <div className="first-copy">
            <p className="section-index">01</p>
            <h2>はじめてのリフォーム</h2>
            <p>リフォームは、内容によって費用や工事期間、工事中の暮らし方が異なります。まずは気になる場所と、どんな暮らしにしたいかをお聞かせください。</p>
            <ol className="flow-list">
              <li><span>1</span>ご相談・現地調査</li>
              <li><span>2</span>工事内容とお見積もりのご説明</li>
              <li><span>3</span>ご納得後に施工・完了確認</li>
              <li><span>4</span>施工後のアフターフォロー</li>
            </ol>
            <a className="line-button" href="#contact">
              まずは住まいのことを相談する
              <SectionArrow />
            </a>
          </div>
        </section>

        <section id="service" className="services section-wrap">
          <div className="section-heading">
            <p className="section-index">02</p>
            <h2>おすすめのリフォーム</h2>
            <p>住まいのお悩みが多い3つの工事を中心に、戸建てリフォーム全般に対応しています。</p>
          </div>
          <div className="service-grid">
            {services.map((service, index) => (
              <article className="service-card" key={service.title}>
                <a href="#contact" className="service-image">
                  <Image
                    src={service.image}
                    alt={service.alt}
                    fill
                    sizes="(max-width: 800px) 100vw, 33vw"
                    style={{ objectPosition: index === 1 ? "70% 18%" : "center" }}
                  />
                  <span>{service.title}</span>
                  <SectionArrow />
                </a>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="works" className="works section-wrap">
          <div className="section-heading centered">
            <p className="section-index">03</p>
            <h2>リフォーム施工事例</h2>
            <p>ご要望とご予算に向き合い、一つひとつ丁寧に形にした事例をご紹介します。</p>
          </div>
          <div className="works-grid">
            {works.map((work) => (
              <article className="work-card" key={work.title}>
                <a href="#contact" className="work-image">
                  <Image src={work.image} alt={work.alt} fill sizes="(max-width: 760px) 100vw, 33vw" />
                </a>
                <h3>{work.title}</h3>
                <ul aria-label="施工事例の分類">
                  {work.meta.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
          <a className="wide-button" href="#contact">
            施工事例をもっと見る
            <SectionArrow />
          </a>
        </section>

        <section id="voice" className="voices">
          <div className="section-wrap">
            <div className="section-heading centered light">
              <p className="section-index">04</p>
              <h2>お客様の声</h2>
              <p>工事を終えたお客様からいただいた声をご紹介します。</p>
            </div>
            <div className="voice-grid">
              {voices.map((voice) => (
                <article key={voice.name}>
                  <p>「{voice.body}」</p>
                  <span>{voice.name}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="consultation section-wrap">
          <div className="consult-image">
            <Image src="/service-kitchen.png" alt="リフォーム後の明るいキッチン" fill sizes="(max-width: 800px) 100vw, 46vw" />
          </div>
          <div className="consult-copy">
            <h2>リフォームの<br />ご相談・お問い合わせ</h2>
            <p>費用や工事内容で気になることがあれば、まずはご相談ください。まだ希望がまとまっていない段階でも大丈夫です。</p>
            <div className="consult-actions">
              <a className="primary-action" href="mailto:info@yattoru-kensetsu.jp">
                <Mail aria-hidden="true" />
                メールで相談する
                <SectionArrow />
              </a>
              <a className="secondary-action" href="tel:0921234567">
                <Phone aria-hidden="true" />
                092-123-4567
              </a>
            </div>
            <p className="hours">受付時間 9:00〜18:00／日曜・祝日定休</p>
          </div>
        </section>

        <section className="info-area section-wrap">
          <div id="company" className="company-card">
            <p className="section-index">05</p>
            <h2>会社情報</h2>
            <p>福岡で、住まいの安心を支える地域のリフォーム会社です。</p>
            <dl>
              <div><dt>会社名</dt><dd>やっとる建設株式会社</dd></div>
              <div><dt>代表者</dt><dd>山田 太郎</dd></div>
              <div><dt>設立</dt><dd>2012年</dd></div>
              <div><dt>所在地</dt><dd>福岡県福岡市博多区博多駅前○丁目○-○</dd></div>
              <div><dt>建設業許可</dt><dd>福岡県知事許可（般-4）第12345号</dd></div>
            </dl>
          </div>

          <div id="faq" className="faq-card">
            <p className="section-index">06</p>
            <h2>よくある質問</h2>
            <Accordion type="single" collapsible className="faq-list">
              {faqs.map((faq, index) => (
                <AccordionItem value={`faq-${index}`} key={faq.question}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="news section-wrap">
          <div className="news-heading">
            <p className="section-index">07</p>
            <h2>お知らせ</h2>
          </div>
          <div className="news-list">
            <a href="#contact"><time>2026.08.31</time><span>ホームページを公開しました。</span><SectionArrow /></a>
            <a href="#contact"><time>2026.08.20</time><span>住まいのリフォーム相談を受け付けています。</span><SectionArrow /></a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main section-wrap">
          <div>
            <a className="brand footer-brand" href="#top">
              <BrandMark />
              <span className="brand-text">
                <strong>やっとる建設</strong>
                <small>YATTORU CONSTRUCTION</small>
              </span>
            </a>
            <p className="footer-message">住まいの安心を、まじめに、丁寧に。</p>
          </div>
          <div className="footer-contact">
            <p><MapPin aria-hidden="true" />福岡県福岡市博多区博多駅前○丁目○-○</p>
            <p><Phone aria-hidden="true" /><a href="tel:0921234567">092-123-4567</a></p>
            <p><Clock3 aria-hidden="true" />9:00〜18:00（日曜・祝日定休）</p>
          </div>
          <nav aria-label="フッターナビゲーション">
            <a href="#strength">私たちの特長</a>
            <a href="#service">リフォーム</a>
            <a href="#works">施工事例</a>
            <a href="#voice">お客様の声</a>
            <a href="#company">会社情報</a>
            <a href="#faq">よくある質問</a>
          </nav>
        </div>
        <div className="footer-bottom section-wrap">
          <div><a href="#top">プライバシーポリシー</a><a href="#top">利用規約</a></div>
          <small>© YATTORU CONSTRUCTION CO., LTD.</small>
        </div>
      </footer>

      <aside className="fixed-consult" aria-label="お問い合わせ窓口">
        <p>ご自宅で気になるところがあれば、<br />まずはご相談を。</p>
        <a className="fixed-main" href="mailto:info@yattoru-kensetsu.jp">ご相談・お問い合わせ<Mail aria-hidden="true" /></a>
        <a className="fixed-sub" href="tel:0921234567">電話で相談する<ChevronRight aria-hidden="true" /></a>
      </aside>
    </div>
  );
}
