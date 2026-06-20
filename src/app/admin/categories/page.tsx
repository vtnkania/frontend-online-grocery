"use client";

import { FormEvent, useEffect, useState } from "react";
import { Edit, PlusCircle, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createAdminCategory, deleteAdminCategory, getAdminCategories, updateAdminCategory, type CategoryAdminParams } from "@/services/admin/category-admin.service";
import type { AdminCategory, AdminMeta } from "@/types/admin.type";

const emptyMeta: AdminMeta = { page: 1, limit: 10, total: 0, totalPages: 1 };

export default function AdminCategoriesPage() {
  const [filters, setFilters] = useState<CategoryAdminParams>({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" });
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [formTarget, setFormTarget] = useState<AdminCategory | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);

  useEffect(() => { loadCategories(filters, setItems, setMeta); }, [filters]);
  const refresh = () => setFilters((old) => ({ ...old }));

  return (
    <>
      <AdminPageHeader title="Category Management" subtitle="Manage product category data from the database." actions={<Button className="bg-emerald-700" onClick={() => setFormTarget("new")}><PlusCircle /> Add Category</Button>} />
      <section className="space-y-6 p-5">
        <CategoryFilters filters={filters} onChange={(name, value) => setFilters((old) => ({ ...old, [name]: value, page: 1 }))} />
        <CategoryTable items={items} onEdit={setFormTarget} onDelete={setDeleteTarget} />
        <AdminPagination meta={meta} onPageChange={(page) => setFilters((old) => ({ ...old, page }))} />
      </section>
      <CategoryDialog key={formTarget === "new" ? "new" : formTarget?.id ?? "empty"} target={formTarget} onClose={() => setFormTarget(null)} onSaved={refresh} />
      <ConfirmActionDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)} title="Delete category?" description={`This will remove ${deleteTarget?.name ?? "this category"} if it is not used by active products.`} confirmText="Delete" onConfirm={() => deleteTarget && removeCategory(deleteTarget, setDeleteTarget, refresh)} />
    </>
  );
}

function CategoryFilters({ filters, onChange }: { filters: CategoryAdminParams; onChange: (name: keyof CategoryAdminParams, value: string) => void }) {
  return (
    <div className="grid gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-[1fr_160px]">
      <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4"><Search className="size-5 text-slate-500" /><input className="h-12 w-full bg-transparent outline-none" value={filters.search ?? ""} onChange={(e) => onChange("search", e.target.value)} placeholder="Search categories..." /></label>
      <select className="input-admin" value={filters.sortOrder ?? "desc"} onChange={(e) => onChange("sortOrder", e.target.value)}><option value="desc">Newest first</option><option value="asc">Oldest first</option></select>
    </div>
  );
}

function CategoryTable({ items, onEdit, onDelete }: { items: AdminCategory[]; onEdit: (item: AdminCategory) => void; onDelete: (item: AdminCategory) => void }) {
  if (!items.length) return <p className="rounded-lg bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200">No categories found.</p>;
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[720px] text-left">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-700"><tr><th className="px-5 py-4">Category</th><th>Products</th><th>Created</th><th className="px-5">Actions</th></tr></thead>
        <tbody>{items.map((item) => <tr className="border-t border-slate-100" key={item.id}><td className="px-5 py-4"><div className="flex items-center gap-3"><img className="size-12 rounded-lg object-cover" alt={item.name} src={item.imageUrl ?? "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80"} /><b>{item.name}</b></div></td><td>{item.productCount}</td><td>{new Date(item.createdAt).toLocaleDateString("id-ID")}</td><td className="px-5"><div className="flex gap-2"><Button size="icon-sm" variant="outline" onClick={() => onEdit(item)}><Edit /></Button><Button size="icon-sm" variant="destructive" onClick={() => onDelete(item)}><Trash2 /></Button></div></td></tr>)}</tbody>
      </table>
    </div>
  );
}

function CategoryDialog({ target, onClose, onSaved }: { target: AdminCategory | "new" | null; onClose: () => void; onSaved: () => void }) {
  const editing = target && target !== "new" ? target : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [imageUrl, setImageUrl] = useState(editing?.imageUrl ?? "");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) return toast.error("Category name must be at least 2 characters.");
    const action = editing ? updateAdminCategory(editing.id, { name, imageUrl }) : createAdminCategory({ name, imageUrl });
    action.then(() => { toast.success("Category saved."); onSaved(); onClose(); }).catch(() => toast.error("Failed to save category."));
  };
  return (
    <Dialog open={Boolean(target)} onOpenChange={onClose}><DialogContent><DialogHeader><DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
      <form className="grid gap-3" onSubmit={submit}><input className="input-admin" value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" /><input className="input-admin" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" /><DialogFooter><Button variant="outline" type="button" onClick={onClose}>Cancel</Button><Button className="bg-emerald-700">Save Category</Button></DialogFooter></form>
    </DialogContent></Dialog>
  );
}

function loadCategories(filters: CategoryAdminParams, setItems: (items: AdminCategory[]) => void, setMeta: (meta: AdminMeta) => void) {
  getAdminCategories(filters).then((result) => { setItems(result.data); setMeta(result.meta); }).catch(() => toast.error("Failed to load categories."));
}

function removeCategory(item: AdminCategory, close: (value: null) => void, refresh: () => void) {
  deleteAdminCategory(item.id).then(() => { toast.success("Category deleted."); close(null); refresh(); }).catch(() => toast.error("Failed to delete category."));
}
