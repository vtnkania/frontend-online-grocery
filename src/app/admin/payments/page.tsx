'use client';

import React, { useEffect, useState } from 'react';
import { Check, X, Eye, Landmark, User, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface AwaitingOrder {
  id: string;
  totalAmount: string | number;
  createdAt: string;
  status: string;
  user: { name: string; email: string };
  payment?: { proofUrl: string; bankName?: string; accountNumber?: string };
}

export default function AdminPaymentVerificationPage() {
  const [orders, setOrders] = useState<AwaitingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const fetchAwaitingOrders = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/orders/admin/payments/awaiting');
      const result = await res.json();
      if (res.ok) {
        setOrders(result.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat verifikasi pembayaran:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 FIXED 1: Panggilan fungsi dibungkus setTimeout asinkron + cleanup timer untuk membuang cascading renders
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAwaitingOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const handleVerify = async (orderId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      // Nyalakan loading secara aman saat tombol aksi ditekan
      setLoading(true);
      
      const res = await fetch('http://localhost:8000/api/v1/orders/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });
      const result = await res.json();

      if (res.ok) {
        toast.success(action === 'APPROVE' ? 'Pembayaran berhasil dikonfirmasi!' : 'Pembayaran ditolak.');
        fetchAwaitingOrders();
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses verifikasi.');
      setLoading(false);
    }
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 md:p-6 text-slate-900 text-xs font-sans">
      <div className="max-w-4xl mx-auto space-y-5">
        
        {/* Header Panel */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-3xs">
          <div className="space-y-1">
            <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Landmark className="size-4 text-teal-800" /> Finance Panel: Manual Transfer Verification
            </h1>
            <p className="text-gray-400 font-medium text-[11px]">
              Validasi bukti unggahan transfer bank sebelum pesanan diproses oleh tim gudang logistik.
            </p>
          </div>
        </div>

        {/* List Table Data */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 animate-pulse font-medium">Memuat data verifikasi...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border text-gray-400 font-medium shadow-3xs">
            🎉 Bersih! Tidak ada antrean konfirmasi pembayaran manual transfer saat ini.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-3xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-gray-400 font-bold">
                  <th className="p-3 text-[10px]">INVOICE ID</th>
                  <th className="p-3 text-[10px]">PELANGGAN</th>
                  <th className="p-3 text-[10px]">TOTAL TAGIHAN</th>
                  <th className="p-3 text-[10px]">LAMPIRAN STRUK</th>
                  <th className="p-3 text-[10px] text-center">KEPUTUSAN FINANSIAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">#{order.id.substring(0, 8)}...</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <User className="size-3 text-gray-400" /> {order.user?.name || 'Customer'}
                      </div>
                      <p className="text-[10px] text-gray-400 font-normal pl-4">{order.user?.email}</p>
                    </td>
                    <td className="p-3 font-black text-slate-900">
                      Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3">
                      {order.payment?.proofUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedProofUrl(order.payment!.proofUrl)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition shadow-3xs font-bold text-[10px]"
                        >
                          <Eye className="size-3" /> Periksa Struk
                        </button>
                      ) : (
                        <span className="text-gray-400 italic">Belum unggah</span>
                      )}
                    </td>
                    <td className="p-3 text-center flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleVerify(order.id, 'APPROVE')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition shadow-2xs text-[10px]"
                      >
                        <Check className="size-3" /> Terima
                      </button>
                      <button
                        onClick={() => handleVerify(order.id, 'REJECT')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 font-bold rounded-lg hover:bg-red-100 transition shadow-2xs text-[10px]"
                      >
                        <X className="size-3" /> Tolak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* LIGHTBOX POPUP UNTUK PREVIEW STRUK */}
        {selectedProofUrl && (
          <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl p-5 shadow-2xl max-w-sm w-full relative flex flex-col">
              <button 
                onClick={() => setSelectedProofUrl(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-600 transition"
              >
                <X className="size-4" />
              </button>
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-1">
                <CreditCard className="size-4 text-teal-800" /> Foto Lampiran Bukti Transfer
              </h3>
              <div className="w-full aspect-[3/4] relative bg-slate-50 rounded-xl overflow-hidden border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedProofUrl} alt="Struk Pembayaran" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}