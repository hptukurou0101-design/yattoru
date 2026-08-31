import type { Metadata } from "next";
import { WorkDetail } from "@/components/work-detail";
import { workExamples } from "@/lib/site-data";
export const metadata: Metadata = { title: "明るさと動線を見直したLDK｜施工事例｜やっとる建設" };
export default function Page() { return <WorkDetail work={workExamples[0]} />; }
