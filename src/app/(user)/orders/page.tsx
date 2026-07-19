'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  priceSnapshot: string;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  status: 'WAITING_PAYMENT' | 'PROCESSING' | 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: string | number;
  createdAt: string;
  shipping?: {
    courier: string;
    service: string;
  } | null;
  items: OrderItem[];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  // 🚀 POIN 2 DISKUSI LO: Menambahkan tab Dibatalkan di sebelah kanan Selesai
  const [activeTab, setActiveTab] = useState<'Semua' | 'Belum Bayar' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Dibatalkan'>('Semua');

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchOrdersHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/api/v1/orders?userId=${user.id}`);
        const result = await res.json();
        if (res.ok) {
          setOrders(result.data || []);
        }
      } catch (err) {
        console.error('Gagal memuat riwayat pesanan:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersHistory();
  }, [user]);

  const getStatusLabel = (status: Order['status']) => {
    const labels = {
      WAITING_PAYMENT: { text: 'Menunggu Pembayaran', color: 'text-amber-600 bg-amber-50 border-amber-200 font-bold' },
      PROCESSING: { text: 'Pembayaran Verifikasi', color: 'text-blue-600 bg-blue-50 border-blue-200 font-bold' },
      PREPARING: { text: 'Sedang Dikemas Cabang', color: 'text-amber-600 bg-amber-50 border-amber-200 font-bold' },
      READY_TO_SHIP: { text: 'Mencari Kurir Ojol', color: 'text-indigo-600 bg-indigo-50 border-indigo-200 font-bold' },
      SHIPPED: { text: 'Kurir Di Jalan', color: 'text-purple-600 bg-purple-50 border-purple-200 font-bold' },
      DELIVERED: { text: 'Selesai', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 font-bold' },
      CANCELLED: { text: 'Dibatalkan', color: 'text-red-600 bg-red-50 border-red-200 font-bold' },
    };
    return labels[status] || { text: status, color: 'text-gray-600 bg-gray-50 border-gray-200' };
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'Belum Bayar') return order.status === 'WAITING_PAYMENT';
    if (activeTab === 'Diproses') return order.status === 'PROCESSING' || order.status === 'PREPARING' || order.status === 'READY_TO_SHIP';
    // 🚀 FIXED: Ubah target filter string menjadi 'SHIPPED' agar sinkron dengan status Prisma
    if (activeTab === 'Dikirim') return order.status === 'SHIPPED';
    if (activeTab === 'Selesai') return order.status === 'DELIVERED';
    // 🚀 POIN 2: Loloskan status CANCELLED jika tab Dibatalkan aktif klik oleh konsumen
    if (activeTab === 'Dibatalkan') return order.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-gray-55 p-2 md:p-6 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-4">
        
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="size-5 text-teal-800" /> Pesanan Saya
        </h1>

        {/* DYNAMIC TAB BAR FILTERS */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-3xs text-[11px] font-bold overflow-x-auto whitespace-nowrap">
          {(['Semua', 'Belum Bayar', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === tab ? 'bg-emerald-600 text-white shadow-3xs' : 'text-gray-500 hover:bg-gray-55'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ITERASI KARTU INVOICE */}
        {loading ? (
          <div className="text-center py-8 text-xs text-gray-400 animate-pulse">Memuat riwayat transaksi...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-xs text-gray-400">
            Tidak ada riwayat pesanan di kategori ini.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusStyle = getStatusLabel(order.status);
              return (
                <Link 
                  href={`/orders/${order.id}`}
                  key={order.id}
                  className="block bg-white p-5 rounded-xl border border-gray-200 shadow-3xs hover:border-emerald-500 transition text-xs relative space-y-3 group"
                >
                  {/* Baris Atas: ID & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2.5 border-gray-50">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block tracking-wider">ORDER ID</span>
                      <span className="font-mono font-bold text-gray-800 group-hover:text-emerald-700 transition">{order.id}</span>
                    </div>
                    <div className={`px-2.5 py-1 text-[10px] rounded-md border text-center self-start sm:self-center ${statusStyle.color}`}>
                      {statusStyle.text}
                    </div>
                  </div>

                  {/* Baris Tengah: Daftar Belanja */}
                  <div className="space-y-2 pl-1">
                    {Object.values(
                      order.items.reduce<Record<string, OrderItem & { totalPrice: number }>>((acc, item) => {
                        const key = item.product?.name || 'Item Belanja';
                        if (!acc[key]) acc[key] = { ...item, quantity: 0, totalPrice: 0 };
                        acc[key].quantity += item.quantity;
                        acc[key].totalPrice += Number(item.priceSnapshot) * item.quantity;
                        return acc;
                      }, {})
                    ).map((item, idx) => (
                      <div key={idx} className="flex justify-between font-medium text-gray-600">
                        <span>{item.product?.name} <b className="text-gray-900 ml-0.5">x{item.quantity}</b></span>
                        <span className="font-semibold text-gray-800">Rp {item.totalPrice.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Baris Bawah: Info Live Ojol & Total Pembayaran */}
                  <div className="border-t pt-3 border-dashed border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-gray-400 font-medium">Kurir: </span>
                      <span className="font-bold text-slate-800 uppercase text-[11px]">
                        {order.shipping?.courier ? `${order.shipping.courier} (${order.shipping.service})` : '-'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 font-medium block text-[10px]">Total Tagihan:</span>
                      <span className="font-black text-emerald-600 text-sm">
                        Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}