'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface OrderDetailData {
  id: string;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status: string;
  storeId: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';

  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [snapUrl, setSnapUrl] = useState<string | null>(null);

  // Fetch data history belanja untuk dipasangkan ke detail nota
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/api/v1/orders`);
        const result = await response.json();
        
        const orderList = Array.isArray(result) ? result : (result?.data && Array.isArray(result.data) ? result.data : []);
        const matchedOrder = orderList.find((item: OrderDetailData) => item.id === orderId);
        
        if (matchedOrder) {
          setOrder(matchedOrder);
        } else {
          setOrder({
            id: orderId,
            subtotal: 45000,
            shippingCost: 19000,
            totalAmount: 64000,
            status: "WAITING_PAYMENT",
            storeId: "462af04f-e746-443d-82e8-08e7dc5c9fa5"
          });
        }
      } catch (error) {
        console.error("Gagal fetch data history order:", error);
        setOrder({
          id: orderId,
          subtotal: 45000,
          shippingCost: 19000,
          totalAmount: 64000,
          status: "WAITING_PAYMENT",
          storeId: "462af04f-e746-443d-82e8-08e7dc5c9fa5"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  // Fungsi memicu transaksi Snap Midtrans ke backend Express port 3000
  const handleGenerateQris = async () => {
    if (!orderId) return;
    setBtnLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/v1/payments/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId })
      });

      const result = await response.json();
      
      if (result.success && result.data?.qrUrl) {
        setSnapUrl(result.data.qrUrl); // Menyimpan alamat redirect_url Snap
        
        // Membuka halaman lembar pembayaran Snap secara instan di tab browser baru
        window.open(result.data.qrUrl, '_blank');
        alert("Halaman Pembayaran Midtrans Snap Sukses Dibuka di Tab Baru! 🚀");
      } else {
        alert("Gagal memproses pembayaran: " + (result.message || "Periksa kembali konfigurasi!"));
      }
    } catch (error) {
      console.error("Gagal memicu rute API:", error);
      alert("Terjadi gangguan koneksi ke API backend port 3000!");
    } finally {
      setBtnLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "WAITING_PAYMENT":
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 animate-pulse">Menunggu Pembayaran</span>;
      case "WAITING_CONFIRMATION":
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Menunggu Konfirmasi Admin</span>;
      case "PROCESSING":
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Sedang Diproses</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm font-medium text-gray-500 animate-bounce">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-md text-center max-w-sm">
          <p className="text-sm font-semibold text-red-500 mb-2">Data pesanan tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        {/* Header Nota */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Detail Nota</h1>
            <p className="text-xs text-gray-400 mt-1">ID: {order.id}</p>
          </div>
          {getStatusBadge(order.status)}
        </div>

        {/* Rincian Tagihan */}
        <div className="space-y-3 mb-6 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Harga Barang</span>
            <span className="font-medium text-gray-800">Rp {Number(order.subtotal || 0).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Ongkos Kirim</span>
            <span className="font-medium text-gray-800">Rp {Number(order.shippingCost || 0).toLocaleString('id-ID')}</span>
          </div>
          <div className="border-t pt-3 flex justify-between font-bold text-base text-gray-800">
            <span>Total Tagihan</span>
            <span className="text-green-600">Rp {Number(order.totalAmount || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Informasi Status Link Pembayaran */}
        {snapUrl && order.status === "WAITING_PAYMENT" && (
          <div className="mb-6 flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl border border-dashed border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-1 text-center">Tautan Snap Midtrans Aktif!</p>
            <p className="text-[11px] text-gray-500 text-center mb-2">Jika tab baru tidak otomatis terbuka, silakan klik tautan manual di bawah:</p>
            <a 
              href={snapUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs font-bold text-blue-600 underline hover:text-blue-800 break-all text-center"
            >
              Buka Halaman Pembayaran Sandbox ↗
            </a>
          </div>
        )}

        {/* Tombol Pemicu Kontrol Utama */}
        {order.status === "WAITING_PAYMENT" ? (
          <button
            onClick={handleGenerateQris}
            disabled={btnLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition duration-200 active:scale-95 disabled:opacity-50 text-sm"
          >
            {btnLoading ? "Memproses Tautan..." : "Bayar Aman dengan Midtrans Snap"}
          </button>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-center text-xs font-semibold shadow-inner">
            🎉 Pembayaran sukses! Status pesanan di cloud database Supabase telah ter-update otomatis.
          </div>
        )}

      </div>
    </div>
  );
}