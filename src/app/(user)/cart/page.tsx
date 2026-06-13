'use client';

import { useEffect, useState } from 'react';
import { getUserCart, updateCartQty, deleteCartItem } from '@/services/cart.service';
import Link from 'next/link';

interface CartItem {
  id: string;
  quantity: number;
  priceSnapshot: string;
  product: { name: string; imageUrl: string; price: string };
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Memicu siklus render ulang data dari server secara asinkronus aman
  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Fungsi fetch diisolasi penuh di dalam Effect agar terbebas dari cascading renders
  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const res = await getUserCart();
        setCartItems(res.items || []);
      } catch {
        // Menjaga linter bersih tanpa variabel kosong
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();
  }, [refreshTrigger]); // Otomatis reload data setiap kali refreshTrigger berubah

  const handleQtyChange = async (id: string, currentQty: number, delta: number) => {
    const targetQty = currentQty + delta;
    try {
      if (targetQty <= 0) {
        if (confirm('Hapus produk ini dari keranjang?')) {
          await deleteCartItem(id);
        } else return;
      } else {
        await updateCartQty(id, targetQty);
      }
      triggerRefresh(); // Jalankan pemicu refresh setelah update berhasil
    } catch {
      alert('Gagal memperbarui keranjang belanja.');
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
            {/* List Item */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0 border-gray-100 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 border border-gray-200" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-xs text-gray-500">Rp {Number(item.priceSnapshot).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  
                  {/* Plus Minus Controls */}
                  <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1">
                    <button onClick={() => handleQtyChange(item.id, item.quantity, -1)} className="text-gray-500 hover:text-gray-700 font-bold px-1 text-sm">-</button>
                    <span className="text-sm font-medium text-gray-800 w-6 text-center">{item.quantity}</span>
                    <button onClick={() => handleQtyChange(item.id, item.quantity, 1)} className="text-gray-500 hover:text-gray-700 font-bold px-1 text-sm">+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary Block */}
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