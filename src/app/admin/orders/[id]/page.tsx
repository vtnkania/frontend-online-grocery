'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Truck, CheckCircle, ShoppingBag, AlertTriangle, Ban, MapPin, Store } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/axios';

interface AdminOrderItem {
  id: string;
  quantity: number;
  priceSnapshot: string;
  product: {
    name: string;
  };
}

interface RawAddress {
  name?: string;
  recipientName?: string;
  receiverName?: string;
  contactName?: string;
  receivedBy?: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  street?: string;
  detail?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  postcode?: string;
}

interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface AdminOrderDetail {
  id: string;
  status: 'WAITING_PAYMENT' | 'PROCESSING' | 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  courierCompany: string;
  courierName: string;
  user?: UserProfile;
  store?: { name?: string; city?: string; address?: string };
  address?: RawAddress;
  shipping?: {
    originStore?: { name?: string; city?: string; address?: string };
    destinationAddress?: RawAddress;
  };
  items: AdminOrderItem[];
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchAdminOrderDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${orderId}`);
        if (res.status === 200) {
          setOrder(res.data?.data || res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminOrderDetail();
  }, [orderId]);

  const handleUpdateStatus = async (endpoint: string, confirmMessage: string) => {
    if (!order) return;
    if (!confirm(confirmMessage)) return;

    try {
      setActionLoading(true);
      const res = await api.patch(`/orders/${endpoint}`, { orderId: order.id });

      if (res.status === 200) {
        alert('🎉 Status pesanan sukses diperbarui!');
        router.push('/admin/orders');
      } else {
        alert('Gagal memperbarui status pesanan');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs text-gray-400 animate-pulse font-medium">Memuat data verifikasi nota cabang...</div>;
  if (!order) return <div className="text-center py-12 text-xs text-red-500 font-bold">Data pesanan tidak terdaftar di database.</div>;

  // 📍 Resolusi Data Toko Pengirim
  const originStore = order.store || order.shipping?.originStore;

  // 📍 Resolusi Lengkap Alamat Pembeli / Nama Penerima
  const rawAddr = order.address || order.shipping?.destinationAddress;
  
  // Deteksi Nama Penerima dari Objek Alamat atau Objek User
  const recipientName =
    rawAddr?.recipientName ||
    rawAddr?.receiverName ||
    rawAddr?.contactName ||
    rawAddr?.receivedBy ||
    rawAddr?.name ||
    order.user?.name ||
    'Jekak';

  const recipientPhone =
    rawAddr?.phone ||
    rawAddr?.phoneNumber ||
    order.user?.phone ||
    '08123456789';
  
  const streetDetail = rawAddr?.address || rawAddr?.street || rawAddr?.detail || 'RT 01 / RW 01, Jalan Pandanaran, RW 04, Pekunden';
  const cityDetail = rawAddr?.city || 'Kota Semarang';
  const provinceDetail = rawAddr?.province || 'Jawa Tengah';
  const postalDetail = rawAddr?.postalCode || rawAddr?.postcode ? `Kode Pos ${rawAddr?.postalCode || rawAddr?.postcode}` : 'Kode Pos 50241';

  const fullAddressString = [streetDetail, cityDetail, provinceDetail, postalDetail]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 md:p-6 text-slate-900 text-xs font-sans">
      <div className="max-w-xl mx-auto bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        
        {/* Navigation Top Header */}
        <div className="bg-slate-50 border-b p-4 flex items-center gap-3">
          <Link href="/admin/orders" className="p-1.5 rounded-lg border bg-white text-gray-500 hover:bg-gray-100 transition">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Lembar Eksekusi Manajer Toko</h1>
            <p className="text-[10px] font-mono font-bold text-gray-400 uppercase">ID: {order.id}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          
          {/* Status Banner */}
          <div className="bg-slate-900 text-white p-3 rounded-xl font-bold text-center tracking-wide uppercase">
            STATUS SAAT INI: <span className="text-amber-400 ml-1 font-black">{order.status}</span>
          </div>

          {/* 📍 LOKASI CABANG & ALAMAT LENGKAP PEMBELI */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-200 space-y-3">
            {/* Toko Pengirim */}
            <div className="flex items-start gap-2.5 border-b border-gray-200/80 pb-2.5">
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                <Store className="size-3.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dikirim Dari Cabang</p>
                <p className="font-bold text-slate-900">{originStore?.name || 'FreshMart Semarang'}</p>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  {originStore?.address || originStore?.city || 'Semarang'}
                </p>
              </div>
            </div>

            {/* Alamat Tujuan */}
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-red-100 text-red-600 rounded-lg shrink-0 mt-0.5">
                <MapPin className="size-3.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Alamat Tujuan Penerima</p>
                <p className="font-bold text-slate-900 text-xs">
                  {recipientName} {recipientPhone && <span className="text-gray-600 font-normal ml-1">({recipientPhone})</span>}
                </p>
                <p className="text-gray-600 text-[11px] leading-relaxed mt-0.5">
                  {fullAddressString}
                </p>
              </div>
            </div>
          </div>

          {/* List Item */}
          <div className="space-y-2">
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <ShoppingBag className="size-4 text-blue-600" /> Barang Yang Wajib Dikemas & Disiapkan
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border space-y-2 font-bold text-slate-800">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between border-b last:border-0 pb-1.5 last:pb-0 border-gray-100">
                  <span>{item.product?.name}</span>
                  <span className="text-teal-700 font-black">x{item.quantity} Pcs</span>
                </div>
              ))}
            </div>
          </div>

          {/* Logistik */}
          <div className="bg-slate-50 p-3 rounded-xl border space-y-1.5 font-semibold text-gray-600">
            <p className="font-bold text-slate-800 flex items-center gap-1 mb-1"><Truck className="size-4 text-indigo-600" /> Informasi Pengiriman Jasa Logistik</p>
            <div className="flex justify-between">
              <span>Nama Kurir Mitra</span>
              <span className="text-slate-900 font-black uppercase">{order.courierCompany} - {order.courierName}</span>
            </div>
            <div className="flex justify-between">
              <span>Ongkos Kirim Kurir</span>
              <span className="text-slate-900 font-black">Rp {Number(order.shippingCost).toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Workflow Buttons */}
          <div className="pt-2 space-y-2">
            {order.status === 'PROCESSING' && (
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('prepare', 'Apakah barang belanjaan ini siap dipindahkan ke meja pengemasan?')}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Package className="size-4" /> Mulai Kemas Paket (Ubah ke PREPARING)
              </button>
            )}

            {order.status === 'PREPARING' && (
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('ready-to-ship', 'Apakah packing sudah rapi dan sistem bisa mulai memanggil kurir ojol?')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="size-4" /> Selesai Dikemas - Menunggu Kurir (Ubah ke READY_TO_SHIP)
              </button>
            )}

            {order.status === 'READY_TO_SHIP' && (
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('ship', 'Apakah paket belanjaan resmi diserahkan ke kurir?')}
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Truck className="size-4" /> Serahkan ke Kurir (Ubah ke SHIPPED)
              </button>
            )}

            {(order.status === 'PROCESSING' || order.status === 'PREPARING') && (
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('cancel', '🔴 PERINGATAN: Apakah Anda yakin ingin membatalkan pesanan ini?')}
                className="w-full py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Ban className="size-3.5" /> Batalkan Pesanan (Proses Refund Manual)
              </button>
            )}

            {(order.status === 'SHIPPED' || order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
              <div className="p-3 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl text-center font-bold flex items-center justify-center gap-1">
                <AlertTriangle className="size-4 text-gray-400" /> Alur kerja lembar aksi ini telah selesai diarsip.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}