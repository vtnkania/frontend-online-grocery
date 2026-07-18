'use client';

import React, { useEffect, useState } from 'react';
import { getUserCart } from '@/services/cart.service'; 
import { getUserAddresses, setPrimaryAddress } from '@/services/address.service'; 
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronRight, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth'; 

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
    productImages?: { id: string; url: string; }[];
  };
}

interface ShippingRate {
  company: string;
  type: string;
  rate: number; 
  duration: string;
}

interface Address {
  id: string;
  label: string; 
  receiver: string; 
  phone: string; 
  address: string; 
  isPrimary: boolean;
  latitude: number;
  longitude: number;
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
  const [paymentMethod, setPaymentMethod] = useState<'MIDTRANS' | 'MANUAL'>('MIDTRANS');

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlStoreId = searchParams.get('storeId');
        const urlItemIds = searchParams.get('itemIds'); 

        const res = await getUserCart();
        let filteredItems: CartItem[] = res.items || [];

        if (urlStoreId) {
          filteredItems = filteredItems.filter(
            (item) => (item.store?.id || 'default-store') === urlStoreId
          );
        }

        if (urlItemIds) {
          const allowedIds = urlItemIds.split(',');
          filteredItems = filteredItems.filter((item) => allowedIds.includes(item.id));
        }

