"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { AdminMeta } from "@/types/admin.type";

export default function AdminPagination({ meta, onPageChange }: { meta: AdminMeta; onPageChange: (page: number) => void }) {
  const from = meta.total ? (meta.page - 1) * meta.limit + 1 : 0;
  const to = Math.min(meta.page * meta.limit, meta.total);
  const pages = getVisiblePages(meta.page, meta.totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-slate-600">Showing {from}-{to} of {meta.total} entries</p>
      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={(event) => { event.preventDefault(); if (meta.page > 1) onPageChange(meta.page - 1); }} aria-disabled={meta.page <= 1} className={meta.page <= 1 ? "pointer-events-none opacity-50" : ""} />
          </PaginationItem>
          {pages.map((page, index) => (
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}><PaginationEllipsis /></PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink href="#" isActive={page === meta.page} onClick={(event) => { event.preventDefault(); if (page !== meta.page) onPageChange(page); }}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          ))}
          <PaginationItem>
            <PaginationNext href="#" onClick={(event) => { event.preventDefault(); if (meta.page < meta.totalPages) onPageChange(meta.page + 1); }} aria-disabled={meta.page >= meta.totalPages} className={meta.page >= meta.totalPages ? "pointer-events-none opacity-50" : ""} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) pages.push("ellipsis");
  for (let current = start; current <= end; current += 1) pages.push(current);
  if (end < totalPages - 1) pages.push("ellipsis");
  pages.push(totalPages);

  return pages;
}
