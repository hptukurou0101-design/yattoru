import type { Metadata } from "next";
import { WorkDetail } from "@/components/work-detail";
import { workExamples } from "@/lib/site-data";
export const metadata: Metadata = {
  title: "外壁と屋根を整えた住まい｜施工事例｜やっとる建設",
  description: "外壁と屋根を整え、これからも安心して暮らせる住まいへ。福岡市のやっとる建設株式会社。",
};
export default function Page() { return <WorkDetail work={workExamples[1]} />; }
