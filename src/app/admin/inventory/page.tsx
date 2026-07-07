"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeftRight, MoreVertical, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getAdminInventories, updateAdminInventoryStock, type InventoryAdminParams } from "@/services/admin/inventory-admin.service";
import { getAdminProductOptions } from "@/services/admin/product-admin.service";
import { getStockMutationStores, requestAdminStockMutation } from "@/services/admin/stock-mutation-admin.service";
import type { AdminInventory, AdminInventoryStats, AdminMeta, AdminOption, AdminOptions } from "@/types/admin.type";

const emptyMeta: AdminMeta = { page: 1, limit: 10, total: 0, totalPages: 1 };
const emptyOptions: AdminOptions = { categories: [], stores: [] };
const emptyStats: AdminInventoryStats = { lowStock: 0, outOfStock: 0 };

export default function AdminInventoryPage() {
  const user = useAuth((state) => state.user);
  const canAddStock = user?.role === "SUPER_ADMIN";
  const [filters, setFilters] = useState<InventoryAdminParams>({ page: 1, limit: 10, stockStatus: "all", sortBy: "updatedAt", sortOrder: "desc" });
  const [inventories, setInventories] = useState<AdminInventory[]>([]);
  const [options, setOptions] = useState(emptyOptions);
  const [stores, setStores] = useState<AdminOption[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [stats, setStats] = useState(emptyStats);
  const [requestTarget, setRequestTarget] = useState<AdminInventory | null>(null);
  const [stockTarget, setStockTarget] = useState<AdminInventory | null>(null);

  useEffect(() => { getAdminProductOptions().then(setOptions).catch(() => setOptions(emptyOptions)); }, []);
  useEffect(() => { getStockMutationStores().then(setStores).catch(() => setStores([])); }, []);
  useEffect(() => { loadInventories(filters, setInventories, setMeta, setStats); }, [filters]);
  const refresh = () => loadInventories(filters, setInventories, setMeta, setStats);

  return (
    <>
      <AdminPageHeader title="Inventory Management" subtitle="Monitor store stock and request product movement." />
      <section className="space-y-6 p-5">
        <InventoryMetrics stats={stats} />
        <AdminFilterBar search={filters.search ?? ""} categoryId={filters.categoryId ?? ""} storeId={filters.storeId ?? ""} stockStatus={filters.stockStatus ?? "all"} options={options} onChange={(name, value) => setFilters((old) => ({ ...old, [name]: value, page: 1 }))} />
        <InventoryTable inventories={inventories} canAddStock={canAddStock} onAddStock={setStockTarget} onRequest={setRequestTarget} />
        <AdminPagination meta={meta} onPageChange={(page) => setFilters((old) => ({ ...old, page }))} />
      </section>
      <RequestDialog key={requestTarget?.id ? `request-${requestTarget.id}` : "request-empty"} inventory={requestTarget} stores={stores} onClose={() => setRequestTarget(null)} />
      <AddStockDialog key={stockTarget?.id ? `add-stock-${stockTarget.id}` : "add-stock-empty"} inventory={stockTarget} onClose={() => setStockTarget(null)} onSaved={refresh} />
    </>
  );
}

function InventoryMetrics({ stats }: { stats: AdminInventoryStats }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <AdminMetricCard title="Low Stock Alerts" value={stats.lowStock.toLocaleString("id-ID")} note="Action needed" icon={AlertTriangle} tone="red" />
      <AdminMetricCard title="Out of Stock" value={stats.outOfStock.toLocaleString("id-ID")} note="Request stock soon" icon={MoreVertical} tone="dark" />
    </div>
  );
}

function InventoryTable({ inventories, canAddStock, onAddStock, onRequest }: { inventories: AdminInventory[]; canAddStock: boolean; onAddStock: (item: AdminInventory) => void; onRequest: (item: AdminInventory) => void }) {
  if (!inventories.length) return <p className="rounded-lg bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200">No inventory found.</p>;
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[880px] text-left">
        <thead className="bg-slate-50 uppercase tracking-[0.12em] text-slate-700"><tr><th className="px-5 py-4">Product</th><th>Location</th><th>Stock</th><th>Status</th><th className="px-5">Actions</th></tr></thead>
        <tbody>{inventories.map((item, index) => <InventoryRow item={item} canAddStock={canAddStock} onAddStock={onAddStock} onRequest={onRequest} key={item.id || index} />)}</tbody>
      </table>
    </div>
  );
}

