"use client";

import { Search } from "lucide-react";
import type { AdminOptions } from "@/types/admin.type";

type Props = {
  search: string;
  categoryId: string;
  storeId: string;
  stockStatus?: string;
  options: AdminOptions;
  showStockFilter?: boolean;
  onChange: (name: string, value: string) => void;
};

export default function AdminFilterBar({ search, categoryId, storeId, stockStatus = "all", options, showStockFilter = true, onChange }: Props) {
  return (
    <div className={`grid gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 ${showStockFilter ? "lg:grid-cols-[1fr_180px_180px_160px]" : "lg:grid-cols-[1fr_180px_180px]"}`}>
      <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4">
        <Search className="size-5 text-slate-500" />
        <input value={search} onChange={(event) => onChange("search", event.target.value)} className="h-12 w-full bg-transparent outline-none" placeholder="Search by product name..." />
      </label>
      <Select value={categoryId} onChange={(value) => onChange("categoryId", value)} label="All Categories" items={options.categories} />
      <Select value={storeId} onChange={(value) => onChange("storeId", value)} label="All Stores" items={options.stores} />
      {showStockFilter && (
        <select value={stockStatus} onChange={(event) => onChange("stockStatus", event.target.value)} className="h-12 rounded-lg border border-slate-200 bg-white px-4">
          <option value="all">Status: All</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      )}
    </div>
  );
}

function Select({ value, label, items, onChange }: { value: string; label: string; items: AdminOptions["stores"]; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-lg border border-slate-200 bg-white px-4">
      <option value="">{label}</option>
      {items.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
    </select>
  );
}
