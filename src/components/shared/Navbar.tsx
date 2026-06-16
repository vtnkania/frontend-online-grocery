"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Leaf, LogOut, MapPin, ShoppingCart, UserCircle } from "lucide-react";
import { getUserCart } from "@/services/cart.service";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const { user, logout } = useAuth();
  const displayCount = user?.isVerified ? cartCount : 0;

  useEffect(() => {
    if (!user?.isVerified) return;
    const fetchCartCount = async () => {
      const res = await getUserCart();
      const total = res.items?.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0) || 0;
      setCartCount(total);
    };
    fetchCartCount().catch(() => setCartCount(0));
  }, [user]);

  return (
    <nav className="sticky top-0 z-40 border-b border-emerald-50 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-emerald-800">
          <Leaf className="size-5" /> FreshMart
        </Link>
        <div className="hidden items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-slate-600 md:flex">
          <MapPin className="size-4 text-emerald-700" /> Deliver to: Jakarta, ID
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/products" className="hidden text-slate-600 hover:text-emerald-700 sm:block">Groceries</Link>
          <Link href="/cart" className="relative rounded-full p-2 text-slate-700 hover:bg-emerald-50">
            <ShoppingCart className="size-5" />
            {displayCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{displayCount}</span>}
          </Link>
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
