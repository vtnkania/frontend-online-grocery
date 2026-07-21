"use client";

import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";

export interface Address {
  id: string;
  label: string;
  receiver: string;
  phone: string;
  address: string;
  isPrimary: boolean;
  latitude: number;
  longitude: number;
}

interface CheckoutAddressSectionProps {
  selectedAddress: Address | null;
  onOpenModal: () => void;
}

export default function CheckoutAddressSection({
  selectedAddress,
  onOpenModal,
}: CheckoutAddressSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
      <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
        <MapPin className="size-4 text-green-600" /> Alamat Pengiriman
      </h2>

      {!selectedAddress ? (
        <div className="border border-dashed border-gray-300 rounded-xl p-5 text-center bg-slate-50">
          <p className="text-xs text-gray-500 mb-3">
            Kamu belum menentukan atau memiliki alamat pengiriman belanja.
          </p>
          <Link
            href="/addresses"
            className="inline-flex items-center text-xs font-bold text-green-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition shadow-xs"
          >
            ➕ Tambah Alamat Baru
          </Link>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-gray-100 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 bg-white border px-2 py-0.5 rounded-md shadow-xs text-[10px]">
                {selectedAddress.label}
              </span>
              <span className="font-semibold text-gray-700">
                {selectedAddress.receiver} ({selectedAddress.phone})
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed font-medium pt-0.5">
              {selectedAddress.address}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenModal}
            className="shrink-0 text-xs font-bold text-green-600 hover:underline flex items-center gap-0.5 mt-0.5"
          >
            Ubah <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}