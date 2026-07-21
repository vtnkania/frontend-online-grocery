import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { getUserCart } from '@/services/cart.service';
import { getUserAddresses, setPrimaryAddress } from '@/services/address.service';
import {
  fetchShippingRatesApi,
  createOrderApi,
  getQrisTokenApi,
  notifyMidtransPaymentApi,
  loadMidtransScript,
} from '@/services/checkout.service';
import type { Address } from '@/components/checkout/CheckoutAddressSection';
import type { CartItem } from '@/components/checkout/CheckoutItemsSection';
import type { ShippingRate } from '@/components/checkout/CheckoutShippingSection';

export function useCheckout() {
  const router = useRouter();
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<ShippingRate | null>(null);

  // 1. Fetch Cart Data & Init Midtrans SDK
  useEffect(() => {
    loadMidtransScript();

    getUserCart()
      .then((res) => {
        const searchParams = new URLSearchParams(window.location.search);
        const urlStoreId = searchParams.get('storeId');
        const urlItemIds = searchParams.get('itemIds');

        let filtered: CartItem[] = res.items || [];
        if (urlStoreId) {
          filtered = filtered.filter((i) => (i.store?.id || 'default-store') === urlStoreId);
        } else if (filtered.length > 0 && filtered[0].store?.id) {
          filtered = filtered.filter((i) => i.store?.id === filtered[0].store?.id);
        }

        if (urlItemIds) {
          const allowed = urlItemIds.split(',');
          filtered = filtered.filter((i) => allowed.includes(i.id));
        }

        setCartItems(filtered);
      })
      .catch((err) => console.error('Gagal memuat cart checkout:', err))
      .finally(() => setLoadingCart(false));
  }, []);

  // 2. Fetch User Address
  useEffect(() => {
    if (!user?.id) return;
    getUserAddresses(user.id).then((data) => {
      const list: Address[] = (data || []).filter((a: Address) => a?.id && a?.address);
      setAddresses(list);
      setSelectedAddress(list.find((a) => a.isPrimary) || list[0] || null);
    });
  }, [user]);

  // 3. Fetch Shipping Rates
  const activeStoreId = cartItems[0]?.store?.id;
  useEffect(() => {
    let isMounted = true;

    const loadShipping = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      if (!selectedAddress || !user?.id || !activeStoreId) {
        setShippingRates([]);
        setSelectedCourier(null);
        return;
      }

      setLoadingShipping(true);
      setSelectedCourier(null);

      try {
        const result = await fetchShippingRatesApi(user.id, activeStoreId);
        if (!isMounted) return;
        if (result.success && result.data?.length > 0) {
          setShippingRates(result.data);
          setSelectedCourier(result.data[0]);
        } else {
          setShippingRates([]);
        }
      } catch {
        if (isMounted) setShippingRates([]);
      } finally {
        if (isMounted) setLoadingShipping(false);
      }
    };

    loadShipping();
    return () => { isMounted = false; };
  }, [selectedAddress, user?.id, activeStoreId]);

  const handleSelectAddress = async (addr: Address) => {
    if (!user?.id) return;
    try {
      await setPrimaryAddress(addr.id, user.id);
      setSelectedAddress(addr);
      setIsAddressModalOpen(false);
      toast.success(`Alamat pengiriman dialihkan ke: ${addr.label}`);
    } catch {
      toast.error('Gagal mengubah alamat pengiriman utama.');
    }
  };

  const calculateSubtotal = () =>
    cartItems.reduce((acc, item) => acc + Number(item.priceSnapshot) * item.quantity, 0);

  const shippingCost = selectedCourier ? selectedCourier.rate : 0;
  const grandTotal = calculateSubtotal() + shippingCost;

  const handlePlaceOrder = async () => {
    if (!user?.id || !selectedAddress || !selectedCourier || cartItems.length === 0) {
      alert('Lengkapi alamat dan kurir pengiriman terlebih dahulu!');
      return;
    }
    setSubmitting(true);

    try {
      const order = await createOrderApi({
        userId: user.id,
        courierCompany: selectedCourier.company,
        courierName: selectedCourier.type,
        shippingCost: selectedCourier.rate,
        cartItemIds: cartItems.map((item) => item.id),
        paymentMethod: 'MIDTRANS',
      });

      const snapToken = await getQrisTokenApi(order.id);

      if (typeof window !== 'undefined' && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: async () => {
            await notifyMidtransPaymentApi(order.id).catch(console.error);
            alert('🎉 Pembayaran Berhasil via Midtrans!');
            router.push(`/orders/${order.id}`);
          },
          onPending: () => {
            alert('⏳ Menunggu pembayaranmu diselesaikan.');
            router.push(`/orders/${order.id}`);
          },
          onError: () => alert('❌ Pembayaran Midtrans mengalami gangguan.'),
          onClose: () => alert('Info: Kamu menutup jendela pembayaran.'),
        });
      } else {
        throw new Error('Midtrans Snap SDK belum siap.');
      }
    } catch (err: unknown) {
      alert(`Gagal Checkout: ${err instanceof Error ? err.message : 'Terjadi kendala teknis'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    cartItems,
    shippingRates,
    addresses,
    selectedAddress,
    loadingCart,
    loadingShipping,
    submitting,
    isAddressModalOpen,
    setIsAddressModalOpen,
    selectedCourier,
    setSelectedCourier,
    handleSelectAddress,
    calculateSubtotal,
    shippingCost,
    grandTotal,
    handlePlaceOrder,
  };
}