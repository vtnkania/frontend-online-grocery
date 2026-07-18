'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Truck, CheckCircle, ShoppingBag, AlertTriangle, Ban } from 'lucide-react';
import Link from 'next/link';

interface AdminOrderItem {
  id: string;
  quantity: number;
  priceSnapshot: string;
  product: {
    name: string;
  };
}

interface AdminOrderDetail {
  id: string;
  status: 'WAITING_PAYMENT' | 'PROCESSING' | 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  courierCompany: string;
  courierName: string;
  items: AdminOrderItem[];
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // 🚀 FIXED: Memindahkan deklarasi fungsi fetchOrderDetail ke dalam useEffect agar terhindar dari exhaustive-deps ESLint warning
  useEffect(() => {
    if (!orderId) return;

    const fetchAdminOrderDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/api/v1/orders/${orderId}`);
        const result = await res.json();
        if (res.ok) {
          setOrder(result.data);
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
      const res = await fetch(`http://localhost:8000/api/v1/orders/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });

      if (res.ok) {
        alert('🎉 Status pesanan sukses diperbarui di database Prisma!');
        router.push('/admin/orders');
      } else {
        const errResult = await res.json();
        alert(`Gagal: ${errResult.message}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs text-gray-400 animate-pulse font-medium">Memuat data verifikasi nota cabang...</div>;
  if (!order) return <div className="text-center py-12 text-xs text-red-500 font-bold">Data pesanan tidak terdaftar di database.</div>;

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 md:p-6 text-slate-900 text-xs font-sans">
      <div className="max-w-xl mx-auto bg-white rounded-xl border border-gray-200 shadow-3xs overflow-hidden">
        
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

          {/* List Packing Item */}
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

          {/* Logistik Data Info */}
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

          {/* DYNAMIC ACTION WORKFLOW BUTTONS */}
          <div className="pt-2 space-y-2">
            
            {/* Step 1: PROCESSING -> PREPARING */}
            {order.status === 'PROCESSING' && (
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('prepare', 'Apakah barang belanjaan ini siap dipindahkan ke meja pengemasan?')}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Package className="size-4" /> Mulai Kemas Paket (Ubah ke PREPARING)
              </button>
            )}

            {/* Step 2: PREPARING -> READY_TO_SHIP */}
            {order.status === 'PREPARING' && (
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('ready-to-ship', 'Apakah packing sudah rapi dan sistem bisa mulai memanggil kurir ojol?')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="size-4" /> Selesai Dikemas - Menunggu Kurir (Ubah ke READY_TO_SHIP)
              </button>
            )}

            {/* Step 3: READY_TO_SHIP -> SHIPPED */}
            {order.status === 'READY_TO_SHIP' && (
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('ship', 'Apakah paket belanjaan resmi diserahkan ke Jaka sang kurir ojol?')}
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Truck className="size-4" /> Serahkan ke Kurir (Ubah ke SHIPPED)
              </button>
            )}

            {/* Admin membatalkan orderan lunas */}
            {(order.status === 'PROCESSING' || order.status === 'PREPARING') && (
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('cancel', '🔴 PERINGATAN: Apakah Anda yakin ingin membatalkan pesanan ini sepihak? Toko wajib melakukan refund uang manual!')}
                className="w-full py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Ban className="size-3.5" /> Batalkan Pesanan (Proses Refund Manual)
              </button>
            )}

            {/* Default Safe Alert */}
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