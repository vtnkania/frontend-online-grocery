"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, PackageCheck, Search, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { acceptAdminStockMutation, getAdminStockMutations, getStockMutationStores, receiveAdminStockMutation, rejectAdminStockMutation, shipAdminStockMutation, type StockMutationParams } from "@/services/admin/stock-mutation-admin.service";
import type { AdminMeta, AdminOption, AdminStockMutation, StockMutationStatus } from "@/types/admin.type";

const emptyMeta: AdminMeta = { page: 1, limit: 10, total: 0, totalPages: 1 };
type ActionName = "accept" | "reject" | "ship" | "receive";

export default function AdminStockMutationPage() {
  const [filters, setFilters] = useState<StockMutationParams>({ page: 1, limit: 10, status: "all", sortBy: "createdAt", sortOrder: "desc" });
  const [items, setItems] = useState<AdminStockMutation[]>([]);
  const [stores, setStores] = useState<AdminOption[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [target, setTarget] = useState<{ item: AdminStockMutation; action: ActionName } | null>(null);

  useEffect(() => { getStockMutationStores().then(setStores).catch(() => setStores([])); }, []);
  useEffect(() => { loadMutations(filters, setItems, setMeta); }, [filters]);
  const refresh = () => setFilters((old) => ({ ...old }));

  return (
    <>
      <AdminPageHeader title="Stock Mutation" subtitle="Approve, ship, and receive stock movement requests." />
      <section className="space-y-6 p-5">
        <MutationFilters filters={filters} stores={stores} onChange={(name, value) => setFilters((old) => ({ ...old, [name]: value, page: 1 }))} />
        <MutationTable items={items} onAction={(item, action) => setTarget({ item, action })} />
        <AdminPagination meta={meta} onPageChange={(page) => setFilters((old) => ({ ...old, page }))} />
      </section>
      <ActionDialog target={target} onClose={() => setTarget(null)} onDone={refresh} />
    </>
  );
}

function MutationFilters({ filters, stores, onChange }: { filters: StockMutationParams; stores: AdminOption[]; onChange: (name: keyof StockMutationParams, value: string) => void }) {
  return (
    <div className="grid gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:grid-cols-[1fr_160px_180px_180px]">
      <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4"><Search className="size-5 text-slate-500" /><input value={filters.search ?? ""} onChange={(e) => onChange("search", e.target.value)} className="h-12 w-full bg-transparent outline-none" placeholder="Search product..." /></label>
      <select value={filters.status ?? "all"} onChange={(e) => onChange("status", e.target.value)} className="input-admin"><option value="all">All Status</option>{["REQUESTED", "REJECTED", "ACCEPTED", "SHIPPED", "RECEIVED"].map((status) => <option value={status} key={status}>{status}</option>)}</select>
      <StoreSelect label="Source store" value={filters.sourceStoreId ?? ""} stores={stores} onChange={(value) => onChange("sourceStoreId", value)} />
      <StoreSelect label="Destination store" value={filters.destinationStoreId ?? ""} stores={stores} onChange={(value) => onChange("destinationStoreId", value)} />
    </div>
  );
}

function StoreSelect({ label, value, stores, onChange }: { label: string; value: string; stores: AdminOption[]; onChange: (value: string) => void }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="input-admin"><option value="">{label}</option>{stores.map((store) => <option value={store.id} key={store.id}>{store.name}</option>)}</select>;
}

function MutationTable({ items, onAction }: { items: AdminStockMutation[]; onAction: (item: AdminStockMutation, action: ActionName) => void }) {
  if (!items.length) return <p className="rounded-lg bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200">No stock mutation requests found.</p>;
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[1100px] text-left">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-700"><tr><th className="px-5 py-4">Date</th><th>Product</th><th>From</th><th>To</th><th>Qty</th><th>Status</th><th>Requester</th><th className="px-5">Actions</th></tr></thead>
        <tbody>{items.map((item) => <MutationRow item={item} onAction={onAction} key={item.id} />)}</tbody>
      </table>
    </div>
  );
}

