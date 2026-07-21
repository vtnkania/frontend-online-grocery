"use client";

import type { Address } from "./CheckoutAddressSection";

export interface ShippingRate {
  company: string;
  type: string;
  rate: number;
  duration: string;
}

interface CheckoutShippingSectionProps {
  selectedAddress: Address | null;
  loadingShipping: boolean;
  shippingRates: ShippingRate[];
  selectedCourier: ShippingRate | null;
  onSelectCourier: (rate: ShippingRate) => void;
}

export default function CheckoutShippingSection({
  selectedAddress,
  loadingShipping,
  shippingRates,
  selectedCourier,
  onSelectCourier,
}: CheckoutShippingSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <h2 className="text-sm font-bold text-gray-800 mb-3">🚚 Opsi Pengiriman (Biteship Live API)</h2>
      {!selectedAddress ? (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs text-center font-medium shadow-xs">
          ⚠️ Silakan tentukan/pilih alamat pengiriman terlebih dahulu untuk memunculkan pilihan kurir pengiriman.
        </div>
      ) : loadingShipping ? (
        <div className="p-4 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl text-xs text-center font-medium animate-pulse">
          🔄 Sedang menghitung koordinat jarak & mencari pilihan kurir terbaik...
        </div>
      ) : shippingRates.length === 0 ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs text-center font-medium">
          ❌ Jarak antar lokasi alamat Anda dengan Cabang Toko terlalu jauh atau layanan kurir sedang tidak tersedia.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {shippingRates.map((rate, index) => {
            const isSelected =
              selectedCourier?.type === rate.type && selectedCourier?.company === rate.company;

            return (
              <button
                key={index}
                type="button"
                onClick={() => onSelectCourier(rate)}
                className={`p-3 text-left border rounded-xl text-xs transition ${
                  isSelected
                    ? "border-green-600 bg-emerald-50/50 border-emerald-200 text-green-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:bg-slate-50"
                }`}
              >
                <p className="font-bold uppercase tracking-wide">{rate.company}</p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {rate.type} ({rate.duration})
                </p>
                <p className="mt-2 font-black text-gray-900 text-sm">
                  Rp {rate.rate.toLocaleString("id-ID")}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}