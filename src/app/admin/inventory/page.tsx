"use client";

import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { AlertTriangle, ClipboardCheck, MoreVertical, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getAdminProductOptions } from "@/services/admin/product-admin.service";
import { deleteAdminInventory, getAdminInventories, getAdminInventoryMutations, updateAdminInventoryStock, type InventoryAdminParams } from "@/services/admin/inventory-admin.service";
import type { AdminInventory, AdminMeta, AdminOptions, StockMutation } from "@/types/admin.type";

const emptyMeta: AdminMeta = { page: 1, limit: 10, total: 0, totalPages: 1 };
const emptyOptions: AdminOptions = { categories: [], stores: [] };

export default function AdminInventoryPage() {
  const readonly = useAuth((state) => state.user?.role === "STORE_ADMIN");
  const [filters, setFilters] = useState<InventoryAdminParams>({ page: 1, limit: 10, stockStatus: "all", sortBy: "updatedAt", sortOrder: "desc" });
  const [inventories, setInventories] = useState<AdminInventory[]>([]);
  const [options, setOptions] = useState(emptyOptions);
  const [meta, setMeta] = useState(emptyMeta);
  const [stockTarget, setStockTarget] = useState<AdminInventory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminInventory | null>(null);
  const [journalTarget, setJournalTarget] = useState<AdminInventory | null>(null);

  useEffect(() => { getAdminProductOptions().then(setOptions).catch(() => setOptions(emptyOptions)); }, []);
  useEffect(() => { loadInventories(filters, setInventories, setMeta); }, [filters]);

  return (
    <>
      <AdminPageHeader title="Inventory Management" subtitle="Monitor stock levels across all active fulfillment centers." actions={!readonly && <Button className="bg-emerald-700"><PlusCircle /> Update Stock</Button>} />
      <section className="space-y-6 p-5">
        <InventoryMetrics inventories={inventories} />
        <AdminFilterBar search={filters.search ?? ""} categoryId={filters.categoryId ?? ""} storeId={filters.storeId ?? ""} stockStatus={filters.stockStatus ?? "all"} options={options} onChange={(name, value) => setFilters((old) => ({ ...old, [name]: value, page: 1 }))} />
        <InventoryTable inventories={inventories} readonly={readonly} onUpdate={setStockTarget} onDelete={setDeleteTarget} onJournal={setJournalTarget} />
        <AdminPagination meta={meta} onPageChange={(page) => setFilters((old) => ({ ...old, page }))} />
      </section>
      <StockDialog inventory={stockTarget} onClose={() => setStockTarget(null)} onSaved={() => setFilters((old) => ({ ...old }))} />
      <JournalDialog inventory={journalTarget} onClose={() => setJournalTarget(null)} />
      <ConfirmActionDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)} title="Delete inventory?" description={`This removes stock data for ${deleteTarget?.productName ?? "this product"}.`} confirmText="Delete" onConfirm={() => deleteTarget && removeInventory(deleteTarget, setDeleteTarget, setFilters)} />
    </>
  );
}

function InventoryMetrics({ inventories }: { inventories: AdminInventory[] }) {
  const low = inventories.filter((item) => item.stock > 0 && item.stock <= 20).length;
  const out = inventories.filter((item) => item.stock === 0).length;
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <AdminMetricCard title="Total SKUs" value={String(inventories.length)} note="+12 this week" icon={ClipboardCheck} tone="blue" />
      <AdminMetricCard title="Low Stock Alerts" value={String(low)} note="Action needed" icon={AlertTriangle} tone="red" />
      <AdminMetricCard title="Out of Stock" value={String(out)} note="Critically low" icon={MoreVertical} tone="dark" />
    </div>
  );
}

function InventoryTable({ inventories, readonly, onUpdate, onDelete, onJournal }: { inventories: AdminInventory[]; readonly: boolean; onUpdate: (item: AdminInventory) => void; onDelete: (item: AdminInventory) => void; onJournal: (item: AdminInventory) => void }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[880px] text-left"><thead className="bg-slate-50 uppercase tracking-[0.12em] text-slate-700"><tr><th className="px-5 py-4">Product</th><th>Location</th><th>Stock</th><th>Status</th><th className="px-5">Actions</th></tr></thead>
        <tbody>{inventories.map((item) => <InventoryRow item={item} readonly={readonly} onUpdate={onUpdate} onDelete={onDelete} onJournal={onJournal} key={item.id} />)}</tbody></table>
    </div>
  );
}

