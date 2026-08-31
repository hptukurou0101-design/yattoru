import type { Metadata } from "next";
import { WorkDetail } from "@/components/work-detail";
import { workExamples } from "@/lib/site-data";
export const metadata: Metadata = {
  title: "明るさと動線を見直したLDK｜施工事例｜やっとる建設",
  description: "明るさと動線を見直した、家族が集まる⁠LDK。福岡市のやっとる建設株式会社。",
};
export default function Page() { return <WorkDetail work={workExamples[0]} />; }
