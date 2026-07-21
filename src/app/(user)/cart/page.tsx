'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import { getUserCart, updateCartQty, deleteCartItem } from '@/services/cart.service';
import CartStoreGroup from '@/components/cart/CartStoreGroup';
import CartSummary from '@/components/cart/CartSummary';
import type { CartItem } from '@/components/cart/CartItemCard';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [checkedItemIds, setCheckedItemIds] = useState<string[]>([]);

  const fetchCartCount = useCart((state) => state.fetchCartCount);
  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const res = await getUserCart();
        const items: CartItem[] = res.items || [];
        setCartItems(items);

        if (items.length > 0) {
          const firstStoreId = items[0].store?.id || 'default-store';
          const firstStoreItems = items.filter(
            (item) => (item.store?.id || 'default-store') === firstStoreId
          );
          setCheckedItemIds(firstStoreItems.map((item) => item.id));
        } else {
          setCheckedItemIds([]);
        }
      } catch {
        // Handled silently
      } finally {
        setLoading(false);
      }
    };
    fetchCartData();
  }, [refreshTrigger]);

  const handleToggleCheck = (item: CartItem) => {
    const targetStoreId = item.store?.id || 'default-store';
    const itemDariTokoLain = cartItems.find(
      (activeItem) =>
        checkedItemIds.includes(activeItem.id) &&
        (activeItem.store?.id || 'default-store') !== targetStoreId
    );

    if (itemDariTokoLain) {
      toast.info(
        `Pindah transaksi ke Cabang ${item.store?.name || 'Utama'}. Dapatkan ongkir instan terbaik.`
      );
      setCheckedItemIds([item.id]);
    } else {
      if (checkedItemIds.includes(item.id)) {
        setCheckedItemIds(checkedItemIds.filter((id) => id !== item.id));
      } else {
        setCheckedItemIds([...checkedItemIds, item.id]);
      }
    }
  };

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

  const handleQtyChange = async (
    id: string,
    currentQty: number,
    delta: number,
    maxStock: number
  ) => {
    const targetQty = currentQty + delta;
    const limitStock = maxStock !== undefined ? maxStock : 99;

    if (delta > 0 && targetQty > limitStock) {
      alert(
        `Waduh, tidak bisa menambah barang. Stok di gudang toko hanya sisa ${limitStock} item.`
      );
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

  const calculateSubtotal = () =>
    cartItems
      .filter((item) => checkedItemIds.includes(item.id))
      .reduce((acc, item) => acc + Number(item.priceSnapshot) * item.quantity, 0);

  const getSelectedStoreId = () => {
    const selectedItem = cartItems.find((item) => checkedItemIds.includes(item.id));
    return selectedItem?.store?.id || null;
  };

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

  if (loading) {
    return (
      <div className="text-center py-12 text-sm text-gray-500 animate-pulse">
        Memuat keranjang...
      </div>
    );
  }

  const groupedCart = groupItemsByStore();

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
          Keranjang Belanja
        </h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-4">Keranjang belanja kamu masih kosong.</p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
            >
              Mulai Berbelanja
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedCart).map(([storeId, group]) => (
              <CartStoreGroup
                key={storeId}
                storeId={storeId}
                storeName={group.storeName}
                items={group.items}
                checkedItemIds={checkedItemIds}
                onToggleStoreAll={handleToggleStoreAll}
                onToggleCheck={handleToggleCheck}
                onQtyChange={handleQtyChange}
              />
            ))}

            <CartSummary
              subtotal={calculateSubtotal()}
              activeStoreId={getSelectedStoreId()}
              checkedItemIds={checkedItemIds}
            />
          </div>
        )}
      </div>
    </div>
  );
}