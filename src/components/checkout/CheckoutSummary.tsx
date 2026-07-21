"use client";

interface CheckoutSummaryProps {
  subtotal: number;
  shippingCost: number;
  grandTotal: number;
  submitting: boolean;
  hasAddress: boolean;
  hasCourier: boolean;
  courierCompany?: string;
  onPlaceOrder: () => void;
}

export default function CheckoutSummary({
  subtotal,
  shippingCost,
  grandTotal,
  submitting,
  hasAddress,
  hasCourier,
  courierCompany,
  onPlaceOrder,
}: CheckoutSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4 sticky top-24">
      <h2 className="text-sm font-bold text-gray-900 border-b pb-2">Ringkasan Biaya</h2>
      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex justify-between font-medium">
          <span>Subtotal Produk</span>
          <span className="font-bold text-slate-900">Rp {subtotal.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Ongkir ({courierCompany || "-"})</span>
          <span className="font-bold text-slate-900">Rp {shippingCost.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between border-t pt-3 font-black text-sm text-gray-900">
          <span>Total Tagihan</span>
          <span className="text-green-600 text-base">Rp {grandTotal.toLocaleString("id-ID")}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={submitting || !hasAddress || !hasCourier}
        className="block w-full py-3 bg-green-600 text-white font-bold text-xs rounded-lg hover:bg-green-700 text-center disabled:bg-gray-300 disabled:cursor-not-allowed shadow-xs transition active:scale-[0.99]"
      >
        {submitting
          ? "Menghubungkan ke API..."
          : !hasAddress
          ? "Pilih Alamat Terlebih Dahulu"
          : !hasCourier
          ? "Pilih Opsi Pengiriman"
          : "Bayar Aman via Midtrans"}
      </button>
    </div>
  );
}