        setCartItems(filteredItems);
      } catch (err) {
        console.error('Gagal memuat data checkout:', err);
      } finally {
        setLoadingCart(false);
      }
    };
    fetchCheckoutData();

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

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchAddressesData = async () => {
      const data = await getUserAddresses(user.id);
      const list: Address[] = (data || []).filter(
        (addr: Address) => addr && addr.id && addr.address
      );
      
      setAddresses(list);
      
      const primary = list.find((addr) => addr.isPrimary);
      if (primary) {
        setSelectedAddress(primary);
      } else if (list.length > 0) {
        setSelectedAddress(list[0]);
      } else {
        setSelectedAddress(null);
      }
    };
    fetchAddressesData();
  }, [user]);

  // 🚀 FIXED SHIPPING METHOD WITH BRANCH SYNC
  useEffect(() => {
    if (!selectedAddress || !user?.id) {
      const timer = setTimeout(() => {
        setShippingRates([]);
        setSelectedCourier(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    const fetchShippingRates = async () => {
      try {
        setLoadingShipping(true);
        setSelectedCourier(null);
        
        // Ambil storeId dari produk pertama yang saat ini masuk proses checkout
        const currentStoreId = cartItems[0]?.store?.id;

        const response = await fetch('http://localhost:8000/api/v1/shippings/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Kirim userId beserta storeId agar backend Biteship tahu titik origin pengiriman aslinya
          body: JSON.stringify({ 
            userId: user.id,
            storeId: currentStoreId
          })
        });
        const result = await response.json();
        if (result.success) {
          setShippingRates(result.data || []);
          if (result.data && result.data.length > 0) {
            setSelectedCourier(result.data[0]); 
          }
        } else {
          setShippingRates([]);
        }
      } catch (err) {
        console.error('Gagal memuat ongkir Biteship:', err);
        setShippingRates([]);
      } finally {
        setLoadingShipping(false);
      }
    };

    fetchShippingRates();
  }, [selectedAddress, user, cartItems]); // 🚀 FIXED: Menambahkan cartItems ke dependensi agar triger berjalan pasca cart terisi data

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

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + (Number(item.priceSnapshot) * item.quantity), 0);
  };

  const shippingCost = selectedCourier ? selectedCourier.rate : 0; 
  const grandTotal = calculateSubtotal() + shippingCost;

  const handlePlaceOrder = async () => {
    if (!user?.id) {
      alert('Sesi belanja berakhir, silakan login kembali.');
      return;
    }
    if (!selectedAddress) {
      alert('Silakan masukkan/pilih alamat pengiriman terlebih dahulu!');
      return;
    }
    if (cartItems.length === 0 || !selectedCourier) {
      alert('Silakan pilih opsi kurir pengiriman terlebih dahulu!');
      return;
    }
    setSubmitting(true);

    try {
      const orderResponse = await fetch('http://localhost:8000/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 🚀 FIXED: Parameter paymentMethod sekarang ikut dikirimkan ke backend Express kalian!
        body: JSON.stringify({
          userId: user.id,
          courierCompany: selectedCourier.company,
          courierName: selectedCourier.type,
          shippingCost: selectedCourier.rate,
          cartItemIds: cartItems.map((item) => item.id),
          paymentMethod: paymentMethod
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
            onSuccess: async function () {
              try {
                await fetch('http://localhost:8000/api/v1/payments/midtrans-notification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    order_id: createdOrderId,
                    transaction_status: 'settlement',
                    fraud_status: 'accept'
                  })
                });
                alert('🎉 Pembayaran Berhasil via Midtrans! Status pesananmu otomatis diperbarui.');
                router.push(`/orders/${createdOrderId}`);
              } catch (webhookErr) {
                console.error('Gagal sinkronisasi pembayaran otomatis:', webhookErr);
                router.push(`/orders/${createdOrderId}`);
              }
            },
            onPending: function () {
              alert('⏳ Menunggu pembayaranmu diselesaikan di aplikasi e-wallet / bank.');
              router.push(`/orders/${createdOrderId}`);
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
        router.push(`/orders/${createdOrderId}`);
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
        <p className="text-sm text-gray-500 mb-4">Tidak ada produk yang valid untuk diproses dari cabang ini.</p>
        <Link href="/cart" className="inline-block px-4 py-2 bg-green-600 text-white text-sm rounded-lg">Kembali Ke Keranjang</Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-55 p-4 md:p-8 text-slate-900">
      
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Checkout Terintegrasi</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* KOLOM KIRI */}
          <div className="md:col-span-2 space-y-4">
            
            {/* Alamat Pengiriman */}
            <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <MapPin className="size-4 text-green-600" /> Alamat Pengiriman
              </h2>
              
              {!selectedAddress ? (
                <div className="border border-dashed border-gray-300 rounded-xl p-5 text-center bg-gray-50/50">
                  <p className="text-xs text-gray-500 mb-3">Kamu belum menentukan atau memiliki alamat pengiriman belanja.</p>
                  <Link 
                    href="/addresses" 
                    className="inline-flex items-center text-xs font-bold text-green-600 bg-green-55 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 transition shadow-2xs"
                  >
                    ➕ Tambah Alamat Baru
                  </Link>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-gray-100 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 bg-white border px-2 py-0.5 rounded-md shadow-2xs text-[10px]">
                        {selectedAddress.label}
                      </span>
                      <span className="font-semibold text-gray-700">
                        {selectedAddress.receiver} ({selectedAddress.phone})
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed font-medium pt-0.5">
                      {selectedAddress.address}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="shrink-0 text-xs font-bold text-green-600 hover:underline flex items-center gap-0.5 mt-0.5"
                  >
                    Ubah <ChevronRight className="size-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Ringkasan Produk Belanja */}
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
                        <h4 className="font-bold text-gray-950">{prod.name}</h4>
                        <p className="text-gray-500 font-medium">{item.quantity} x Rp {Number(item.priceSnapshot).toLocaleString('id-ID')}</p>
                        
                        <p className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                          Dikirim dari: FreshMart Cabang {item.store?.name || 'Utama'}
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900">Rp {(Number(item.priceSnapshot) * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                );
              })}
            </div>

            {/* OPSI PENGIRIMAN BITESHIP */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-bold text-gray-800 mb-3">🚚 Opsi Pengiriman (Biteship Live API)</h2>
              
              {!selectedAddress ? (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs text-center font-medium shadow-3xs">
                  ⚠️ Silakan tentukan/pilih alamat pengiriman terlebih dahulu untuk memunculkan pilihan kurir pengiriman.
                </div>
              ) : loadingShipping ? (
                <div className="p-4 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl text-xs text-center font-medium animate-pulse">
                  🔄 Sedang menghitung koordinat jarak & mencari pilihan kurir terbaik...
                </div>
              ) : shippingRates.length === 0 ? (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs text-center font-medium">
                  ❌ Jarak antar lokasi alamat Anda dengan Cabang Toko terlalu jauh atau layanan kurir sedang tidak tersedia.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {shippingRates.map((rate, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedCourier(rate)}
                      className={`p-3 text-left border rounded-xl text-xs transition ${selectedCourier?.type === rate.type && selectedCourier?.company === rate.company ? 'border-green-600 bg-green-55 border-green-200 text-green-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-slate-55/50'}`}
                    >
                      <p className="font-bold uppercase tracking-wide">{rate.company}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{rate.type} ({rate.duration})</p>
                      <p className="mt-2 font-black text-gray-900 text-sm">Rp {rate.rate.toLocaleString('id-ID')}</p> 
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* METODE PEMBAYARAN */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-bold text-gray-800 mb-3">💳 Pilihan Metode Pembayaran</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MIDTRANS')}
                  className={`p-4 text-center border rounded-xl transition ${paymentMethod === 'MIDTRANS' ? 'border-green-600 bg-green-55 text-green-700 font-bold' : 'border-gray-200 text-gray-600'}`}
                >
                  <p className="text-xs">Midtrans (Otomatis)</p>
                  <p className="text-[10px] text-gray-400 font-normal mt-1">QRIS, GoPay, Mandiri VA</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('MANUAL')}
                  className={`p-4 text-center border rounded-xl transition ${paymentMethod === 'MANUAL' ? 'border-green-600 bg-green-55 text-green-700 font-bold' : 'border-gray-200 text-gray-600'}`}
                >
                  <p className="text-xs">Manual Transfer Bank</p>
                  <p className="text-[10px] text-gray-400 font-normal mt-1">Upload Bukti Transfer</p>
                </button>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4 sticky top-24">
              <h2 className="text-sm font-bold text-gray-900 border-b pb-2">Ringkasan Biaya</h2>
              
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between font-medium">
                  <span>Subtotal Produk</span>
                  <span className="font-bold text-slate-900">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Ongkir ({selectedCourier?.company || '-'})</span>
                  <span className="font-bold text-slate-900">Rp {shippingCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-t pt-3 font-black text-sm text-gray-900">
                  <span>Total Tagihan</span>
                  <span className="text-green-600 text-base">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={submitting || !selectedAddress || !selectedCourier}
                className="block w-full py-3 bg-green-600 text-white font-bold text-xs rounded-lg hover:bg-green-700 text-center disabled:bg-gray-300 disabled:cursor-not-allowed shadow-2xs transition active:scale-[0.99]"
              >
                {submitting ? 'Menghubungkan ke API...' : !selectedAddress ? 'Pilih Alamat Terlebih Dahulu' : !selectedCourier ? 'Pilih Opsi Pengiriman' : paymentMethod === 'MIDTRANS' ? 'Bayar Aman via Midtrans' : 'Buat Pesanan & Transfer'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL POPUP SELECTION: LIST ALAMAT */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsAddressModalOpen(false)} 
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <X className="size-5" />
            </button>
            
            <h3 className="text-base font-bold text-gray-950 mb-1">Pilih Alamat Tujuan</h3>
            <p className="text-xs text-gray-500 mb-4">Pilih alamat pengiriman terdaftar untuk menyesuaikan perhitungan ongkir dari cabang gudang toko terdekat.</p>
            
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-400 mb-2">Belum ada daftar alamat terdaftar.</p>
                  <Link href="/addresses" className="text-xs font-bold text-green-600 underline">Kelola Alamat</Link>
                </div>
              ) : (
                addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => handleSelectAddress(addr)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-2 text-xs relative ${selectedAddress?.id === addr.id ? 'border-green-600 bg-green-55/10' : 'border-gray-200 hover:bg-gray-55'}`}
                  >
                    <div className="space-y-1 pr-6">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 bg-white border px-1.5 py-0.5 rounded text-[9px] shadow-3xs">
                          {addr.label}
                        </span>
                        <span className="font-semibold text-gray-700">{addr.receiver}</span>
                      </div>
                      <p className="text-gray-500 font-medium line-clamp-2 leading-relaxed">{addr.address}</p>
                    </div>
                    {selectedAddress?.id === addr.id && (
                      <Check className="size-4 text-green-600 absolute top-3 right-3" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}