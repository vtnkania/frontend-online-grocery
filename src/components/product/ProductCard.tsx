'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { addToCart } from '@/services/cart.service';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart'; // 🚀 FIXED: Menambahkan import global store cart

interface ProductCardProps {
  product: {
    id: string;
    slug?: string;
    name: string;
    price: string;
    imageUrl?: string | null;
  };
  storeId: string; // Wajib dikirim dari halaman landing page terdekat[cite: 13]
  stock: number;   // Diambil dari data inventory toko cabang tersebut[cite: 13]
}

export default function ProductCard({ product, storeId, stock }: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const user = useAuth((state) => state.user);
  const fetchCartCount = useCart((state) => state.fetchCartCount); // 🚀 FIXED: Inisialisasi fungsi pemicu re-render counter navbar
  const router = useRouter();

  const handleAddToCart = async () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(currentPath())}`);
      return;
    }
    if (!user.isVerified) {
      toast.error('Login dan verifikasi email terlebih dahulu untuk memakai keranjang.');
      return;
    }
    try {
      setLoading(true);
      await addToCart(product.id, storeId, 1);
      await fetchCartCount(); // 🚀 FIXED: Memperbarui angka indikator merah navbar secara real-time pasca sukses
      toast.success('Produk berhasil dimasukkan ke keranjang.');
    } catch {
      toast.error('Gagal menambahkan produk ke keranjang.');
    } finally {
      setLoading(false);
    }
  };

  const isOutOfStock = stock <= 0;
  const isUnverified = Boolean(user && !user.isVerified);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between h-full">
      <div>
        <Link href={product.slug ? `/products/${product.slug}` : "/products"} className="block">
          {product.imageUrl ? (
            <img className="mb-3 h-40 w-full rounded-lg border border-gray-100 object-cover" src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 border border-gray-100 flex items-center justify-center text-gray-400 text-xs">No Image</div>
          )}
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1 hover:text-emerald-700">{product.name}</h3>
        </Link>
        <p className="text-xs text-gray-400 mb-2">Stok: {stock > 0 ? stock : 'Habis'}</p>
      </div>

      <div className="space-y-3 mt-2">
        <p className="text-sm font-bold text-gray-950">
          Rp {Number(product.price).toLocaleString('id-ID')}
        </p>

        {/* Tombol Add to Cart dengan proteksi pengecekan ketersediaan stok[cite: 13] */}
        <button
          onClick={handleAddToCart}
          disabled={loading || isOutOfStock}
          className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition active:scale-[0.98]"
        >
          {loading ? 'Memproses...' : isOutOfStock ? 'Stok Habis' : '+ Keranjang'}
        </button>
        {isUnverified && <p className="text-[11px] text-amber-700">Akun terverifikasi diperlukan.</p>}
      </div>
    </div>
  );
}

const currentPath = () => (typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`);