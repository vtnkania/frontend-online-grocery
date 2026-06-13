'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserCart } from '@/services/cart.service';

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const res = await getUserCart();
        const totalItems = res.items?.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0) || 0;
        setCartCount(totalItems);
      } catch {
        // Linter aman
      }
    };

    fetchCartCount();
    
    const interval = setInterval(fetchCartCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo Toko */}
        <Link href="/" className="text-lg font-bold text-green-600 tracking-wide">
          🛒 Online Grocery
        </Link>

        {/* Menu Navigasi Kanan */}
        <div className="flex items-center gap-6">
          <Link href="/addresses" className="text-sm font-medium text-gray-600 hover:text-green-600 transition">
            Alamat Saya
          </Link>

          {/* Tombol Keranjang Belanja */}
          <Link href="/cart" className="relative p-2 text-gray-600 hover:text-green-600 transition">
            <span className="text-base font-medium">Keranjang</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}