function MutationRow({ item, onAction }: { item: AdminStockMutation; onAction: (item: AdminStockMutation, action: ActionName) => void }) {
  const image = item.imageUrl ?? "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80";
  return (
    <tr className="border-t border-slate-100">
      <td className="px-5 py-4 text-sm text-slate-600">{new Date(item.createdAt).toLocaleDateString("id-ID")}</td>
      <td><div className="flex items-center gap-3 py-3"><img src={image} alt={item.productName} className="size-12 rounded-lg object-cover" /><div><p className="font-black">{item.productName}</p><p className="text-xs text-slate-500">{item.categoryName}</p></div></div></td>
      <td>{item.sourceStoreName}</td><td>{item.destinationStoreName ?? "-"}</td><td className="font-black">{item.quantity}</td>
      <td><StatusBadge status={item.status} /></td><td className="max-w-44 truncate text-sm">{item.requestedBy?.name ?? item.requestedBy?.email ?? "-"}</td>
      <td className="px-5"><div className="flex flex-wrap gap-2"><ActionButtons item={item} onAction={onAction} /></div></td>
    </tr>
  );
}

function ActionButtons({ item, onAction }: { item: AdminStockMutation; onAction: (item: AdminStockMutation, action: ActionName) => void }) {
  return (
    <>
      {item.permissions.canAccept && <Button size="sm" className="bg-emerald-700" onClick={() => onAction(item, "accept")}><CheckCircle2 /> Accept</Button>}
      {item.permissions.canReject && <Button size="sm" variant="destructive" onClick={() => onAction(item, "reject")}><XCircle /> Reject</Button>}
      {item.permissions.canShip && <Button size="sm" className="bg-blue-700" onClick={() => onAction(item, "ship")}><Send /> Confirm Shipped</Button>}
      {item.permissions.canReceive && <Button size="sm" className="bg-emerald-700" onClick={() => onAction(item, "receive")}><PackageCheck /> Confirm Received</Button>}
    </>
  );
}

function StatusBadge({ status }: { status: StockMutationStatus }) {
  const color = { REQUESTED: "bg-blue-100 text-blue-800", ACCEPTED: "bg-emerald-100 text-emerald-800", SHIPPED: "bg-amber-100 text-amber-800", RECEIVED: "bg-slate-900 text-white", REJECTED: "bg-red-100 text-red-800" }[status];
  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", color)}>{status}</span>;
}

function ActionDialog({ target, onClose, onDone }: { target: { item: AdminStockMutation; action: ActionName } | null; onClose: () => void; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const runAction = () => {
    if (!target) return;
    setLoading(true);
    actionMap[target.action](target.item.id).then(() => { toast.success("Stock mutation updated."); onDone(); onClose(); }).catch(() => toast.error("Failed to update stock mutation.")).finally(() => setLoading(false));
  };
  return <ConfirmActionDialog open={Boolean(target)} onOpenChange={onClose} loading={loading} title={`${label(target?.action)} stock request?`} description={`${target?.item.productName ?? "This product"} will move through the ${target?.action ?? ""} step.`} confirmText={label(target?.action)} onConfirm={runAction} />;
}

const actionMap = { accept: acceptAdminStockMutation, reject: rejectAdminStockMutation, ship: shipAdminStockMutation, receive: receiveAdminStockMutation };
const label = (action?: ActionName) => ({ accept: "Accept", reject: "Reject", ship: "Confirm Shipped", receive: "Confirm Received" }[action ?? "accept"]);

function loadMutations(filters: StockMutationParams, setItems: (items: AdminStockMutation[]) => void, setMeta: (meta: AdminMeta) => void) {
  getAdminStockMutations(filters).then((result) => { setItems(result.data); setMeta(result.meta); }).catch(() => toast.error("Failed to load stock mutations."));
}
