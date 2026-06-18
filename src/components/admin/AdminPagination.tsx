"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminMeta } from "@/types/admin.type";

export default function AdminPagination({ meta, onPageChange }: { meta: AdminMeta; onPageChange: (page: number) => void }) {
  const from = meta.total ? (meta.page - 1) * meta.limit + 1 : 0;
  const to = Math.min(meta.page * meta.limit, meta.total);
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-slate-600">Showing {from}-{to} of {meta.total} entries</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-lg" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}><ChevronLeft /></Button>
        <span className="rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white">{meta.page}</span>
        <Button variant="outline" size="icon-lg" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}><ChevronRight /></Button>
      </div>
    </div>
  );
}