function InventoryRow({ item, readonly, onUpdate, onDelete, onJournal }: { item: AdminInventory; readonly: boolean; onUpdate: (item: AdminInventory) => void; onDelete: (item: AdminInventory) => void; onJournal: (item: AdminInventory) => void }) {
  const image = item.imageUrl ?? "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80";
  return (
    <tr className="border-t border-slate-100"><td className="px-5 py-5"><div className="flex items-center gap-4"><img src={image} alt={item.productName} className="size-14 rounded-lg object-cover" /><div><p className="font-black">{item.productName}</p><p className="text-slate-500">{item.categoryName}</p></div></div></td><td>{item.storeName}</td><td className={cn("font-black", item.stock <= 20 && "text-red-700")}>{item.stock}</td><td><StockBadge stock={item.stock} /></td><td className="px-5"><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => onJournal(item)}>Journal</Button>{!readonly && <><Button size="sm" className="bg-emerald-700" onClick={() => onUpdate(item)}>Update</Button><Button variant="destructive" size="icon-sm" onClick={() => onDelete(item)}><Trash2 /></Button></>}</div></td></tr>
  );
}

function StockBadge({ stock }: { stock: number }) {
  const label = stock === 0 ? "Out of Stock" : stock <= 20 ? "Low Stock" : "In Stock";
  const color = stock === 0 ? "bg-slate-900 text-white" : stock <= 20 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800";
  return <span className={cn("rounded-full px-3 py-1 text-sm font-bold", color)}>{label}</span>;
}

function StockDialog({ inventory, onClose, onSaved }: { inventory: AdminInventory | null; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const save = () => {
    if (!Number(quantity) || Number(quantity) < 1) return toast.error("Quantity must be greater than zero.");
    updateAdminInventoryStock(inventory!.id, { type, quantity: Number(quantity), notes }).then(() => { toast.success("Stock journal created."); onSaved(); onClose(); }).catch(() => toast.error("Failed to update stock."));
  };
  return (
    <Dialog open={Boolean(inventory)} onOpenChange={() => onClose()}><DialogContent><DialogHeader><DialogTitle>Update Stock</DialogTitle></DialogHeader>
      <div className="grid gap-3"><select className="input-admin" value={type} onChange={(e) => setType(e.target.value as "IN" | "OUT")}><option value="IN">Add Stock</option><option value="OUT">Reduce Stock</option></select><input className="input-admin" value={quantity} min={1} type="number" onChange={(e) => setQuantity(e.target.value)} /><textarea className="input-admin min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Journal notes" /></div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button className="bg-emerald-700" onClick={save}>Create Journal</Button></DialogFooter></DialogContent></Dialog>
  );
}

function JournalDialog({ inventory, onClose }: { inventory: AdminInventory | null; onClose: () => void }) {
  const [items, setItems] = useState<StockMutation[]>([]);
  useEffect(() => { if (inventory) getAdminInventoryMutations(inventory.id).then(setItems).catch(() => setItems([])); }, [inventory]);
  return <Dialog open={Boolean(inventory)} onOpenChange={() => onClose()}><DialogContent><DialogHeader><DialogTitle>Stock Journal</DialogTitle></DialogHeader><div className="space-y-3">{items.length ? items.map((item) => <p className="rounded-lg bg-slate-50 p-3 text-sm" key={item.id}><b>{item.type}</b> {item.quantity} units - {item.notes ?? "No notes"}</p>) : "No journal yet."}</div></DialogContent></Dialog>;
}

function loadInventories(filters: InventoryAdminParams, setItems: (items: AdminInventory[]) => void, setMeta: (meta: AdminMeta) => void) {
  getAdminInventories(filters).then((result) => { setItems(result.data); setMeta(result.meta); }).catch(() => toast.error("Failed to load inventory."));
}

function removeInventory(item: AdminInventory, close: (value: null) => void, setFilters: Dispatch<SetStateAction<InventoryAdminParams>>) {
  deleteAdminInventory(item.id).then(() => { toast.success("Inventory deleted."); close(null); setFilters((old) => ({ ...old })); }).catch(() => toast.error("Failed to delete inventory."));
}
