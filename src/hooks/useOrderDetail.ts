import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { getOrderDetailApi, cancelOrderApi, completeOrderApi } from '@/services/order.service';
import { getQrisTokenApi, notifyMidtransPaymentApi, loadMidtransScript } from '@/services/checkout.service';
import type { OrderDetailData } from '@/types/order.type';

export function useOrderDetail() {
  const params = useParams();
  const orderId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';

  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadMidtransScript();
  }, []);

  const fetchOrderData = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await getOrderDetailApi(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Gagal memuat detail nota belanja:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    let isMounted = true;
    const load = async () => {
      await Promise.resolve();
      if (isMounted) fetchOrderData();
    };
    load();
    return () => { isMounted = false; };
  }, [orderId, fetchOrderData]);

  const handleResumePayment = async () => {
    if (!order) return;
    try {
      setPaying(true);
      const token = await getQrisTokenApi(order.id);

      if (typeof window !== 'undefined' && window.snap) {
        window.snap.pay(token, {
          onSuccess: async () => {
            await notifyMidtransPaymentApi(order.id).catch(console.error);
            toast.success('🎉 Pembayaran Sukses via Midtrans!');
            fetchOrderData();
          },
          onPending: () => fetchOrderData(),
          onError: () => toast.error('Pembayaran gagal atau dibatalkan.'),
          onClose: () => fetchOrderData(),
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses pembayaran.');
    } finally {
      setPaying(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm('Apakah kamu yakin ingin membatalkan pesanan belanjaan ini?')) return;

    try {
      setActionLoading(true);
      await cancelOrderApi(order.id);
      toast.success('Pesanan berhasil dibatalkan.');
      fetchOrderData();
    } catch {
      toast.error('Gagal membatalkan pesanan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!order) return;
    if (!confirm('Apakah kamu yakin barang belanjaan sudah sampai di rumah dengan selamat?')) return;

    try {
      setActionLoading(true);
      await completeOrderApi(order.id);
      toast.success('🎉 Transaksi Selesai!');
      fetchOrderData();
    } catch {
      toast.error('Gagal menyelesaikan pesanan.');
    } finally {
      setActionLoading(false);
    }
  };

  return {
    order,
    loading,
    paying,
    actionLoading,
    handleResumePayment,
    handleCancelOrder,
    handleCompleteOrder,
  };
}

export const getStatusLabel = (status: OrderDetailData['status']) => {
  const labels = {
    WAITING_PAYMENT: { text: 'Menunggu Pembayaran', color: 'text-amber-600 bg-amber-50 border-amber-200 font-bold' },
    WAITING_CONFIRMATION: { text: 'Menunggu Verifikasi Midtrans', color: 'text-orange-600 bg-orange-50 border-orange-200 font-bold' },
    PROCESSING: { text: 'Pembayaran Diterima / Gudang Bersiap', color: 'text-blue-600 bg-blue-50 border-blue-200 font-bold' },
    PREPARING: { text: 'Pesanan Sedang Dikemas Gudang', color: 'text-amber-600 bg-amber-50 border-amber-200 font-bold' },
    READY_TO_SHIP: { text: 'Selesai Dikemas - Mencari Driver', color: 'text-indigo-600 bg-indigo-50 border-indigo-200 font-bold' },
    SHIPPED: { text: 'Kurir Sedang Di Jalan Antar Paket', color: 'text-purple-600 bg-purple-50 border-purple-200 font-bold' },
    DELIVERED: { text: 'Pesanan Selesai Diterima', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 font-bold' },
    CANCELLED: { text: 'Pesanan Dibatalkan', color: 'text-red-600 bg-red-50 border-red-200 font-bold' },
  };
  return labels[status] || { text: status, color: 'text-gray-600 bg-gray-50 border-gray-200' };
};