"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Leaf, LogOut, MapPin, ShoppingCart, UserCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart"; 
import { useCatalogLocation } from "@/hooks/useCatalogLocation";
import { getStores } from "@/services/product.service";
import type { StoreLocation } from "@/types/product.type";
import { toast } from "sonner";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const { cartCount, fetchCartCount } = useCart();
  const { user, logout } = useAuth();
  const displayCount = user?.isVerified ? cartCount : 0;

  const location = useCatalogLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allStores, setAllStores] = useState<StoreLocation[]>([]);

  useEffect(() => {
    if (user?.isVerified) {
      fetchCartCount(); 
    }
  }, [user, fetchCartCount]);

  useEffect(() => {
    getStores()
      .then((data) => setAllStores(data || []))
      .catch(() => setAllStores([]));
  }, []);

  // Hanya mengisi fallback toko teratas jika state benar-benar kosong dan tidak loading
  useEffect(() => {
    if (!location.loading && !location.store && allStores.length > 0 && !location.isAutoLocation) {
      location.setManualStore(allStores[0]);
    }
  }, [location.loading, location.store, allStores, location]);

  return (
    <nav className="sticky top-0 z-40 border-b border-emerald-50 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_auto] items-center gap-3 md:grid-cols-[auto_1fr_auto]">
        <Link href="/" className="flex items-center gap-2 font-bold text-emerald-800">
          <Leaf className="size-5" /> FreshMart
        </Link>
        <div className="order-3 col-span-2 md:order-none md:col-span-1 md:px-6">
          <SearchBar className="h-11 shadow-none" />
        </div>
        <div className="flex items-center justify-end gap-3 text-sm">
          
          <div className="relative">
            <button 
              onClick={() => setIsModalOpen(!isModalOpen)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-blue-100 transition active:scale-[0.98] shadow-3xs border border-blue-100"
            >
              <MapPin className="size-4 text-emerald-700 animate-pulse" /> 
              <span className="max-w-28 truncate">
                {location.store?.name ?? "Mencari cabang..."}
              </span>
              <span className="text-[10px] text-emerald-600 underline font-black ml-0.5">(Ganti)</span>
            </button>

            {isModalOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-white p-4 shadow-xl border border-slate-200/60 flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    🏢 Pilih Cabang Toko
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                {/* 🎯 LOGIKA CENTANG LOKASI SAYA YANG LO MINTA */}
                <div className="flex items-center gap-2 pb-2.5 mb-2 border-b border-slate-100">
                  <input 
                    type="checkbox"
                    id="useMyLocationToggle"
                    checked={location.isAutoLocation}
                    onChange={(e) => {
                      location.setAutoLocationMode(e.target.checked);
                      if (e.target.checked) {
                        toast.info("Mencari titik koordinat GPS terdekat...");
                      } else {
                        toast.success("Mode manual aktif. Silakan pilih cabang.");
                      }
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 size-3.5 cursor-pointer accent-emerald-600"
                  />
                  <label htmlFor="useMyLocationToggle" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none flex items-center gap-0.5">
                    📍 Gunakan Lokasi Saya (Auto GPS)
                  </label>
                </div>

                <p className="text-[10px] text-slate-400 font-medium leading-normal mb-3">
                  {location.isAutoLocation 
                    ? "Sistem sedang mengunci lokasi Anda secara otomatis via GPS browser." 
                    : "Pilih lokasi cabang secara manual untuk melihat katalog produk cabang tersebut."}
                </p>
                
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                  {allStores.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-2">Data toko tidak tersedia.</p>
                  ) : (
                    allStores.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          location.setManualStore(s); 
                          setIsModalOpen(false);      
                          toast.success(`Berhasil dialihkan ke toko: ${s.name}`);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border transition flex items-center gap-2 text-[11px] ${
                          location.store?.id === s.id 
                            ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold shadow-3xs" 
                            : "border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-700 font-medium"
                        }`}
                      >
                        <MapPin className={`size-3.5 shrink-0 ${location.store?.id === s.id ? 'text-emerald-700' : 'text-slate-400'}`} />
                        <span className="truncate">{s.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link href="/cart" className="relative rounded-full p-2 text-slate-700 hover:bg-emerald-50">
            <ShoppingCart className="size-5" />
            {displayCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{displayCount}</span>}
          </Link>
          {user && user.role !== "CUSTOMER" && <Link className="rounded-full p-2 text-slate-700 hover:bg-emerald-50" href="/admin/dashboard" title="Dashboard"><LayoutDashboard className="size-5" /></Link>}
          {user ? <UserMenu name={user.name || user.email} onLogout={logout} /> : <Link className="font-semibold text-emerald-800" href="/login">Login</Link>}
        </div>
      </div>
    </nav>
  );
}

function UserMenu({ name, onLogout }: { name: string; onLogout: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Link className="flex items-center gap-1 text-slate-700 hover:text-emerald-700" href="/profile">
        <UserCircle className="size-5" />
        <span className="hidden max-w-24 truncate md:block">{name}</span>
      </Link>
      <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100" onClick={onLogout} title="Logout">
        <LogOut className="size-4" />
      </button>
    </div>
  );
}