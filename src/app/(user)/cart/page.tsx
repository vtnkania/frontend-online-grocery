'use client';

import { useEffect, useState } from 'react';
import { getUserCart, updateCartQty, deleteCartItem } from '@/services/cart.service';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { Store, Square, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  quantity: number;
  priceSnapshot: string;
  store?: {
    id: string;
    name: string;
  };
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
  const fetchCartCount = useCart((state) => state.fetchCartCount);

  // STATE PINTAR: Menyimpan daftar ID Item yang sedang dicentang user
  const [checkedItemIds, setCheckedItemIds] = useState<string[]>([]);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const res = await getUserCart();
        const items: CartItem[] = res.items || [];
        setCartItems(items);
        
        // Default: Otomatis centang semua item dari toko cabang pertama yang terdeteksi
        if (items.length > 0) {
          const firstStoreId = items[0].store?.id || 'default-store';
          const firstStoreItems = items.filter((item) => (item.store?.id || 'default-store') === firstStoreId);
          setCheckedItemIds(firstStoreItems.map((item) => item.id));
        } else {
          setCheckedItemIds([]);
        }
      } catch {
        // Linter clean
      } finally {
        setLoading(false);
      }
    };
    fetchCartData();
  }, [refreshTrigger]);

  // LOGIKA CHECKBOX PROTEKSI MULTI-STORE
  const handleToggleCheck = (item: CartItem) => {
    const targetStoreId = item.store?.id || 'default-store';
    
    // Cari tahu apakah saat ini user sudah mencentang item dari toko yang BERBEDA
    const itemDariTokoLain = cartItems.find(
      (activeItem) => checkedItemIds.includes(activeItem.id) && (activeItem.store?.id || 'default-store') !== targetStoreId
    );

    if (itemDariTokoLain) {
      // Jika mendeteksi lintas cabang, batalkan centang toko lama secara sepihak dan pindah to toko baru
      toast.info(`Pindah transaksi ke Cabang ${item.store?.name || 'Utama'}. Dapatkan ongkir instan terbaik.`);
      setCheckedItemIds([item.id]);
    } else {
      // Jika masih dalam satu toko yang sama, jalankan fungsi toggle centang biasa
      if (checkedItemIds.includes(item.id)) {
        setCheckedItemIds(checkedItemIds.filter((id) => id !== item.id));
      } else {
        setCheckedItemIds([...checkedItemIds, item.id]);
      }
    }
  };

  // LOGIKA TOGGLE STORE ALL
  const handleToggleStoreAll = (storeId: string, storeItems: CartItem[]) => {
    const allItemIdsFromStore = storeItems.map((i) => i.id);
    const isAnyChecked = allItemIdsFromStore.some((id) => checkedItemIds.includes(id));

    if (isAnyChecked) {
      setCheckedItemIds([]);
    } else {
      setCheckedItemIds(allItemIdsFromStore);
      const storeName = storeItems[0]?.store?.name || 'Utama';
      toast.success(`Semua item dari Cabang ${storeName} berhasil dipilih.`);
    }
  };

  const handleQtyChange = async (id: string, currentQty: number, delta: number, maxStock: number) => {
    const targetQty = currentQty + delta;
    const limitStock = maxStock !== undefined ? maxStock : 99;

    if (delta > 0 && targetQty > limitStock) {
      alert(`Waduh, tidak bisa menambah barang. Stok di gudang toko hanya sisa ${limitStock} item.`);
      return;
    }

    try {
      if (targetQty <= 0) {
        if (confirm('Hapus produk ini dari keranjang?')) {
          await deleteCartItem(id);
          setCheckedItemIds(checkedItemIds.filter((checkedId) => checkedId !== id));
        } else return;
      } else {
        await updateCartQty(id, targetQty);
      }
      triggerRefresh();
      await fetchCartCount(); 
    } catch {
      alert('Gagal memperbarui jumlah keranjang belanja.');
    }
  };

  // Subtotal hanya menghitung nominal dari barang yang DICENTANG saja
  const calculateSubtotal = () => {
    return cartItems
      .filter((item) => checkedItemIds.includes(item.id))
      .reduce((acc, item) => acc + (Number(item.priceSnapshot) * item.quantity), 0);
  };

  // Mendapatkan ID Toko yang aktif dipilih saat ini untuk dilempar ke checkout
  const getSelectedStoreId = () => {
    const selectedItem = cartItems.find((item) => checkedItemIds.includes(item.id));
    return selectedItem?.store?.id || null;
  };

  // Mengelompokkan item belanjaan berdasarkan ID Toko
  const groupItemsByStore = () => {
    const groups: Record<string, { storeName: string; items: CartItem[] }> = {};
    cartItems.forEach((item) => {
      const storeId = item.store?.id || 'default-store';
      const storeName = item.store?.name || 'Toko Utama';
      if (!groups[storeId]) {
        groups[storeId] = { storeName, items: [] };
      }
      groups[storeId].items.push(item);
    });
    return groups;
  };

  if (loading) return <div className="text-center py-12 text-sm text-gray-500 animate-pulse">Memuat keranjang...</div>;

  const groupedCart = groupItemsByStore();
  const activeStoreId = getSelectedStoreId();

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8 text-slate-900">
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
            
            {Object.entries(groupedCart).map(([storeId, group]) => {
              const allIds = group.items.map((i) => i.id);
              const isStoreChecked = allIds.some((id) => checkedItemIds.includes(id));
              
              return (
                <div key={storeId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  
                  {/* Header Cabang */}
                  <div className="bg-slate-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => handleToggleStoreAll(storeId, group.items)}
                        className="text-gray-400 hover:text-green-600 transition"
                      >
                        {isStoreChecked ? (
                          <CheckSquare className="size-4 text-green-600" />
                        ) : (
                          <Square className="size-4" />
                        )}
                      </button>
                      <div className="flex items-center gap-1.5">
                        <Store className="size-4 text-emerald-600" />
                        <span className="text-xs font-bold text-gray-800">
                          FreshMart Cabang <span className="text-emerald-700">{group.storeName}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Daftar Item */}
                  <div className="p-4 space-y-4">
                    {group.items.map((item) => {
                      const prod = item.product;
                      const realImageUrl = prod.productImages && prod.productImages.length > 0 ? prod.productImages[0].url : '/placeholder-grocery.png'; 
                      const isItemChecked = checkedItemIds.includes(item.id);

                      return (
                        <div key={item.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0 border-gray-100 gap-4">
                          
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleCheck(item)}
                              className="text-gray-400 hover:text-green-600 transition shrink-0"
                            >
                              {isItemChecked ? (
                                <CheckSquare className="size-4 text-green-600" />
                              ) : (
                                <Square className="size-4" />
                              )}
                            </button>

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
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1 bg-white shadow-inner">
                              <button onClick={() => handleQtyChange(item.id, item.quantity, -1, Number(prod.stock || 0))} className="text-gray-500 hover:text-gray-700 font-bold px-1 text-sm">-</button>
                              <span className="text-sm font-medium text-gray-800 w-6 text-center">{item.quantity}</span>
                              <button onClick={() => handleQtyChange(item.id, item.quantity, 1, Number(prod.stock || 0))} className="text-gray-500 hover:text-gray-700 font-bold px-1 text-sm">+</button>
                            </div>
                            <p className="text-[11px] text-orange-600 font-semibold tracking-wide">Stok Cabang: {prod.stock ?? '-'}</p>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}

            {/* Total Ringkasan Biaya */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                <span className="text-sm text-gray-600">Total Harga Pilihan</span>
                <span className="text-base font-bold text-gray-900">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
              </div>
              
              {checkedItemIds.length === 0 ? (
                <button disabled className="block w-full text-center py-3 bg-gray-300 text-gray-500 font-medium text-sm rounded-lg cursor-not-allowed">
                  Centang Produk Terlebih Dahulu
                </button>
              ) : (
                // 🚀 FIXED: Sekarang menyertakan deretan 'itemIds' pilihan asli user ke dalam query string URL
                <Link 
                  href={`/checkout?storeId=${activeStoreId}&itemIds=${checkedItemIds.join(',')}`} 
                  className="block w-full text-center py-3 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 transition shadow-sm active:scale-[0.99]"
                >
                  Lanjut ke Checkout
                </Link>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}