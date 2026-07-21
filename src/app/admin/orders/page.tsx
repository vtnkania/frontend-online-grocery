'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Store, Package, Clock, Truck, Ban, CheckCircle } from 'lucide-react';
import { api } from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';

interface AdminOrderSummary {
  id: string;
  status: 'WAITING_PAYMENT' | 'WAITING_CONFIRMATION' | 'PROCESSING' | 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: string | number;
  createdAt: string;
  storeId: string;
}

interface StoreItem {
  id: string;
  name: string;
}

interface UserProfileData {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  storeId?: string;
  store_id?: string;
  storeName?: string;
  store_name?: string;
  store?: StoreItem;
  stores?: (StoreItem & { storeId?: string })[];
  adminStores?: { storeId?: string; store?: StoreItem }[];
  adminStore?: { storeId?: string; store?: StoreItem };
  managedStore?: StoreItem;
  data?: UserProfileData;
  user?: UserProfileData;
}

export default function AdminOrdersPage() {
  const { user: authUser } = useAuth();
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState<string>('Memuat Toko...');
  const [adminTab, setAdminTab] = useState<'Antrean Baru' | 'Sedang Dikemas' | 'Siap Kirim' | 'Dikirim Kurir' | 'Selesai Diterima' | 'Dibatalkan'>('Antrean Baru');

  // Helper mengekstrak Store ID dan Nama Toko dari berbagai variasi struktur data
  const extractStoreInfo = (userData: UserProfileData | null | undefined) => {
    if (!userData) return { storeId: null, storeName: null };
    const u = userData.data || userData.user || userData;

    const storeId =
      u.storeId ||
      u.store_id ||
      u.store?.id ||
      u.adminStores?.[0]?.storeId ||
      u.adminStores?.[0]?.store?.id ||
      u.adminStore?.storeId ||
      u.adminStore?.store?.id ||
      u.managedStore?.id ||
      u.stores?.[0]?.id ||
      u.stores?.[0]?.storeId ||
      null;

    const storeName =
      u.store?.name ||
      u.storeName ||
      u.store_name ||
      u.adminStores?.[0]?.store?.name ||
      u.adminStore?.store?.name ||
      u.managedStore?.name ||
      u.stores?.[0]?.name ||
      null;

    return { storeId, storeName };
  };

  useEffect(() => {
    const fetchAdminOrders = async () => {
      try {
        setLoading(true);
        let activeStoreId: string | null = null;
        let activeStoreName: string | null = null;

        // 1. Deteksi dari useAuth()
        if (authUser) {
          const info = extractStoreInfo(authUser as UserProfileData);
          if (info.storeId) activeStoreId = info.storeId;
          if (info.storeName) activeStoreName = info.storeName;
        }

        // 2. Refresh profil server via Axios (otomatis membawa token)
        if (!activeStoreId) {
          try {
            const profileRes = await api.get('/auth/me');
            const serverData = profileRes.data?.data || profileRes.data;
            const info = extractStoreInfo(serverData);
            if (info.storeId) activeStoreId = info.storeId;
            if (info.storeName) activeStoreName = info.storeName;
          } catch {
            console.log('Profile fetch skipped');
          }
        }

        // 3. Fallback: LocalStorage
        if (!activeStoreId && typeof window !== 'undefined') {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              const parsed: UserProfileData = JSON.parse(savedUser);
              const info = extractStoreInfo(parsed);
              if (info.storeId) activeStoreId = info.storeId;
              if (info.storeName) activeStoreName = info.storeName;
            } catch {
              console.error('Gagal parse object user lokal');
            }
          }
        }

        // 4. Smart Matching: Jika storeId belum ketemu, cocokkan nama admin (misal "Admin Semarang") dengan cabang toko
        if (!activeStoreId) {
          try {
            const storesRes = await api.get('/stores');
            const storeList: StoreItem[] = storesRes.data?.data || storesRes.data || [];
            
            const currentUserName = authUser?.name || '';
            const matchedStore = storeList.find((s) =>
              currentUserName.toLowerCase().includes(s.name.toLowerCase()) ||
              s.name.toLowerCase().includes(currentUserName.toLowerCase())
            );

            if (matchedStore) {
              activeStoreId = matchedStore.id;
              activeStoreName = matchedStore.name;
            } else if (storeList.length > 0) {
              activeStoreId = storeList[0].id;
              activeStoreName = storeList[0].name;
            }
          } catch {
            console.log('Store list fetch skipped');
          }
        }

        // Set Label Nama Toko di Header
        if (activeStoreName) {
          setStoreName(activeStoreName);
        } else {
          setStoreName('Semua Cabang / Super Admin');
        }

        // 5. Fetch Antrean Pesanan Berdasarkan Store ID
        if (activeStoreId) {
          const res = await api.get(`/orders?storeId=${activeStoreId}`);
          setOrders(res.data?.data || res.data || []);
        } else {
          const res = await api.get('/orders');
          setOrders(res.data?.data || res.data || []);
        }
      } catch (err: unknown) {
        console.error('Gagal memuat antrean pesanan admin:', err instanceof Error ? err.message : String(err));
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminOrders();
  }, [authUser]);

  // Filterberdasarkan Tab
  const filteredAdminOrders = orders.filter((order) => {
    if (adminTab === 'Antrean Baru') {
      return order.status === 'PROCESSING' || order.status === 'WAITING_PAYMENT' || order.status === 'WAITING_CONFIRMATION';
    }
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
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Store className="size-4 text-teal-800" /> Admin Panel: Store Order Flow
            </h1>
            <p className="text-gray-500 font-medium text-[11px]">
              Kelola penyiapan barang dan serah terima logistik kurir cabang: <b className="text-emerald-700 font-bold">{storeName}</b>
            </p>
          </div>
        </div>

        {/* Task Bar Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-xs font-bold text-[11px] overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setAdminTab('Antrean Baru')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${adminTab === 'Antrean Baru' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:bg-slate-100'}`}
          >
            <Clock className="size-3.5" /> Perlu Dikemas ({
              orders.filter(o => ['PROCESSING', 'WAITING_PAYMENT', 'WAITING_CONFIRMATION'].includes(o.status)).length
            })
          </button>
          
          <button
            onClick={() => setAdminTab('Sedang Dikemas')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${adminTab === 'Sedang Dikemas' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-500 hover:bg-slate-100'}`}
          >
            <Package className="size-3.5" /> Sedang Dikemas ({orders.filter(o => o.status === 'PREPARING').length})
          </button>
          
          <button
            onClick={() => setAdminTab('Siap Kirim')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${adminTab === 'Siap Kirim' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-500 hover:bg-slate-100'}`}
          >
            <Truck className="size-3.5" /> Menunggu Kurir ({orders.filter(o => o.status === 'READY_TO_SHIP').length})
          </button>

          <button
            onClick={() => setAdminTab('Dikirim Kurir')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${adminTab === 'Dikirim Kurir' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-500 hover:bg-slate-100'}`}
          >
            <Truck className="size-3.5 text-purple-200" /> Dikirim Kurir ({orders.filter(o => o.status === 'SHIPPED').length})
          </button>

          <button
            onClick={() => setAdminTab('Selesai Diterima')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${adminTab === 'Selesai Diterima' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:bg-slate-100'}`}
          >
            <CheckCircle className="size-3.5" /> Selesai ({orders.filter(o => o.status === 'DELIVERED').length})
          </button>
          
          <button
            onClick={() => setAdminTab('Dibatalkan')}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${adminTab === 'Dibatalkan' ? 'bg-red-600 text-white shadow-xs' : 'text-gray-500 hover:bg-slate-100'}`}
          >
            <Ban className="size-3.5" /> Dibatalkan ({orders.filter(o => o.status === 'CANCELLED').length})
          </button>
        </div>

        {/* Table List Data */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 animate-pulse font-medium">Memuat data antrean cabang...</div>
        ) : filteredAdminOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border text-gray-400 font-medium">
            📭 Tidak ada data pesanan dalam kategori {adminTab} untuk cabang ini.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-950 text-white font-bold rounded-lg hover:bg-slate-800 transition shadow-xs text-[11px]"
                      >
                        {['PROCESSING', 'PREPARING', 'READY_TO_SHIP', 'WAITING_PAYMENT', 'WAITING_CONFIRMATION'].includes(order.status) ? 'Kelola Proses' : 'Lihat Detail'} 
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