import { ChevronRight, Clock3, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
    </span>
  );
}

const navigation = [
  ["私たちの特長", "/features"],
  ["初めての方へ", "/first-time"],
  ["リフォーム", "/reform"],
  ["施工事例", "/works"],
  ["会社情報", "/company"],
  ["よくある質問", "/faq"],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="やっとる建設株式会社 トップへ">
        <BrandMark />
        <span className="brand-text">
          <strong>やっとる建設</strong>
          <small>YATTORU CONSTRUCTION</small>
        </span>
      </Link>

      <nav className="desktop-nav" aria-label="メインナビゲーション">
        {navigation.map(([label, href]) => (
          <a href={href} key={href}>{label}</a>
        ))}
      </nav>

      <a className="header-contact" href="/contact">ご相談・お問い合わせ</a>

      <details className="mobile-menu">
        <summary aria-label="メニューを開く">
          <span />
          <span />
          <span />
        </summary>
        <nav aria-label="モバイルナビゲーション">
          {navigation.map(([label, href]) => (
            <a href={href} key={href}>{label}</a>
          ))}
          <a href="/voices">お客様の声</a>
          <a href="/news">お知らせ</a>
          <a href="/contact">ご相談・お問い合わせ</a>
        </nav>
      </details>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main section-wrap">
        <div>
          <Link className="brand footer-brand" href="/">
            <BrandMark />
            <span className="brand-text">
              <strong>やっとる建設</strong>
              <small>YATTORU CONSTRUCTION</small>
            </span>
          </Link>
          <p className="footer-message">住まいの安心を、まじめに、丁寧に。</p>
        </div>
        <div className="footer-contact">
          <p><MapPin aria-hidden="true" />福岡県福岡市博多区博多駅前○丁目○-○</p>
          <p><Phone aria-hidden="true" /><a href="tel:0921234567">092-123-4567</a></p>
          <p><Clock3 aria-hidden="true" />9:00〜18:00（日曜・祝日定休）</p>
        </div>
        <nav aria-label="フッターナビゲーション">
          <a href="/features">私たちの特長</a>
          <a href="/first-time">初めての方へ</a>
          <a href="/reform">リフォーム</a>
          <a href="/works">施工事例</a>
          <a href="/voices">お客様の声</a>
          <a href="/company">会社情報</a>
          <a href="/faq">よくある質問</a>
          <a href="/news">お知らせ</a>
          <a href="/contact">お問い合わせ</a>
        </nav>
      </div>
      <div className="footer-bottom section-wrap">
        <div><a href="/privacy">プライバシーポリシー</a><a href="/terms">利用規約</a></div>
        <small>© YATTORU CONSTRUCTION CO., LTD.</small>
      </div>
    </footer>
  );
}

export function FixedConsult() {
  return (
    <aside className="fixed-consult" aria-label="お問い合わせ窓口">
      <p>ご自宅で気になるところがあれば、<br />まずはご相談を。</p>
      <a className="fixed-main" href="/contact">ご相談・お問い合わせ<Mail aria-hidden="true" /></a>
      <a className="fixed-sub" href="tel:0921234567">電話で相談する<ChevronRight aria-hidden="true" /></a>
    </aside>
  );
}

/**
 * モバイルメニュー（<details>）の補助動作。
 *
 * <details> は標準では Esc で閉じず、開いている間も背面がスクロールできてしまう。
 * 最小限の素の JavaScript で補う。フレームワークもハイドレーションも不要。
 * 全ページ共通で必要なため SiteFrame に含める。
 */
function MobileMenuBehavior() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function () {
  var menu = document.querySelector('.mobile-menu');
  if (!menu) return;
  var summary = menu.querySelector('summary');

  function lock(on) {
    // スクロールしているのは <html> なので、body だけを hidden にしても背面は止まらない
    document.documentElement.style.overflow = on ? 'hidden' : '';
    document.body.style.overflow = on ? 'hidden' : '';
  }

  menu.addEventListener('toggle', function () {
    lock(menu.open);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !menu.open) return;
    menu.open = false;
    lock(false);
    if (summary) summary.focus();
  });

  menu.querySelectorAll('nav a').forEach(function (a) {
    a.addEventListener('click', function () {
      menu.open = false;
      lock(false);
    });
  });
})();
`,
      }}
    />
  );
}

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <SiteHeader />
      {children}
      <SiteFooter />
      <FixedConsult />
      <MobileMenuBehavior />
    </div>
  );
}
