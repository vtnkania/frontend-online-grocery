"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Plus, Search, ShoppingCart } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { useAuth } from "@/hooks/useAuth";

const categories = [
  ["Fruits", "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=500&q=80"],
  ["Vegetables", "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=500&q=80"],
  ["Meat", "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=500&q=80"],
  ["Dairy", "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=500&q=80"],
];

const deals = [
  ["Organic Cavendish Bananas", "$2.49", "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=500&q=80"],
  ["Honeycrisp Red Apples", "$5.99", "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=500&q=80"],
  ["Fresh Sourdough Loaf", "$4.50", "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80"],
  ["Sweet Garden Strawberries", "$3.25", "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=500&q=80"],
];

export default function Home() {
  return <Suspense><HomeInner /></Suspense>;
}

function HomeInner() {
  const user = useAuth((state) => state.user);
  const notice = useSearchParams().get("notice");
  const blocked = !user?.isVerified;

  return (
    <main className="min-h-screen bg-[#f7f8fd] text-slate-950">
      <Navbar />
      {notice === "verify-email" && <div className="bg-amber-50 px-5 py-3 text-center text-sm font-medium text-amber-800">Verifikasi email terlebih dahulu untuk membuka halaman akun dan keranjang.</div>}
      <section className="mx-auto max-w-6xl px-5 py-5">
        <div className="mb-5 flex h-12 items-center rounded-xl bg-blue-50 px-4 text-sm text-slate-500 md:hidden"><Search className="mr-2 size-4" /> Search groceries, brands, and more...</div>
        <div className="relative overflow-hidden rounded-2xl bg-slate-900">
          <img className="h-[360px] w-full object-cover opacity-75" src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80" alt="Fresh groceries" />
          <div className="absolute inset-0 flex items-center px-8 md:px-16">
            <div className="max-w-xl text-white">
              <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold">FLASH DELIVERY</span>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">Fresh Organics delivered in 60 mins</h1>
              <p className="mt-5 max-w-md leading-7">Get fresh local produce and everyday essentials delivered before you finish your coffee.</p>
              <div className="mt-8 flex gap-3"><Link className="rounded-xl bg-emerald-700 px-6 py-3 font-bold" href="/products">Shop Now</Link><Link className="rounded-xl border border-white/60 px-6 py-3 font-bold" href="#deals">View Deals</Link></div>
            </div>
          </div>
        </div>
      </section>
      <SectionTitle title="Shop by Category" subtitle="Top picks for your kitchen pantry" />
      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-5 px-5 md:grid-cols-4">
        {categories.map(([name, image]) => <div key={name} className="text-center"><img className="aspect-square w-full rounded-xl object-cover" src={image} alt={name} /><p className="mt-3 text-lg font-semibold">{name}</p></div>)}
      </section>
      <section id="deals" className="mx-auto mt-10 max-w-6xl rounded-3xl bg-white px-5 py-8">
        <div className="mb-6 flex items-end justify-between"><div><h2 className="text-3xl font-black">Fresh Deals</h2><p className="text-sm text-slate-500">Limited time offers on your favorites</p></div><Link className="hidden items-center gap-1 text-sm font-bold text-emerald-800 md:flex" href="/products">See all <ArrowRight className="size-4" /></Link></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {deals.map(([name, price, image]) => <DealCard blocked={blocked} image={image} key={name} name={name} price={price} />)}
        </div>
      </section>
      <section className="mx-auto mt-10 grid max-w-6xl gap-5 px-5 md:grid-cols-3">
        {["Whole Foods Market", "Central Co-op", "The Butcher's Table"].map((store) => <div className="rounded-xl border bg-white p-5 shadow-sm" key={store}><p className="font-bold">{store}</p><p className="mt-1 text-xs text-slate-500">25-35 mins - Fresh delivery</p></div>)}
      </section>
      <section className="mx-auto mt-12 max-w-6xl px-5">
        <div className="overflow-hidden rounded-2xl bg-emerald-500 md:grid md:grid-cols-2">
          <div className="p-10"><h2 className="text-3xl font-black">Refer a friend & get $20</h2><p className="mt-4 max-w-md leading-7">Share freshness with friends. They get $10 off and you get $20 credited.</p><button className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Get Your Link</button></div>
          <img className="hidden h-full w-full object-cover mix-blend-multiply md:block" src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80" alt="Friends cooking groceries" />
        </div>
      </section>
      <Footer />
    </main>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="mx-auto mt-8 max-w-6xl px-5"><h2 className="text-3xl font-black">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p></div>;
}

function DealCard({ name, price, image, blocked }: { name: string; price: string; image: string; blocked: boolean }) {
  return (
    <article className="rounded-xl bg-slate-50 p-4">
      <img className="aspect-square w-full rounded-lg object-cover" src={image} alt={name} />
      <h3 className="mt-4 min-h-10 text-sm font-bold">{name}</h3>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xl font-black">{price}</p>
        <button disabled={blocked} onClick={() => alert("Produk berhasil dimasukkan ke keranjang.")} className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-300"><Plus className="size-3" /> Add</button>
      </div>
      {blocked && <p className="mt-2 flex items-center gap-1 text-[11px] text-amber-700"><ShoppingCart className="size-3" /> Login dan verifikasi untuk cart.</p>}
    </article>
  );
}
