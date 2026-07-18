'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Calendar, CreditCard, ShoppingBag, MapPin, ExternalLink, Wallet, CheckCircle, Ban, Copy, UploadCloud, FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  quantity: number;
  priceSnapshot: string;
  product: {
    name: string;
  };
}

interface OrderDetailData {
  id: string;
  createdAt: string;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status: 'WAITING_PAYMENT' | 'WAITING_CONFIRMATION' | 'PROCESSING' | 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  storeId: string;
  courierCompany: string;
  courierName: string;
  notes: string | null; 
  biteshipTrackingUrl?: string;
  items: OrderItem[];
  payment?: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    proofUrl: string;
  } | null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';

  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const snapScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'VT-client-xxxxxxxx'; 
    
    const existingScript = document.querySelector(`script[src="${snapScriptUrl}"]`) as HTMLScriptElement | null;
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = snapScriptUrl;
      script.setAttribute('data-client-key', clientKey);
      document.body.appendChild(script);
    }
  }, []);

  const fetchOrderData = async () => {
    if (!orderId) return;
    try {
      const response = await fetch(`http://localhost:8000/api/v1/orders/${orderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (response.ok) {
        setOrder(result.data);
      }
    } catch (err) {
      console.error('Gagal memuat detail nota belanja:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 FIXED: Membungkus jalannya fetchOrderData ke dalam setTimeout asinkron + cleanup timer untuk menyembuhkan cascading renders
  useEffect(() => {
    if (!orderId) return;
    const timer = setTimeout(() => {
      fetchOrderData();
    }, 0);
    return () => clearTimeout(timer);
  }, [orderId]);

  const handleResumePayment = async () => {
    if (!order) return;
    try {
      setPaying(true);
      const response = await fetch('http://localhost:8000/api/v1/payments/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });
      const result = await response.json();
      if (result.success && result.data?.token) {
        const targetWindow = window as unknown as { snap: { pay: (token: string, options: Record<string, unknown>) => void } };
        if (targetWindow.snap && typeof targetWindow.snap.pay === 'function') {
          targetWindow.snap.pay(result.data.token, {
            onSuccess: async function () {
              try {
                await fetch('http://localhost:8000/api/v1/payments/midtrans-notification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ order_id: order.id, transaction_status: 'settlement', fraud_status: 'accept' })
                });
                toast.success('🎉 Pembayaran Sukses via Midtrans!');
                fetchOrderData();
              } catch {
                fetchOrderData();
              }
            }
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      toast.success('Gambar struk berhasil dipilih!');
    }
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return toast.error('Silakan tentukan file gambar struk transfer terlebih dahulu!');
    
    const formData = new FormData();
    formData.append('paymentProof', selectedFile);

    try {
      setUploading(true);
      const res = await fetch(`http://localhost:8000/api/v1/orders/${orderId}/upload-proof`, {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();

      if (res.ok) {
        toast.success('Bukti transfer terkirim!');
        fetchOrderData();
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim bukti transfer bank.');
    } finally {
      setUploading(false);
    }
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm('Apakah kamu yakin ingin membatalkan pesanan belanjaan ini?')) return;

    try {
      setActionLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/orders/cancel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });

      if (response.ok) {
        toast.success('Pesanan berhasil dibatalkan.');
        fetchOrderData();
      } else {
        toast.error('Gagal membatalkan pesanan.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!order) return;
    if (!confirm('Apakah kamu yakin barang belanjaan sudah sampai di rumah dengan selamat?')) return;

    try {
      setActionLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/orders/complete', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });

      if (response.ok) {
        toast.success('🎉 Transaksi Selesai!');
        fetchOrderData();
      } else {
        toast.error('Gagal menyelesaikan pesanan.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusLabel = (status: OrderDetailData['status']) => {
    const labels = {
      WAITING_PAYMENT: { text: 'Menunggu Pembayaran', color: 'text-amber-600 bg-amber-50 border-amber-200 font-bold' },
      WAITING_CONFIRMATION: { text: 'Menunggu Verifikasi Tim Finance', color: 'text-orange-600 bg-orange-50 border-orange-200 font-bold' },
      PROCESSING: { text: 'Pembayaran Diterima / Gudang Bersiap', color: 'text-blue-600 bg-blue-50 border-blue-200 font-bold' },
      PREPARING: { text: 'Pesanan Sedang Dikemas Gudang', color: 'text-amber-600 bg-amber-50 border-amber-200 font-bold' },
      READY_TO_SHIP: { text: 'Selesai Dikemas - Mencari Driver', color: 'text-indigo-600 bg-indigo-50 border-indigo-200 font-bold' },
      SHIPPED: { text: 'Kurir Sedang Di Jalan Antar Paket', color: 'text-purple-600 bg-purple-50 border-purple-200 font-bold' },
      DELIVERED: { text: 'Pesanan Selesai Diterima', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 font-bold' },
      CANCELLED: { text: 'Pesanan Dibatalkan', color: 'text-red-600 bg-red-50 border-red-200 font-bold' },
    };
    return labels[status] || { text: status, color: 'text-gray-600 bg-gray-50 border-gray-200' };
  };

  if (loading) return <div className="text-center py-12 text-xs text-gray-400 animate-pulse">Memuat lembar nota belanja...</div>;
  if (!order) return <div className="text-center py-12 text-xs text-red-500">Waduh, detail invoice pesanan tidak ditemukan.</div>;

  const statusInfo = getStatusLabel(order.status);
  const isManualPayment = order.notes === 'MANUAL';

  return (
    <div className="w-full min-h-screen bg-gray-55 p-4 md:p-8 text-slate-900 font-sans">
      <div className="mx-auto max-w-xl bg-white rounded-2xl border border-gray-200 shadow-3xl overflow-hidden">
        
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

        {/* Isi Rincian Nota */}
        <div className="p-5 space-y-5 text-xs">
          
          <div className={`p-3 rounded-xl border text-center font-bold tracking-wide ${statusInfo.color}`}>
            {statusInfo.text}
          </div>

          <div className="grid grid-cols-2 gap-3 border-b pb-4 border-gray-100">
            <div className="space-y-1">
              <p className="text-gray-400 font-medium flex items-center gap-1"><Calendar className="size-3.5 text-gray-400" /> Waktu Transaksi</p>
              <p className="font-semibold text-gray-800">{new Date(order.createdAt).toLocaleString('id-ID')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-400 font-medium flex items-center gap-1"><MapPin className="size-3.5 text-gray-400" /> Opsi Kurir Instan</p>
              <p className="font-semibold text-gray-800 uppercase">{order.courierCompany} - {order.courierName}</p>
            </div>
          </div>

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

          {order.status === 'WAITING_PAYMENT' && (
            <div className="pt-2 space-y-3">
              {isManualPayment ? (
                <div className="space-y-3">
                  <div className="p-3.5 border border-teal-100 bg-teal-50/30 rounded-xl space-y-2">
                    <p className="font-bold text-slate-900">🏦 Informasi Transfer Bank Resmi</p>
                    <p className="text-gray-500 text-[11px] leading-relaxed">Silakan transfer tepat nominal tagihan ke rekening berikut:</p>
                    <div className="p-2.5 bg-white border rounded-lg relative font-medium text-gray-600">
                      <p className="text-[10px] text-gray-400 font-bold">BANK BCA</p>
                      <p className="text-base font-black text-slate-950 tracking-wide my-0.5">8410 9921 22</p>
                      <p className="text-[10px]">a/n PT FreshMart Indonesia Jaya</p>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('8410992122');
                          toast.success('Nomor rekening disalin!');
                        }} 
                        className="absolute top-2.5 right-2.5 px-2 py-1 bg-slate-50 border text-[10px] rounded hover:bg-slate-100 font-bold text-gray-500"
                      >
                        <Copy className="size-3 inline mr-1" /> Salin
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleUploadProof} className="space-y-2">
                    <div className="border-2 border-dashed border-gray-200 bg-slate-50/50 hover:bg-slate-50 rounded-xl p-4 text-center relative cursor-pointer flex flex-col items-center justify-center">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      <UploadCloud className="size-6 text-gray-400 mb-1" />
                      <p className="font-bold text-gray-700 truncate max-w-xs">
                        {selectedFile ? selectedFile.name : 'Pilih Foto Struk Transfer Kamu'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Mendukung format gambar JPG, PNG (Max 2MB)</p>
                    </div>
                    <button 
                      type="submit" 
                      disabled={uploading || !selectedFile} 
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Mengunggah Gambar Bukti...' : 'Kirim Bukti Pembayaran Ke Admin'}
                    </button>
                  </form>
                </div>
              ) : (
                <button
                  onClick={handleResumePayment}
                  disabled={paying || actionLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-1.5"
                >
                  <Wallet className="size-4" /> {paying ? 'Membuka Invoice...' : 'Lanjutkan Pembayaran via Midtrans'}
                </button>
              )}

              <button
                onClick={handleCancelOrder}
                disabled={paying || actionLoading || uploading}
                className="w-full py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl transition text-[11px] flex items-center justify-center gap-1"
              >
                <Ban className="size-3.5" /> Batalkan Pesanan Belanja
              </button>
            </div>
          )}

          {order.status === 'WAITING_CONFIRMATION' && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-center text-orange-800 font-medium leading-relaxed shadow-3xs">
              👍 **Struk Pembayaran Berhasil Dikirim!**
              <p className="text-[11px] text-orange-600 font-normal mt-0.5">Sistem logistik pusat sedang memverifikasi dana rekening manual kelompok kamu. Toko cabang akan segera mengemas barang saat status terkonfirmasi.</p>
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
                  className="w-full py-2.5 bg-slate-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-center font-bold rounded-xl shadow-3xs transition flex items-center justify-center gap-1 font-mono tracking-wide"
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