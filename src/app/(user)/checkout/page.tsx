'use client';

import { useEffect, useState } from 'react';
import { getUserCart } from '@/services/cart.service'; // Sesuaikan dengan path service cart kelompokmu
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  quantity: number;
  priceSnapshot: string;
  product: { 
    id: string;
    name: string; 
    slug: string; 
    price: string;
    productImages?: { id: string; url: string; }[];
  };
}

interface ShippingRate {
  company: string;
  type: string;
  rate: number; // 👈 FIX: Menggunakan 'rate' sesuai objek return backend Biteship kelompokmu!
  duration: string;
}

interface MidtransSnap {
  pay: (token: string, options: {
    onSuccess: (result: unknown) => void;
    onPending: (result: unknown) => void;
    onError: (result: unknown) => void;
    onClose: () => void;
  }) => void;
}

declare global {
  interface Window {
    snap?: MidtransSnap;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingShipping, setLoadingShipping] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State Kurir Pilihan
  const [selectedCourier, setSelectedCourier] = useState<ShippingRate | null>(null);
  
  // State Metode Pembayaran
  const [paymentMethod, setPaymentMethod] = useState<'MIDTRANS' | 'MANUAL'>('MIDTRANS');

  const dummyUserId = "c2ab071d-03b2-4343-a842-210d4e208d89";

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const res = await getUserCart();
        setCartItems(res.items || []);
      } catch (err) {
        console.error('Gagal memuat data checkout:', err);
      } finally {
        setLoadingCart(false);
      }
    };

    const fetchShippingRates = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/shippings/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: dummyUserId })
        });
        const result = await response.json();
        if (result.success) {
          setShippingRates(result.data || []);
          if (result.data && result.data.length > 0) {
            setSelectedCourier(result.data[0]); 
          }
        }
      } catch (err) {
        console.error('Gagal memuat ongkir Biteship:', err);
      } finally {
        setLoadingShipping(false);
      }
    };

    fetchCheckoutData();
    fetchShippingRates();

    const snapScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
    const myMidtransClientKey = 'SB-Mid-client-Z7Mv95Nq-K_eD7-6'; 
    
    let scriptTag = document.querySelector(`script[src="${snapScriptUrl}"]`);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('src', snapScriptUrl);
      scriptTag.setAttribute('data-client-key', myMidtransClientKey);
      document.body.appendChild(scriptTag);
    }
  }, []);

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + (Number(item.priceSnapshot) * item.quantity), 0);
  };

  const shippingCost = selectedCourier ? selectedCourier.rate : 0; // 👈 FIX: disesuaikan ke .rate
  const grandTotal = calculateSubtotal() + shippingCost;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !selectedCourier) {
      alert('Silakan pilih opsi kurir pengiriman terlebih dahulu!');
      return;
    }
    setSubmitting(true);

    try {
      const orderResponse = await fetch('http://localhost:8000/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: dummyUserId,
          courierCompany: selectedCourier.company,
          courierName: selectedCourier.type,
          shippingCost: selectedCourier.rate // 👈 FIX: disesuaikan ke .rate
        })
      });

      const orderResult = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderResult.message || 'Gagal membuat invoice.');

      const createdOrderId = orderResult.data.id;

      if (paymentMethod === 'MIDTRANS') {
        const midtransResponse = await fetch('http://localhost:8000/api/v1/payments/qris', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: createdOrderId })
        });

        const midtransResult = await midtransResponse.json();
        if (!midtransResponse.ok) throw new Error(midtransResult.message || 'Gagal memicu Midtrans token.');

        const snapToken = midtransResult.data.token;

        if (window.snap) {
          window.snap.pay(snapToken, {
            onSuccess: function () {
              alert('🎉 Pembayaran Berhasil via Midtrans! Status pesananmu otomatis diperbarui.');
              router.push('/cart');
            },
            onPending: function () {
              alert('⏳ Menunggu pembayaranmu diselesaikan di aplikasi e-wallet / bank.');
              router.push('/cart');
            },
            onError: function () {
              alert('❌ Pembayaran Midtrans mengalami gangguan, silakan coba lagi.');
            },
            onClose: function () {
              alert('Info: Kamu menutup jendela pembayaran Midtrans.');
            }
          });
        } else {
          throw new Error('Sistem pembayaran gagal dimuat, silakan muat ulang halaman.');
        }
      } else {
        alert('📦 Order sukses dibuat! Silakan lakukan transfer manual ke rekening bank kami.');
        alert(`Silakan simpan Order ID ini untuk konfirmasi bayar:\n${createdOrderId}`);
        router.push('/cart');
      }

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kendala teknis';
      alert(`Gagal Checkout: ${errMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCart) return <div className="text-center py-12 text-xs text-gray-500 animate-pulse">Memuat data keranjang...</div>;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <p className="text-sm text-gray-500 mb-4">Keranjang belanja kosong.</p>
        <Link href="/cart" className="inline-block px-4 py-2 bg-green-600 text-white text-sm rounded-lg">Kembali Belanja</Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI */}
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-xl font-bold text-gray-900">Checkout Terintegrasi</h1>
          
          {/* Ringkasan Produk */}
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
            <h2 className="text-sm font-bold text-gray-800 border-b pb-2">📦 Produk Belanja</h2>
            {cartItems.map((item) => {
              const prod = item.product;
              const imgUrl = prod.productImages && prod.productImages.length > 0 ? prod.productImages[0].url : '/placeholder-grocery.png';
              return (
                <div key={item.id} className="flex items-center justify-between text-xs pb-2 border-b last:border-0 border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 relative overflow-hidden rounded border border-gray-100">
                      <Image 
                        src={imgUrl} 
                        alt={prod.name} 
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{prod.name}</h4>
                      <p className="text-gray-500">{item.quantity} x Rp {Number(item.priceSnapshot).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <span className="font-semibold">Rp {(Number(item.priceSnapshot) * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              );
            })}
          </div>

          {/* Opsi Kurir Real-Time dari Biteship */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h2 className="text-sm font-bold text-gray-800 mb-3">🚚 Opsi Pengiriman (Biteship Live API)</h2>
            {loadingShipping ? (
              <p className="text-xs text-gray-400 animate-pulse">Menghitung jarak & tarif ongkir...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {shippingRates.map((rate, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedCourier(rate)}
                    className={`p-3 text-left border rounded-xl text-xs transition ${selectedCourier?.type === rate.type && selectedCourier?.company === rate.company ? 'border-green-600 bg-green-50/50 text-green-700 font-medium' : 'border-gray-200 text-gray-600'}`}
                  >
                    <p className="font-bold uppercase">{rate.company}</p>
                    <p className="text-[10px] text-gray-500">{rate.type} ({rate.duration})</p>
                    <p className="mt-2 font-semibold text-gray-900">Rp {rate.rate.toLocaleString('id-ID')}</p> {/* 👈 FIX: disesuaikan ke .rate */}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PILIHAN METODE PEMBAYARAN */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h2 className="text-sm font-bold text-gray-800 mb-3">💳 Pilihan Metode Pembayaran</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('MIDTRANS')}
                className={`p-4 text-center border rounded-xl transition ${paymentMethod === 'MIDTRANS' ? 'border-green-600 bg-green-50/50 text-green-700 font-bold' : 'border-gray-200 text-gray-600'}`}
              >
                <p className="text-xs">Midtrans (Otomatis)</p>
                <p className="text-[10px] text-gray-400 font-normal mt-1">QRIS, GoPay, Mandiri VA</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('MANUAL')}
                className={`p-4 text-center border rounded-xl transition ${paymentMethod === 'MANUAL' ? 'border-green-600 bg-green-50/50 text-green-700 font-bold' : 'border-gray-200 text-gray-600'}`}
              >
                <p className="text-xs">Manual Transfer Bank</p>
                <p className="text-[10px] text-gray-400 font-normal mt-1">Upload Bukti Transfer</p>
              </button>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4 sticky top-6">
            <h2 className="text-sm font-bold text-gray-900 border-b pb-2">Ringkasan Biaya</h2>
            
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal Produk</span>
                <span>Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkir ({selectedCourier?.company || '-'})</span>
                <span>Rp {shippingCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between border-t pt-3 font-bold text-sm text-gray-900">
                <span>Total Tagihan</span>
                <span className="text-green-600">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="block w-full py-3 bg-green-600 text-white font-medium text-xs rounded-lg hover:bg-green-700 text-center disabled:bg-gray-400"
            >
              {submitting ? 'Menghubungkan ke API...' : paymentMethod === 'MIDTRANS' ? 'Bayar Aman via Midtrans' : 'Buat Pesanan & Transfer'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}