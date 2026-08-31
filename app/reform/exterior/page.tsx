import type { Metadata } from "next";
import { ReformDetail } from "@/components/reform-detail";

export const metadata: Metadata = { title: "外壁塗装｜やっとる建設" };

export default function ExteriorPage() {
  return <ReformDetail data={{
    title: "外壁塗装",
    lead: "見た目を整えるだけでなく、雨や紫外線から住まいを守ります。",
    image: "/service-exterior.png",
    alt: "外壁塗装後の戸建て住宅",
    position: "center 58%",
    introTitle: <>今の状態を確かめて、<br />必要な補修と塗装を考えます。</>,
    intro: "外壁の色あせやひび割れは、住まいからのサインです。劣化の程度や下地の状態を確認し、塗装だけでよい箇所と補修が必要な箇所をご説明します。",
    signsTitle: "このような変化が気になったらご相談ください",
    signs: [["色あせ・つやの低下", "日差しや雨の影響で、以前より色が薄く見える。"], ["触ると白い粉が付く", "塗膜の劣化が進み、防水性が低下している可能性があります。"], ["ひび割れ・塗膜のはがれ", "水が入り込む前に、ひびの幅や下地の状態を確認します。"]],
    workTitle: "補修から仕上げまで、工程をご説明します。",
    workText: "高圧洗浄、下地補修、養生、下塗り・中塗り・上塗りなど、必要な工程を建物の状態に合わせて組み立てます。色だけでなく、塗料の特徴や耐久性も比較しながら選べます。",
    steps: [{ title: "現地確認", text: "外壁全体と目地、付帯部分の状態を確認します。" }, { title: "補修・塗料のご提案", text: "必要な補修範囲と塗料の選択肢をご説明します。" }, { title: "洗浄・下地処理", text: "汚れを落とし、ひびや目地などを整えます。" }, { title: "塗装・完成確認", text: "工程ごとに塗り重ね、仕上がりを一緒に確認します。" }],
  }} />;
}
