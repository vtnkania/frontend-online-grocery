'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Store, Package, Clock, Truck, Ban, CheckCircle } from 'lucide-react';

interface AdminOrderSummary {
  id: string;
  status: 'WAITING_PAYMENT' | 'PROCESSING' | 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: string | number;
  createdAt: string;
  storeId: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState<'Antrean Baru' | 'Sedang Dikemas' | 'Siap Kirim' | 'Dikirim Kurir' | 'Selesai Diterima' | 'Dibatalkan'>('Antrean Baru');

  useEffect(() => {
    const fetchAdminOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/api/v1/orders?userId=6e1128e3-802e-4b2b-bcd3-5da47bd7de12`);
        const result = await res.json();
        if (res.ok) {
          setOrders(result.data || []);
        }
      } catch (err) {
        console.error('Gagal memuat antrean pesanan admin:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminOrders();
  }, []);

  const filteredAdminOrders = orders.filter((order) => {
    if (adminTab === 'Antrean Baru') return order.status === 'PROCESSING';
    if (adminTab === 'Sedang Dikemas') return order.status === 'PREPARING';
    if (adminTab === 'Siap Kirim') return order.status === 'READY_TO_SHIP';
    if (adminTab === 'Dikirim Kurir') return order.status === 'SHIPPED';
    if (adminTab === 'Selesai Diterima') return order.status === 'DELIVERED';
    if (adminTab === 'Dibatalkan') return order.status === 'CANCELLED';
    return false;
  });

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 md:p-6 text-slate-900 text-xs font-sans">
      <div className="max-w-4xl mx-auto space-y-5">
        
        {/* Top Header Panel */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-3xs">
          <div className="space-y-1">
            <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Store className="size-4 text-teal-800" /> Admin Panel: Store Order Flow
            </h1>
            <p className="text-gray-400 font-medium text-[11px]">
              Kelola penyiapan barang dan serah terima logistik kurir cabang: <b className="text-slate-700">Tangerang 2</b>
            </p>
          </div>
        </div>

        {/* Task Bar Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-3xs font-bold text-[11px] overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setAdminTab('Antrean Baru')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${adminTab === 'Antrean Baru' ? 'bg-blue-600 text-white shadow-3xs' : 'text-gray-500 hover:bg-slate-100'}`}
          >
            <Clock className="size-3.5" /> Perlu Dikemas ({orders.filter(o => o.status === 'PROCESSING').length})
          </button>
          
          <button
            onClick={() => setAdminTab('Sedang Dikemas')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${adminTab === 'Sedang Dikemas' ? 'bg-amber-500 text-white shadow-3xs' : 'text-gray-500 hover:bg-slate-100'}`}
          >
            <Package className="size-3.5" /> Sedang Dikemas ({orders.filter(o => o.status === 'PREPARING').length})
          </button>
          
          <button
            onClick={() => setAdminTab('Siap Kirim')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${adminTab === 'Siap Kirim' ? 'bg-indigo-600 text-white shadow-3xs' : 'text-gray-500 hover:bg-slate-100'}`}
          >
            <Truck className="size-3.5" /> Menunggu Kurir ({orders.filter(o => o.status === 'READY_TO_SHIP').length})
          </button>

          <button
            onClick={() => setAdminTab('Dikirim Kurir')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${adminTab === 'Dikirim Kurir' ? 'bg-purple-600 text-white shadow-3xs' : 'text-gray-500 hover:bg-slate-100'}`}
          >
            <Truck className="size-3.5 text-purple-200" /> Dikirim Kurir ({orders.filter(o => o.status === 'SHIPPED').length})
          </button>

          <button
            onClick={() => setAdminTab('Selesai Diterima')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${adminTab === 'Selesai Diterima' ? 'bg-emerald-600 text-white shadow-3xs' : 'text-gray-500 hover:bg-slate-100'}`}
          >
            <CheckCircle className="size-3.5" /> Selesai ({orders.filter(o => o.status === 'DELIVERED').length})
          </button>
          
          <button
            onClick={() => setAdminTab('Dibatalkan')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${adminTab === 'Dibatalkan' ? 'bg-red-600 text-white shadow-3xs' : 'text-gray-500 hover:bg-slate-100'}`}
          >
            <Ban className="size-3.5" /> Dibatalkan ({orders.filter(o => o.status === 'CANCELLED').length})
          </button>
        </div>

        {/* Table List Data */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 animate-pulse font-medium">Memuat data antrean cabang...</div>
        ) : filteredAdminOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border text-gray-400 font-medium">
            📭 Tidak ada data pesanan dalam kategori {adminTab} saat ini.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-3xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-gray-400 font-bold">
                  <th className="p-3 text-[10px]">INVOICE ORDER ID</th>
                  <th className="p-3 text-[10px]">TANGGAL MASUK</th>
                  <th className="p-3 text-[10px]">TOTAL TRANSAKSI</th>
                  <th className="p-3 text-[10px] text-center">PANEL AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
                {filteredAdminOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{order.id}</td>
                    <td className="p-3 text-gray-500">{new Date(order.createdAt).toLocaleString('id-ID')}</td>
                    <td className="p-3 font-bold text-slate-900">Rp {Number(order.totalAmount).toLocaleString('id-ID')}</td>
                    <td className="p-3 text-center">
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-950 text-white font-bold rounded-lg hover:bg-slate-800 transition shadow-2xs text-[11px]"
                      >
                        {/* 🚀 FIXED UX: Teks berubah jadi Lihat Detail secara dinamis jika alur kerja logistiknya sudah selesai */}
                        {['PROCESSING', 'PREPARING', 'READY_TO_SHIP'].includes(order.status) ? 'Kelola Proses' : 'Lihat Detail'} 
                        <ArrowRight className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}