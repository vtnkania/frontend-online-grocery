"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
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
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8fd] flex items-center justify-center text-sm text-slate-500 animate-pulse">Memuat FreshMart...</div>}>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const notice = useSearchParams().get("notice");
  const location = useCatalogLocation();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [, setStore] = useState<StoreLocation | null>(null);

  // Ambil data Kategori & Produk berdasarkan koordinat toko terupdate
  useEffect(() => {
    if (location.loading) return;
    
    const params = { 
      latitude: location.latitude, 
      longitude: location.longitude 
    };

    Promise.all([
      getCategories({ ...params, limit: 4 }), 
      getProducts({ ...params, limit: 4 })
    ])
      .then(([categoryResult, productResult]) => {
        setCategories(categoryResult?.data || []);
        setProducts(productResult?.data || []);
        
        const nearestStore = location.store ?? productResult?.meta?.nearestStore ?? categoryResult?.nearestStore ?? null;
        if (nearestStore && !location.store) {
          location.setManualStore(nearestStore);
        }
      })
      .catch(() => { 
        setCategories([]); 
        setProducts([]); 
      });
  }, [location.loading, location.latitude, location.longitude, location.store, location]);

  return (
    <main className="min-h-screen bg-[#f7f8fd] text-slate-950">
      <Navbar />
      {notice === "verify-email" && (
        <div className="bg-amber-50 px-5 py-3 text-center text-sm font-medium text-amber-800">
          Verifikasi email terlebih dahulu untuk membuka halaman akun dan keranjang.
        </div>
      )}
      
      <section className="mx-auto max-w-6xl px-5 py-5">
        <HeroCarousel />
      </section>

      <SectionTitle title="Shop by Category" subtitle="Top picks from the nearest store" />
      <CategoryGrid categories={categories} />
      
      <section id="deals" className="mx-auto mt-10 max-w-6xl bg-white px-5 py-8 md:rounded-2xl shadow-sm border border-slate-100">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Fresh Deals</h2>
            <p className="text-sm text-slate-500">Available now from your selected store</p>
          </div>
          <Link className="hidden items-center gap-1 text-sm font-bold text-emerald-800 md:flex hover:underline" href="/products">
            See all <ArrowRight className="size-4" />
          </Link>
        </div>
        <ProductGrid products={products} />
      </section>
      
      <ReferFriend />
      <Footer />
    </main>
  );
}

function HeroCarousel() {
  return (
    <Carousel opts={{ loop: true }} className="overflow-hidden rounded-2xl bg-slate-900 shadow-md">
      <CarouselContent className="-ml-0">
        {promos.map((promo) => (
          <CarouselItem className="pl-0" key={promo.title}>
            <div className="relative h-[380px]">
              <img className="h-full w-full object-cover opacity-75" src={promo.image} alt={promo.title} />
              <div className="absolute inset-0 flex items-center px-8 md:px-16">
                <div className="max-w-xl text-white">
                  <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold">{promo.tag}</span>
                  <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">{promo.title}</h1>
                  <p className="mt-5 max-w-md leading-7 text-slate-100">{promo.text}</p>
                  <Link className="mt-8 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 shadow transition" href="/products">
                    Shop Now
                  </Link>
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
  return (
    <div className="mx-auto mt-8 max-w-6xl px-5">
      <h2 className="text-3xl font-black tracking-tight">{title}</h2>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function CategoryGrid({ categories }: { categories: CatalogCategory[] }) {
  if (!categories || !categories.length) {
    return <p className="mx-auto max-w-6xl px-5 text-sm text-slate-500">Category data is not available yet.</p>;
  }
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-2 gap-5 px-5 md:grid-cols-4 mt-4">
      {categories.map((category) => (
        <Link href={`/products?categoryId=${category.id}`} key={category.id} className="text-center group block">
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white p-1 shadow-sm transition group-hover:shadow-md">
            <img 
              className="aspect-square w-full rounded-lg object-cover transition duration-300 group-hover:scale-[1.02]" 
              src={category.imageUrl ?? "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80"} 
              alt={category.name} 
            />
          </div>
          <p className="mt-3 text-lg font-bold text-slate-800 group-hover:text-emerald-800 transition">{category.name}</p>
          <p className="text-xs text-slate-400 font-medium">{category.productCount ?? 0} products</p>
        </Link>
      ))}
    </section>
  );
}

function ProductGrid({ products }: { products: CatalogProduct[] }) {
  if (!products || !products.length) {
    return <p className="text-sm text-slate-500 py-4">Fresh deals are not available for this store yet.</p>;
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <DealCard key={`${product.storeId}-${product.id}`} product={product} />
      ))}
    </div>
  );
}

function DealCard({ product }: { product: CatalogProduct }) {
  const user = useAuth((state) => state.user);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const fetchCartCount = useCart((state) => state.fetchCartCount);

  const handleAdd = async () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(currentPath())}`);
      return;
    }
    if (!user.isVerified) {
      toast.error("Login dan verifikasi email terlebih dahulu untuk memakai keranjang.");
      return;
    }
    try {
      setLoading(true);
      await addToCart(product.id, product.storeId, 1);
      await fetchCartCount(); 
      toast.success("Produk berhasil dimasukkan ke keranjang.");
    } catch {
      toast.error("Gagal menambahkan produk ke keranjang.");
    } finally {
      setLoading(false);
    }
  };

  const currentStock = product.stock ?? 0;

  return (
    <article className="rounded-xl bg-slate-50 p-4 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition">
      <div>
        <Link href={`/products/${product.slug}`} className="block">
          <div className="overflow-hidden rounded-lg bg-white border border-slate-200/60">
            <img 
              className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03]" 
              src={product.imageUrl ?? "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=500&q=80"} 
              alt={product.name} 
            />
          </div>
          <h3 className="mt-3 min-h-10 text-sm font-bold text-slate-800 hover:text-emerald-700 transition line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-xs font-semibold text-slate-400">Stock: {currentStock}</p>
      </div>
      
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <p className="text-xl font-black text-slate-900">Rp {Number(product.price).toLocaleString("id-ID")}</p>
          <button 
            disabled={currentStock <= 0 || loading} 
            onClick={handleAdd} 
            className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm active:scale-[0.97]"
          >
            <Plus className="size-3" /> {loading ? "..." : "Add"}
          </button>
        </div>
        
        {/* 🚀 FIXED DETECTED TYPO: Memperbaiki penutupan string kutip ganda pada atribut className ikon */}
        {user && !user.isVerified && (
          <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-amber-700">
            <ShoppingCart className="size-3" /> Verifikasi email untuk cart.
          </p>
        )}
      </div>
    </article>
  );
}

function ReferFriend() {
  return (
    <section className="mx-auto mt-12 max-w-6xl px-5">
      <div className="overflow-hidden rounded-2xl bg-emerald-500 md:grid md:grid-cols-2 shadow-sm border border-emerald-600/20">
        <div className="p-10 text-white">
          <h2 className="text-3xl font-black tracking-tight">Refer a friend & get Rp 20.000</h2>
          <p className="mt-4 max-w-md leading-7 text-emerald-50">Share freshness with friends. They get a welcome voucher and you get store credit.</p>
          <button className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-900 shadow-md transition active:scale-[0.98]">
            Get Your Link
          </button>
        </div>
        <img className="hidden h-full w-full object-cover mix-blend-multiply md:block" src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80" alt="Friends cooking groceries" />
      </div>
    </section>
  );
}

const currentPath = () => (typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`);