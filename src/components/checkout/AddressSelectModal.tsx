"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import type { Address } from "./CheckoutAddressSection";

interface AddressSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (addr: Address) => void;
}

export default function AddressSelectModal({
  isOpen,
  onClose,
  addresses,
  selectedAddress,
  onSelectAddress,
}: AddressSelectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
        >
          <X className="size-5" />
        </button>

        <h3 className="text-base font-bold text-gray-950 mb-1">Pilih Alamat Tujuan</h3>
        <p className="text-xs text-gray-500 mb-4">
          Pilih alamat pengiriman terdaftar untuk menyesuaikan perhitungan ongkir.
        </p>

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {addresses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400 mb-2">Belum ada daftar alamat terdaftar.</p>
              <Link href="/addresses" className="text-xs font-bold text-green-600 underline">
                Kelola Alamat
              </Link>
            </div>
          ) : (
            addresses.map((addr) => {
              const isSelected = selectedAddress?.id === addr.id;
              return (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => onSelectAddress(addr)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-2 text-xs relative ${
                    isSelected ? "border-green-600 bg-emerald-50/20" : "border-gray-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="space-y-1 pr-6">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-900 bg-white border px-1.5 py-0.5 rounded text-[9px] shadow-xs">
                        {addr.label}
                      </span>
                      <span className="font-semibold text-gray-700">{addr.receiver}</span>
                    </div>
                    <p className="text-gray-500 font-medium line-clamp-2 leading-relaxed">
                      {addr.address}
                    </p>
                  </div>
                  {isSelected && <Check className="size-4 text-green-600 absolute top-3 right-3" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}