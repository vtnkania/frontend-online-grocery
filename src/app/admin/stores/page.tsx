"use client";

import { FormEvent, useEffect, useState } from "react";
import { Edit, MapPin, PlusCircle, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createAdminStore, deleteAdminStore, getAdminStores, getStoreManagers, updateAdminStore, type StoreAdminParams, type StoreBody } from "@/services/admin/store-admin.service";
import type { AdminMeta, AdminStore, StoreManager, StoreType } from "@/types/admin.type";

const emptyMeta: AdminMeta = { page: 1, limit: 10, total: 0, totalPages: 1 };
const initialForm = { name: "", address: "", latitude: "", longitude: "", type: "CABANG" as StoreType, managerUserId: "" };

export default function AdminStoresPage() {
  const [filters, setFilters] = useState<StoreAdminParams>({ page: 1, limit: 10, type: "all", sortBy: "createdAt", sortOrder: "desc" });
  const [items, setItems] = useState<AdminStore[]>([]);
  const [managers, setManagers] = useState<StoreManager[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [formTarget, setFormTarget] = useState<AdminStore | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminStore | null>(null);

  useEffect(() => { getStoreManagers().then(setManagers).catch(() => setManagers([])); }, []);
  useEffect(() => { loadStores(filters, setItems, setMeta); }, [filters]);
  const refresh = () => setFilters((old) => ({ ...old }));

  return (
    <>
      <AdminPageHeader title="Store Management" subtitle="Manage warehouse, branches, and assigned store admins." actions={<Button className="bg-emerald-700" onClick={() => setFormTarget("new")}><PlusCircle /> Add Store</Button>} />
      <section className="space-y-6 p-5">
        <StoreFilters filters={filters} onChange={(name, value) => setFilters((old) => ({ ...old, [name]: value, page: 1 }))} />
        <StoreTable items={items} onEdit={setFormTarget} onDelete={setDeleteTarget} />
        <AdminPagination meta={meta} onPageChange={(page) => setFilters((old) => ({ ...old, page }))} />
      </section>
      <StoreDialog key={formTarget === "new" ? "new" : formTarget?.id ?? "empty"} target={formTarget} managers={managers} onClose={() => setFormTarget(null)} onSaved={refresh} />
      <ConfirmActionDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)} title="Delete store?" description={`This will remove ${deleteTarget?.name ?? "this store"} from active admin data.`} confirmText="Delete" onConfirm={() => deleteTarget && removeStore(deleteTarget, setDeleteTarget, refresh)} />
    </>
  );
}

function StoreFilters({ filters, onChange }: { filters: StoreAdminParams; onChange: (name: keyof StoreAdminParams, value: string) => void }) {
  return (
    <div className="grid gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-[1fr_160px_160px]">
      <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4"><Search className="size-5 text-slate-500" /><input className="h-12 w-full bg-transparent outline-none" value={filters.search ?? ""} onChange={(e) => onChange("search", e.target.value)} placeholder="Search stores..." /></label>
      <select className="input-admin" value={filters.type ?? "all"} onChange={(e) => onChange("type", e.target.value)}><option value="all">All Types</option><option value="UTAMA">Utama</option><option value="CABANG">Cabang</option></select>
      <select className="input-admin" value={filters.sortOrder ?? "desc"} onChange={(e) => onChange("sortOrder", e.target.value)}><option value="desc">Newest first</option><option value="asc">Oldest first</option></select>
    </div>
  );
}

function StoreTable({ items, onEdit, onDelete }: { items: AdminStore[]; onEdit: (item: AdminStore) => void; onDelete: (item: AdminStore) => void }) {
  if (!items.length) return <p className="rounded-lg bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200">No stores found.</p>;
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[920px] text-left">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-700"><tr><th className="px-5 py-4">Store</th><th>Type</th><th>Manager</th><th>Coordinates</th><th className="px-5">Actions</th></tr></thead>
        <tbody>{items.map((item) => <tr className="border-t border-slate-100" key={item.id}><td className="px-5 py-4"><div className="flex gap-3"><MapPin className="mt-1 size-5 text-emerald-700" /><div><p className="font-black">{item.name}</p><p className="max-w-md text-sm text-slate-500">{item.address}</p></div></div></td><td><b>{item.type}</b></td><td>{item.manager?.name ?? item.manager?.email ?? "-"}</td><td className="text-sm text-slate-600">{item.latitude}, {item.longitude}</td><td className="px-5"><div className="flex gap-2"><Button size="icon-sm" variant="outline" onClick={() => onEdit(item)}><Edit /></Button><Button size="icon-sm" variant="destructive" onClick={() => onDelete(item)}><Trash2 /></Button></div></td></tr>)}</tbody>
      </table>
    </div>
  );
}

function StoreDialog({ target, managers, onClose, onSaved }: { target: AdminStore | "new" | null; managers: StoreManager[]; onClose: () => void; onSaved: () => void }) {
  const editing = target && target !== "new" ? target : null;
  const [form, setForm] = useState(editing ? storeToForm(editing) : initialForm);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = validateStoreForm(form);
    if (typeof body === "string") return toast.error(body);
    const action = editing ? updateAdminStore(editing.id, body) : createAdminStore(body);
    action.then(() => { toast.success("Store saved."); onSaved(); onClose(); }).catch(() => toast.error("Failed to save store."));
  };
  return (
    <Dialog open={Boolean(target)} onOpenChange={onClose}><DialogContent><DialogHeader><DialogTitle>{editing ? "Edit Store" : "Add Store"}</DialogTitle></DialogHeader>
      <form className="grid gap-3" onSubmit={submit}>
        <input className="input-admin" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Store name" />
        <textarea className="input-admin min-h-24" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
        <div className="grid gap-3 md:grid-cols-2"><input className="input-admin" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="Latitude" /><input className="input-admin" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="Longitude" /></div>
        <div className="grid gap-3 md:grid-cols-2"><select className="input-admin" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as StoreType })}><option value="CABANG">Cabang</option><option value="UTAMA">Utama</option></select><select className="input-admin" value={form.managerUserId} onChange={(e) => setForm({ ...form, managerUserId: e.target.value })}><option value="">No manager</option>{managers.map((manager) => <option value={manager.id} key={manager.id}>{manager.name}</option>)}</select></div>
        <DialogFooter><Button variant="outline" type="button" onClick={onClose}>Cancel</Button><Button className="bg-emerald-700">Save Store</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
  );
}

function validateStoreForm(form: typeof initialForm): StoreBody | string {
  if (form.name.trim().length < 2) return "Store name must be at least 2 characters.";
  if (form.address.trim().length < 5) return "Address must be at least 5 characters.";
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) return "Latitude is invalid.";
  if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) return "Longitude is invalid.";
  return { name: form.name, address: form.address, latitude, longitude, type: form.type, managerUserId: form.managerUserId };
}

const storeToForm = (store: AdminStore) => ({ name: store.name, address: store.address, latitude: String(store.latitude), longitude: String(store.longitude), type: store.type, managerUserId: store.manager?.id ?? "" });

function loadStores(filters: StoreAdminParams, setItems: (items: AdminStore[]) => void, setMeta: (meta: AdminMeta) => void) {
  getAdminStores(filters).then((result) => { setItems(result.data); setMeta(result.meta); }).catch(() => toast.error("Failed to load stores."));
}

function removeStore(item: AdminStore, close: (value: null) => void, refresh: () => void) {
  deleteAdminStore(item.id).then(() => { toast.success("Store deleted."); close(null); refresh(); }).catch(() => toast.error("Failed to delete store."));
}
