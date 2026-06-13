'use client';

import { useState } from 'react';
import { addToCart } from '@/services/cart.service';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: string;
    imageUrl?: string;
  };
  storeId: string; // Wajib dikirim dari halaman landing page terdekat
  stock: number;   // Diambil dari data inventory toko cabang tersebut
}

export default function ProductCard({ product, storeId, stock }: ProductCardProps) {
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      await addToCart(product.id, storeId, 1);
      alert('Produk berhasil dimasukkan ke keranjang!');
    } catch {
      alert('Waduh, gagal menambahkan produk ke keranjang.');
    } finally {
      setLoading(false);
    }
  };

  const isOutOfStock = stock <= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Placeholder Gambar Produk */}
        <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 border border-gray-100 flex items-center justify-center text-gray-400 text-xs">
          {product.imageUrl ? 'Image' : 'No Image'}
        </div>
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">{product.name}</h3>
        <p className="text-xs text-gray-400 mb-2">Stok: {stock > 0 ? stock : 'Habis'}</p>
      </div>

      <div className="space-y-3 mt-2">
        <p className="text-sm font-bold text-gray-950">
          Rp {Number(product.price).toLocaleString('id-ID')}
        </p>

        {/* Tombol Add to Cart dengan proteksi pengecekan ketersediaan stok */}
        <button
          onClick={handleAddToCart}
          disabled={loading || isOutOfStock}
          className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition active:scale-[0.98]"
        >
          {loading ? 'Memproses...' : isOutOfStock ? 'Stok Habis' : '+ Keranjang'}
        </button>
      </div>
    </div>
  );
}