import type { Metadata } from "next";
import { ReformDetail } from "@/components/reform-detail";

export const metadata: Metadata = { title: "水まわりリフォーム｜やっとる建設" };

export default function WaterPage() {
  return <ReformDetail data={{
    title: "水まわりリフォーム",
    lead: "設備を替えるだけでなく、毎日の使いやすさから整えます。",
    image: "/service-kitchen.webp",
    alt: "使いやすくリフォームしたキッチン",
    position: "center",
    introTitle: <>キッチン・浴室・洗面・トイレを、<br />暮らしに合わせて使いやすく。</>,
    intro: "使いにくさの原因は、設備の古さだけとは限りません。収納、動線、お手入れ、段差や寒さなど、日々感じていることを伺い、必要な改善を考えます。",
    signsTitle: "このようなお悩みをご相談いただけます",
    signs: [["片付けにくいキッチン", "収納する物と調理中の動きを確認し、使いやすい配置を考えます。"], ["寒さや段差が気になる浴室", "断熱性、手すり、出入口の段差などをまとめて確認します。"], ["お手入れしにくい洗面・トイレ", "設備の機能だけでなく、床や壁、収納まで含めて整えます。"]],
    workTitle: "設備選びの前に、困っていることを整理します。",
    workText: "ショールームやカタログだけで決めず、現在の使い方や不便な点を確認します。設備本体、内装、配管、電気工事など必要な範囲を分けてお見積もりします。",
    steps: [{ title: "ご希望の確認", text: "使いにくい点、必要な機能、ご予算を伺います。" }, { title: "採寸・設備選び", text: "設置条件を確認し、設備と内装の組み合わせをご提案します。" }, { title: "工程のご説明", text: "使えない時間や工事中の過ごし方をご案内します。" }, { title: "施工・使い方のご案内", text: "完成後に設備の使い方とお手入れ方法をご説明します。" }],
  }} />;
}
