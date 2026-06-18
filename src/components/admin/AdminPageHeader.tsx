import type { ReactNode } from "react";

export default function AdminPageHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-[#f6f8fd] px-5 py-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-black text-slate-950">{title}</h1>
        <p className="mt-1 text-slate-600">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
