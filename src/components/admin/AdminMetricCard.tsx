import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: "green" | "red" | "blue" | "dark";
};

export default function AdminMetricCard({ title, value, note, icon: Icon, tone = "green" }: Props) {
  return (
    <article className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex items-start justify-between gap-4">
        <p className="font-semibold text-slate-600">{title}</p>
        <span className={cn("rounded-lg p-3", toneClass(tone))}><Icon className="size-5" /></span>
      </div>
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-3 text-sm font-semibold text-slate-500">{note}</p>
    </article>
  );
}

const toneClass = (tone: Props["tone"]) => {
  if (tone === "red") return "bg-red-100 text-red-700";
  if (tone === "blue") return "bg-blue-100 text-slate-900";
  if (tone === "dark") return "bg-slate-900 text-white";
  return "bg-emerald-100 text-emerald-800";
};
