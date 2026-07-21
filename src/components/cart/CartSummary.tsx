"use client";

import Link from "next/link";

interface CartSummaryProps {
  subtotal: number;
  activeStoreId: string | null;
  checkedItemIds: string[];
}

export default function CartSummary({
  subtotal,
  activeStoreId,
  checkedItemIds,
}: CartSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
      <div className="flex justify-between items-center border-b pb-3 border-gray-100">
        <span className="text-sm text-gray-600">Total Harga Pilihan</span>
        <span className="text-base font-bold text-gray-900">
          Rp {subtotal.toLocaleString("id-ID")}
        </span>
      </div>

      {checkedItemIds.length === 0 ? (
        <button
          disabled
          type="button"
          className="block w-full text-center py-3 bg-gray-300 text-gray-500 font-medium text-sm rounded-lg cursor-not-allowed"
        >
          Centang Produk Terlebih Dahulu
        </button>
      ) : (
        <Link
          href={`/checkout?storeId=${activeStoreId}&itemIds=${checkedItemIds.join(",")}`}
          className="block w-full text-center py-3 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 transition shadow-sm active:scale-[0.99]"
        >
          Lanjut ke Checkout
        </Link>
      )}
    </div>
  );
}