function InventoryRow({ item, canAddStock, onAddStock, onRequest }: { item: AdminInventory; canAddStock: boolean; onAddStock: (item: AdminInventory) => void; onRequest: (item: AdminInventory) => void }) {
  const image = item.imageUrl ?? "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80";
  return (
    <tr className="border-t border-slate-100">
      <td className="px-5 py-5"><div className="flex items-center gap-4"><img src={image} alt={item.productName} className="size-14 rounded-lg object-cover" /><div><p className="font-black">{item.productName}</p><p className="text-slate-500">{item.categoryName}</p></div></div></td>
      <td>{item.storeName}</td><td className={cn("font-black", item.stock <= 20 && "text-red-700")}>{item.stock}</td>
      <td><StockBadge stock={item.stock} /></td>
      <td className="px-5">
        <div className="flex flex-wrap gap-2">
          {canAddStock && <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => onAddStock(item)}><PlusCircle /> Add Stock</Button>}
          <Button size="sm" className="bg-emerald-700" onClick={() => onRequest(item)}><ArrowLeftRight /> Request Stock</Button>
        </div>
      </td>
    </tr>
  );
}

function AddStockDialog({ inventory, onClose, onSaved }: { inventory: AdminInventory | null; onClose: () => void; onSaved: () => void }) {
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = () => {
    if (submitting) return;
    if (!inventory) return;
    if (!Number(quantity) || Number(quantity) < 1) return toast.error("Quantity must be greater than zero.");
    setSubmitting(true);
    updateAdminInventoryStock(inventory.id, { type: "IN", quantity: Number(quantity), notes })
      .then(() => { toast.success("Stock added."); onSaved(); onClose(); })
      .catch(() => toast.error("Failed to add stock."))
      .finally(() => setSubmitting(false));
  };
  return (
    <Dialog open={Boolean(inventory)} onOpenChange={(open) => !submitting && !open && onClose()}><DialogContent><DialogHeader><DialogTitle>Add Stock</DialogTitle></DialogHeader>
      <div className="grid gap-3 text-sm">
        <p className="rounded-lg bg-slate-50 p-3">{inventory?.productName} for <b>{inventory?.storeName}</b></p>
        <input className="input-admin" disabled={submitting} value={quantity} min={1} type="number" onChange={(event) => setQuantity(event.target.value)} />
        <textarea className="input-admin min-h-24" disabled={submitting} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Stock notes" />
      </div>
      <DialogFooter><Button variant="outline" disabled={submitting} onClick={onClose}>Cancel</Button><Button className="bg-emerald-700" disabled={submitting} onClick={submit}>{submitting ? "Saving..." : "Add Stock"}</Button></DialogFooter></DialogContent></Dialog>
  );
}

function RequestDialog({ inventory, stores, onClose }: { inventory: AdminInventory | null; stores: AdminOption[]; onClose: () => void }) {
  const [sourceStoreId, setSourceStoreId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sources = stores.filter((store) => store.id !== inventory?.storeId);
  const submit = () => {
    if (submitting) return;
    if (!inventory) return;
    if (!sourceStoreId) return toast.error("Source store is required.");
    if (!Number(quantity) || Number(quantity) < 1) return toast.error("Quantity must be greater than zero.");
    setSubmitting(true);
    requestAdminStockMutation({ productId: inventory.productId, sourceStoreId, destinationStoreId: inventory.storeId, quantity: Number(quantity), notes })
      .then(() => { toast.success("Stock request submitted."); onClose(); })
      .catch(() => toast.error("Failed to request stock."))
      .finally(() => setSubmitting(false));
  };
  return (
    <Dialog open={Boolean(inventory)} onOpenChange={(open) => !submitting && !open && onClose()}><DialogContent><DialogHeader><DialogTitle>Request Stock</DialogTitle></DialogHeader>
      <div className="grid gap-3 text-sm">
        <p className="rounded-lg bg-slate-50 p-3">{inventory?.productName} for <b>{inventory?.storeName}</b></p>
        <select className="input-admin" disabled={submitting} value={sourceStoreId} onChange={(event) => setSourceStoreId(event.target.value)}><option value="">Choose source store</option>{sources.map((store) => <option value={store.id} key={store.id}>{store.name}</option>)}</select>
        <input className="input-admin" disabled={submitting} value={quantity} min={1} type="number" onChange={(event) => setQuantity(event.target.value)} />
        <textarea className="input-admin min-h-24" disabled={submitting} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Request notes" />
      </div>
      <DialogFooter><Button variant="outline" disabled={submitting} onClick={onClose}>Cancel</Button><Button className="bg-emerald-700" disabled={submitting} onClick={submit}>{submitting ? "Submitting..." : "Submit Request"}</Button></DialogFooter></DialogContent></Dialog>
  );
}

function StockBadge({ stock }: { stock: number }) {
  const label = stock === 0 ? "Out of Stock" : stock <= 20 ? "Low Stock" : "In Stock";
  const color = stock === 0 ? "bg-slate-900 text-white" : stock <= 20 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800";
  return <span className={cn("rounded-full px-3 py-1 text-sm font-bold", color)}>{label}</span>;
}

function loadInventories(filters: InventoryAdminParams, setItems: (items: AdminInventory[]) => void, setMeta: (meta: AdminMeta) => void, setStats: (stats: AdminInventoryStats) => void) {
  getAdminInventories(filters)
    .then((result) => { setItems(result.data); setMeta(result.meta); setStats(result.stats); })
    .catch(() => { setStats(emptyStats); toast.error("Failed to load inventory."); });
}
