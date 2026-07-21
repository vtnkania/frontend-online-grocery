'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Calendar, MapPin, ShoppingBag, CreditCard, Wallet, Ban, CheckCircle, ExternalLink } from 'lucide-react';
import { useOrderDetail, getStatusLabel } from '@/hooks/useOrderDetail';
import { OrderRouteSection } from '@/components/orders/OrderRouteSection';
import type { OrderItem } from '@/types/order.type';

export default function OrderDetailPage() {
  const {
    order,
    loading,
    paying,
    actionLoading,
    handleResumePayment,
    handleCancelOrder,
    handleCompleteOrder,
  } = useOrderDetail();

  if (loading) return <div className="text-center py-12 text-xs text-gray-400 animate-pulse">Memuat lembar nota belanja...</div>;
  if (!order) return <div className="text-center py-12 text-xs text-red-500">Detail invoice pesanan tidak ditemukan.</div>;

  const statusInfo = getStatusLabel(order.status);

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8 text-slate-900 font-sans">
      <div className="mx-auto max-w-xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        
        {/* Header Nota */}
        <div className="bg-slate-50 border-b p-4 flex items-center gap-3">
          <Link href="/orders" className="p-1.5 rounded-lg border bg-white hover:bg-gray-50 transition text-gray-500">
            <ChevronLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Detail Nota Belanja</h1>
            <p className="text-[10px] font-mono font-bold text-gray-400 uppercase">ID: {order.id}</p>
          </div>
        </div>

        <div className="p-5 space-y-5 text-xs">
          <div className={`p-3 rounded-xl border text-center font-bold tracking-wide ${statusInfo.color}`}>
            {statusInfo.text}
          </div>

          <div className="grid grid-cols-2 gap-3 border-b pb-4 border-gray-100">
            <div className="space-y-1">
              <p className="text-gray-400 font-medium flex items-center gap-1"><Calendar className="size-3.5" /> Waktu Transaksi</p>
              <p className="font-semibold text-gray-800">{new Date(order.createdAt).toLocaleString('id-ID')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-400 font-medium flex items-center gap-1"><MapPin className="size-3.5" /> Opsi Kurir</p>
              <p className="font-semibold text-gray-800 uppercase">{order.courierCompany} - {order.courierName}</p>
            </div>
          </div>

          {/* Rute Pengiriman */}
          <OrderRouteSection order={order} />

          {/* Item Yang Dibeli */}
          <div className="space-y-3 border-b pb-4 border-gray-100">
            <p className="font-bold text-gray-900 flex items-center gap-1"><ShoppingBag className="size-3.5 text-green-600" /> Item Yang Dibeli</p>
            <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-gray-50">
              {Object.values(
                order.items.reduce<Record<string, OrderItem & { totalPrice: number }>>((acc, item) => {
                  const key = item.product?.name || 'Grocery Item';
                  if (!acc[key]) acc[key] = { ...item, quantity: 0, totalPrice: 0 };
                  acc[key].quantity += item.quantity;
                  acc[key].totalPrice += Number(item.priceSnapshot) * item.quantity;
                  return acc;
                }, {})
              ).map((item, idx) => (
                <div key={idx} className="flex justify-between font-medium text-gray-600">
                  <span>{item.product?.name} <b className="text-gray-900 ml-1">x{item.quantity}</b></span>
                  <span className="font-semibold text-slate-800">Rp {item.totalPrice.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ringkasan Biaya */}
          <div className="space-y-2 border-b pb-4 border-gray-100 font-medium text-gray-600">
            <p className="font-bold text-gray-900 flex items-center gap-1"><CreditCard className="size-3.5 text-blue-600" /> Ringkasan Biaya</p>
            <div className="flex justify-between">
              <span>Subtotal Produk</span>
              <span className="text-gray-900 font-semibold">Rp {Number(order.subtotal).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Ongkos Kirim Kurir</span>
              <span className="text-gray-900 font-semibold">Rp {Number(order.shippingCost).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-gray-950 border-t pt-2 mt-1 border-dashed">
              <span>Total Uang Dibayar</span>
              <span className="text-green-600 text-base">Rp {Number(order.totalAmount).toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          {order.status === 'WAITING_PAYMENT' && (
            <div className="pt-2 space-y-3">
              <button
                onClick={handleResumePayment}
                disabled={paying || actionLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Wallet className="size-4" /> {paying ? 'Membuka Snap Invoice...' : 'Lanjutkan Pembayaran via Midtrans'}
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={paying || actionLoading}
                className="w-full py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl transition text-[11px] flex items-center justify-center gap-1"
              >
                <Ban className="size-3.5" /> Batalkan Pesanan Belanja
              </button>
            </div>
          )}

          {order.status === 'SHIPPED' && (
            <div className="space-y-2 pt-2">
              <button
                onClick={handleCompleteOrder}
                disabled={actionLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="size-4" /> Konfirmasi Pesanan Diterima (Selesai)
              </button>
              {order.biteshipTrackingUrl && (
                <a
                  href={order.biteshipTrackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-slate-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-center font-bold rounded-xl transition flex items-center justify-center gap-1 font-mono tracking-wide"
                >
                  Pantau Posisi Driver di Peta Live <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}