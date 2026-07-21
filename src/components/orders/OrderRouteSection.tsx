import React from 'react';
import { Store, MapPin } from 'lucide-react';
import type { OrderDetailData } from '@/types/order.type';

export function OrderRouteSection({ order }: { order: OrderDetailData }) {
  const originStore = order.store || order.shipping?.originStore;
  const rawAddr = order.address || order.shipping?.destinationAddress;

  const recipientName = rawAddr?.name || rawAddr?.recipientName || rawAddr?.receiverName || 'Pembeli';
  const recipientPhone = rawAddr?.phone || rawAddr?.phoneNumber || '-';

  const fullAddress = [
    rawAddr?.address || rawAddr?.street || rawAddr?.detail,
    rawAddr?.city,
    rawAddr?.province,
    rawAddr?.postalCode || rawAddr?.postcode ? `Kode Pos ${rawAddr?.postalCode || rawAddr?.postcode}` : '',
  ].filter(Boolean).join(', ');

  return (
    <div className="bg-slate-50/80 p-3.5 rounded-xl border border-gray-200 space-y-3 font-sans text-xs">
      <div className="flex items-start gap-2.5 border-b border-gray-200/80 pb-2.5">
        <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
          <Store className="size-3.5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dikirim Dari Cabang</p>
          <p className="font-bold text-slate-900 text-xs">{originStore?.name || 'Cabang Utama'}</p>
          <p className="text-gray-500 text-[11px] mt-0.5">{originStore?.address || originStore?.city || 'Gudang Pusat'}</p>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <div className="p-1.5 bg-red-100 text-red-600 rounded-lg shrink-0 mt-0.5">
          <MapPin className="size-3.5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Alamat Tujuan Pengiriman</p>
          <p className="font-bold text-slate-900 text-xs">
            {recipientName} <span className="text-gray-500 font-normal ml-1">({recipientPhone})</span>
          </p>
          <p className="text-gray-600 text-[11px] leading-relaxed mt-0.5">{fullAddress}</p>
        </div>
      </div>
    </div>
  );
}