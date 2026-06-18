'use client';

import { useEffect, useState } from 'react';
import { getUserCart, updateCartQty, deleteCartItem } from '@/services/cart.service';
import Link from 'next/link';
import Image from 'next/image';

interface CartItem {
  id: string;
  quantity: number;
  priceSnapshot: string;
  product: { 
    id: string;
    name: string; 
    slug: string; 
    price: string;
    stock?: number;
    productImages?: {
      id: string;
      url: string;
    }[];
  };
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const res = await getUserCart();
        setCartItems(res.items || []);
      } catch {
        // Linter clean
      } finally {
        setLoading(false);
      }
    };
    fetchCartData();
  }, [refreshTrigger]);

  const handleQtyChange = async (id: string, currentQty: number, delta: number, maxStock: number) => {
    const targetQty = currentQty + delta;
    
    // Fallback jika backend belum mengirim data stock, beri batas default aman
    const limitStock = maxStock !== undefined ? maxStock : 99;

    if (delta > 0 && targetQty > limitStock) {
      alert(`Waduh, tidak bisa menambah barang. Stok di gudang toko hanya sisa ${limitStock} item.`);
      return;
    }

    try {
      if (targetQty <= 0) {
        if (confirm('Hapus produk ini dari keranjang?')) {
          await deleteCartItem(id);
        } else return;
      } else {
        await updateCartQty(id, targetQty);
      }
      triggerRefresh();
    } catch {
      alert('Gagal memperbarui jumlah keranjang belanja.');
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + (Number(item.priceSnapshot) * item.quantity), 0);
  };

  if (loading) return <div className="text-center py-12 text-sm text-gray-500 animate-pulse">Memuat keranjang...</div>;

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Keranjang Belanja</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-4">Keranjang belanja kamu masih kosong.</p>
            <Link href="/" className="inline-block px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition">
              Mulai Berbelanja
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
              {cartItems.map((item) => {
                const prod = item.product;
                
                // 100% DINAMIS: Ambil gambar ke-1 dari database hasil include backend.
                // Jika data gambar belum di-include backend, otomatis pakai gambar placeholder lokal.
                const realImageUrl = prod.productImages && prod.productImages.length > 0 
                  ? prod.productImages[0].url 
                  : '/placeholder-grocery.png'; 

                // 100% DINAMIS: Ambil stock asli, jika belum di-include backend tampilkan "-"
                const displayStock = prod.stock !== undefined ? prod.stock : '-';

                return (
                  <div key={item.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0 border-gray-100 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 relative flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                        <Image 
                          src={realImageUrl} 
                          alt={prod.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{prod.name}</h3>
                        <p className="text-xs text-gray-500">Rp {Number(item.priceSnapshot).toLocaleString('id-ID')}</p>
                        <p className="text-[11px] text-orange-600 font-medium">Sisa Stok Gudang: {displayStock}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1">
                      <button onClick={() => handleQtyChange(item.id, item.quantity, -1, Number(prod.stock || 0))} className="text-gray-500 hover:text-gray-700 font-bold px-1 text-sm">-</button>
                      <span className="text-sm font-medium text-gray-800 w-6 text-center">{item.quantity}</span>
                      <button onClick={() => handleQtyChange(item.id, item.quantity, 1, Number(prod.stock || 0))} className="text-gray-500 hover:text-gray-700 font-bold px-1 text-sm">+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                <span className="text-sm text-gray-600">Total Harga Barang</span>
                <span className="text-base font-bold text-gray-900">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
              </div>
              <Link href="/checkout" className="block w-full text-center py-3 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 transition shadow-sm active:scale-[0.99]">
                Lanjut ke Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}