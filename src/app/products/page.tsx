"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { useCatalogLocation } from "@/hooks/useCatalogLocation";
import { getCategories, getProducts } from "@/services/product.service";
import type { CatalogCategory, CatalogProduct, ProductMeta, ProductSortBy, SortOrder } from "@/types/product.type";

export default function ProductsPage() {
  return <Suspense><ProductsInner /></Suspense>;
}

function ProductsInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = useCatalogLocation();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [meta, setMeta] = useState<ProductMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const query = useMemo(() => readProductQuery(searchParams), [searchParams]);

  useEffect(() => {
    if (location.loading) return;
    const coords = { latitude: location.latitude, longitude: location.longitude };
    Promise.all([getProducts({ ...coords, ...query }), getCategories({ ...coords, limit: 12 })])
      .then(([productResult, categoryResult]) => {
        setProducts(productResult.data);
        setMeta(productResult.meta);
        setCategories(categoryResult.data);
      })
      .catch(() => { setProducts([]); setMeta(null); })
      .finally(() => setLoading(false));
  }, [location.loading, location.latitude, location.longitude, query]);

  const updateQuery = (changes: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => value ? params.set(key, String(value)) : params.delete(key));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#f7f8fd] text-slate-950">
      <Navbar />
      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div><h1 className="text-3xl font-black">Groceries Catalog</h1><p className="text-sm text-slate-500">Showing products from {meta?.nearestStore?.name ?? "the nearest store"}</p></div>
        </div>
        <CatalogFilters categories={categories} query={query} updateQuery={updateQuery} />
        {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading products...</p> : <ProductGrid products={products} />}
        <Pagination meta={meta} updateQuery={updateQuery} />
      </section>
      <Footer />
    </main>
  );
}

function readProductQuery(params: URLSearchParams) {
  return {
    page: Number(params.get("page") || 1),
    limit: 8,
    search: params.get("search") ?? "",
    categoryId: params.get("categoryId") ?? undefined,
    sortBy: ((params.get("sortBy") as ProductSortBy | null) ?? "createdAt"),
    sortOrder: ((params.get("sortOrder") as SortOrder | null) ?? "desc"),
  };
}

function CatalogFilters({ categories, query, updateQuery }: { categories: CatalogCategory[]; query: ReturnType<typeof readProductQuery>; updateQuery: (changes: Record<string, string | number | undefined>) => void }) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-white p-4 md:flex-row md:items-center">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><SlidersHorizontal className="size-4 text-emerald-700" /> Filters</div>
      <select value={query.categoryId ?? ""} onChange={(event) => updateQuery({ categoryId: event.target.value || undefined, page: 1 })} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
        <option value="">All categories</option>
        {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
      </select>
      <select value={query.sortBy} onChange={(event) => updateQuery({ sortBy: event.target.value, page: 1 })} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
        <option value="createdAt">Newest</option><option value="name">Name</option><option value="price">Price</option>
      </select>
      <select value={query.sortOrder} onChange={(event) => updateQuery({ sortOrder: event.target.value, page: 1 })} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
        <option value="desc">Descending</option><option value="asc">Ascending</option>
      </select>
    </div>
  );
}

function ProductGrid({ products }: { products: CatalogProduct[] }) {
  if (!products.length) return <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">No products found for this store.</p>;
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <ProductCard key={`${product.storeId}-${product.id}`} product={product} storeId={product.storeId} stock={product.stock} />)}</div>;
}

function Pagination({ meta, updateQuery }: { meta: ProductMeta | null; updateQuery: (changes: Record<string, string | number | undefined>) => void }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <Button variant="outline" disabled={meta.page <= 1} onClick={() => updateQuery({ page: meta.page - 1 })}>Previous</Button>
      <span className="text-sm text-slate-600">Page {meta.page} of {meta.totalPages}</span>
      <Button variant="outline" disabled={meta.page >= meta.totalPages} onClick={() => updateQuery({ page: meta.page + 1 })}>Next</Button>
    </div>
  );
}
