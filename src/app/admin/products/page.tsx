"use client";

import Link from "next/link";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import { Download, Edit, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { deleteAdminProduct, getAdminProductOptions, getAdminProducts, type ProductAdminParams } from "@/services/admin/product-admin.service";
import type { AdminMeta, AdminOptions, AdminProduct } from "@/types/admin.type";

const emptyMeta: AdminMeta = { page: 1, limit: 10, total: 0, totalPages: 1 };
const emptyOptions: AdminOptions = { categories: [], stores: [] };

export default function AdminProductsPage() {
  const user = useAuth((state) => state.user);
  const readonly = user?.role === "STORE_ADMIN";
  const [filters, setFilters] = useState<ProductAdminParams>({ page: 1, limit: 10, stockStatus: "all", sortBy: "createdAt", sortOrder: "desc" });
  const [options, setOptions] = useState(emptyOptions);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [target, setTarget] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getAdminProductOptions().then(setOptions).catch(() => setOptions(emptyOptions)); }, []);
  useEffect(() => { loadProducts(filters, setProducts, setMeta, setLoading); }, [filters]);

  const actions = useMemo(() => (
    <>
      <Button variant="outline"><Download /> Bulk Actions</Button>
      {!readonly && <Button asChild className="bg-emerald-700"><Link href="/admin/products/create"><PlusCircle /> Add New Product</Link></Button>}
    </>
  ), [readonly]);

  return (
    <>
      <AdminPageHeader title="Product Management" subtitle="Update, track, and manage your global inventory." actions={actions} />
      <section className="space-y-6 p-5">
        <AdminFilterBar search={filters.search ?? ""} categoryId={filters.categoryId ?? ""} storeId={filters.storeId ?? ""} stockStatus={filters.stockStatus ?? "all"} options={options} onChange={(name, value) => setFilters((old) => ({ ...old, [name]: value, page: 1 }))} />
        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <ProductTable products={products} readonly={readonly} loading={loading} onDelete={setTarget} />
          <AdminPagination meta={meta} onPageChange={(page) => setFilters((old) => ({ ...old, page }))} />
        </div>
      </section>
      <ConfirmActionDialog open={Boolean(target)} onOpenChange={() => setTarget(null)} title="Delete product?" description={`This will remove ${target?.name ?? "this product"} from admin listings.`} confirmText="Delete" onConfirm={() => target && deleteProduct(target, setTarget, setFilters)} />
    </>
  );
}

function ProductTable({ products, readonly, loading, onDelete }: { products: AdminProduct[]; readonly: boolean; loading: boolean; onDelete: (product: AdminProduct) => void }) {
  if (loading) return <p className="p-6 text-sm text-slate-500">Loading products...</p>;
  if (!products.length) return <p className="p-6 text-sm text-slate-500">No products found.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left">
        <thead className="bg-blue-50 text-xs uppercase tracking-[0.2em] text-slate-700"><tr><th className="px-5 py-4">Product</th><th>Store</th><th>Price</th><th>Stock</th><th>Status</th><th className="px-5">Actions</th></tr></thead>
        <tbody>{products.map((product) => <ProductRow product={product} readonly={readonly} onDelete={onDelete} key={product.id} />)}</tbody>
      </table>
    </div>
  );
}

function ProductRow({ product, readonly, onDelete }: { product: AdminProduct; readonly: boolean; onDelete: (product: AdminProduct) => void }) {
  const image = product.images[0]?.url ?? "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80";
  return (
    <tr className="border-t border-slate-100">
      <td className="px-5 py-5"><div className="flex items-center gap-4"><img src={image} alt={product.name} className="size-14 rounded-lg object-cover" /><div><p className="font-black">{product.name}</p><p className="text-sm text-slate-500">{product.category.name}</p></div></div></td>
      <td className="max-w-48 text-slate-700">{product.stores.map((store) => store.storeName).join(", ") || "No store"}</td>
      <td className="font-black">Rp {Number(product.price).toLocaleString("id-ID")}</td>
      <td><StockBadge stock={product.totalStock} /></td>
      <td><span className={cn("rounded-full px-3 py-1 text-xs font-bold", product.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500")}>{product.isActive ? "Active" : "Inactive"}</span></td>
      <td className="px-5"><div className="flex gap-2">{!readonly && <><Button asChild variant="outline" size="icon-sm"><Link href={`/admin/products/${product.id}`}><Edit /></Link></Button><Button variant="destructive" size="icon-sm" onClick={() => onDelete(product)}><Trash2 /></Button></>}</div></td>
    </tr>
  );
}

function StockBadge({ stock }: { stock: number }) {
  const status = stock === 0 ? "Out of Stock" : stock <= 20 ? "Low Stock" : "In Stock";
  const color = stock === 0 ? "bg-slate-900 text-white" : stock <= 20 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800";
  return <span className={cn("rounded-full px-3 py-1 text-sm font-bold", color)}>{status} ({stock})</span>;
}

function loadProducts(filters: ProductAdminParams, setProducts: (value: AdminProduct[]) => void, setMeta: (value: AdminMeta) => void, setLoading: (value: boolean) => void) {
  setLoading(true);
  getAdminProducts(filters).then((result) => { setProducts(result.data); setMeta(result.meta); }).catch(() => toast.error("Failed to load products.")).finally(() => setLoading(false));
}

function deleteProduct(product: AdminProduct, close: (value: null) => void, setFilters: Dispatch<SetStateAction<ProductAdminParams>>) {
  deleteAdminProduct(product.id).then(() => { toast.success("Product deleted."); close(null); setFilters((old) => ({ ...old })); }).catch(() => toast.error("Failed to delete product."));
}
