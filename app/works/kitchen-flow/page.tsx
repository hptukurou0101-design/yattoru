import type { Metadata } from "next";
import { WorkDetail } from "@/components/work-detail";
import { workExamples } from "@/lib/site-data";
export const metadata: Metadata = {
  title: "家事がしやすいキッチン｜施工事例｜やっとる建設",
  description: "毎日の家事がしやすい、すっきりとしたキッチン。福岡市のやっとる建設株式会社。",
};
export default function Page() { return <WorkDetail work={workExamples[2]} />; }
