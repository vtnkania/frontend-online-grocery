"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, MapPin, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useAuth } from "@/hooks/useAuth";
import { useCatalogLocation } from "@/hooks/useCatalogLocation";
import { addToCart } from "@/services/cart.service";
import { getCategories, getProducts } from "@/services/product.service";
import type { CatalogCategory, CatalogProduct, StoreLocation } from "@/types/product.type";

const promos = [
  { title: "Fresh deals delivered fast", text: "Save on produce, dairy, and pantry staples from the closest store.", tag: "WEEKLY PROMO", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80" },
  { title: "Breakfast essentials in one cart", text: "Milk, fruit, bread, and eggs ready for your morning routine.", tag: "MORNING BUNDLE", image: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1600&q=80" },
  { title: "Local vegetables picked fresh", text: "Explore crisp greens and everyday ingredients while stock lasts.", tag: "FRESH MARKET", image: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=1600&q=80" },
];

export default function Home() {
  return <Suspense><HomeInner /></Suspense>;
}

function HomeInner() {
  const user = useAuth((state) => state.user);
  const notice = useSearchParams().get("notice");
  const location = useCatalogLocation();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [store, setStore] = useState<StoreLocation | null>(null);
  const blocked = !user?.isVerified;

  useEffect(() => {
    if (location.loading) return;
    const params = { latitude: location.latitude, longitude: location.longitude };
    Promise.all([getCategories({ ...params, limit: 4 }), getProducts({ ...params, limit: 4 })])
      .then(([categoryResult, productResult]) => {
        setCategories(categoryResult.data);
        setProducts(productResult.data);
        setStore(productResult.meta.nearestStore ?? categoryResult.nearestStore);
      })
      .catch(() => { setCategories([]); setProducts([]); });
  }, [location.loading, location.latitude, location.longitude]);

  return (
    <main className="min-h-screen bg-[#f7f8fd] text-slate-950">
      <Navbar />
      {notice === "verify-email" && <div className="bg-amber-50 px-5 py-3 text-center text-sm font-medium text-amber-800">Verifikasi email terlebih dahulu untuk membuka halaman akun dan keranjang.</div>}
      <section className="mx-auto max-w-6xl px-5 py-5">
        <HeroCarousel />
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <MapPin className="size-4 text-emerald-700" /> {store?.name ?? location.store?.name ?? "Finding nearest store..."}
        </div>
      </section>
      <SectionTitle title="Shop by Category" subtitle="Top picks from the nearest store" />
      <CategoryGrid categories={categories} />
      <section id="deals" className="mx-auto mt-10 max-w-6xl bg-white px-5 py-8 md:rounded-2xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><h2 className="text-3xl font-black">Fresh Deals</h2><p className="text-sm text-slate-500">Available now from your selected store</p></div>
          <Link className="hidden items-center gap-1 text-sm font-bold text-emerald-800 md:flex" href="/products">See all <ArrowRight className="size-4" /></Link>
        </div>
        <ProductGrid blocked={blocked} products={products} />
      </section>
      <ReferFriend />
      <Footer />
    </main>
  );
}

function HeroCarousel() {
  return (
    <Carousel opts={{ loop: true }} className="overflow-hidden rounded-2xl bg-slate-900">
      <CarouselContent className="-ml-0">
        {promos.map((promo) => (
          <CarouselItem className="pl-0" key={promo.title}>
            <div className="relative h-[380px]">
              <img className="h-full w-full object-cover opacity-75" src={promo.image} alt={promo.title} />
              <div className="absolute inset-0 flex items-center px-8 md:px-16">
                <div className="max-w-xl text-white">
                  <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold">{promo.tag}</span>
                  <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">{promo.title}</h1>
                  <p className="mt-5 max-w-md leading-7">{promo.text}</p>
                  <Link className="mt-8 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800" href="/products">Shop Now</Link>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden md:inline-flex" />
      <CarouselNext className="hidden md:inline-flex" />
    </Carousel>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="mx-auto mt-8 max-w-6xl px-5"><h2 className="text-3xl font-black">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p></div>;
}

function CategoryGrid({ categories }: { categories: CatalogCategory[] }) {
  if (!categories.length) return <p className="mx-auto max-w-6xl px-5 text-sm text-slate-500">Category data is not available yet.</p>;
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-2 gap-5 px-5 md:grid-cols-4">
      {categories.map((category) => <Link href={`/products?categoryId=${category.id}`} key={category.id} className="text-center"><img className="aspect-square w-full rounded-xl object-cover" src={category.imageUrl ?? "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80"} alt={category.name} /><p className="mt-3 text-lg font-semibold">{category.name}</p><p className="text-xs text-slate-500">{category.productCount} products</p></Link>)}
    </section>
  );
}

function ProductGrid({ products, blocked }: { products: CatalogProduct[]; blocked: boolean }) {
  if (!products.length) return <p className="text-sm text-slate-500">Fresh deals are not available for this store yet.</p>;
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <DealCard blocked={blocked} key={`${product.storeId}-${product.id}`} product={product} />)}</div>;
}

function DealCard({ product, blocked }: { product: CatalogProduct; blocked: boolean }) {
  const [loading, setLoading] = useState(false);
  const handleAdd = async () => {
    try {
      setLoading(true);
      await addToCart(product.id, product.storeId, 1);
      toast.success("Produk berhasil dimasukkan ke keranjang.");
    } catch {
      toast.error("Gagal menambahkan produk ke keranjang.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="rounded-xl bg-slate-50 p-4">
      <Link href={`/products/${product.slug}`} className="block">
        <img className="aspect-square w-full rounded-lg object-cover" src={product.imageUrl ?? "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=500&q=80"} alt={product.name} />
        <h3 className="mt-4 min-h-10 text-sm font-bold hover:text-emerald-700">{product.name}</h3>
      </Link>
      <p className="mt-1 text-xs text-slate-500">Stock: {product.stock}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xl font-black">Rp {Number(product.price).toLocaleString("id-ID")}</p>
        <button disabled={blocked || product.stock <= 0 || loading} onClick={handleAdd} className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-300"><Plus className="size-3" /> {loading ? "..." : "Add"}</button>
      </div>
      {blocked && <p className="mt-2 flex items-center gap-1 text-[11px] text-amber-700"><ShoppingCart className="size-3" /> Login dan verifikasi untuk cart.</p>}
    </article>
  );
}

function ReferFriend() {
  return (
    <section className="mx-auto mt-12 max-w-6xl px-5">
      <div className="overflow-hidden rounded-2xl bg-emerald-500 md:grid md:grid-cols-2">
        <div className="p-10"><h2 className="text-3xl font-black">Refer a friend & get Rp 20.000</h2><p className="mt-4 max-w-md leading-7">Share freshness with friends. They get a welcome voucher and you get store credit.</p><button className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Get Your Link</button></div>
        <img className="hidden h-full w-full object-cover mix-blend-multiply md:block" src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80" alt="Friends cooking groceries" />
      </div>
    </section>
  );
}