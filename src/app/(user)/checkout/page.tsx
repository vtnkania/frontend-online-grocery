'use client';

import Link from 'next/link';
import { useCheckout } from '@/hooks/useCheckout';
import CheckoutAddressSection from '@/components/checkout/CheckoutAddressSection';
import CheckoutItemsSection from '@/components/checkout/CheckoutItemsSection';
import CheckoutShippingSection from '@/components/checkout/CheckoutShippingSection';
import CheckoutSummary from '@/components/checkout/CheckoutSummary';
import AddressSelectModal from '@/components/checkout/AddressSelectModal';

export default function CheckoutPage() {
  const {
    cartItems,
    shippingRates,
    addresses,
    selectedAddress,
    loadingCart,
    loadingShipping,
    submitting,
    isAddressModalOpen,
    setIsAddressModalOpen,
    selectedCourier,
    setSelectedCourier,
    handleSelectAddress,
    calculateSubtotal,
    shippingCost,
    grandTotal,
    handlePlaceOrder,
  } = useCheckout();

  if (loadingCart) {
    return (
      <div className="text-center py-12 text-xs text-gray-500 animate-pulse">
        Memuat data keranjang...
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <p className="text-sm text-gray-500 mb-4">
          Tidak ada produk yang valid untuk diproses dari cabang ini.
        </p>
        <Link
          href="/cart"
          className="inline-block px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
        >
          Kembali Ke Keranjang
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Checkout Terintegrasi</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-4">
            <CheckoutAddressSection
              selectedAddress={selectedAddress}
              onOpenModal={() => setIsAddressModalOpen(true)}
            />

            <CheckoutItemsSection items={cartItems} />

            <CheckoutShippingSection
              selectedAddress={selectedAddress}
              loadingShipping={loadingShipping}
              shippingRates={shippingRates}
              selectedCourier={selectedCourier}
              onSelectCourier={setSelectedCourier}
            />

            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-bold text-gray-800 mb-2">💳 Metode Pembayaran</h2>
              <div className="p-3.5 border border-emerald-200 bg-emerald-50/40 text-emerald-800 rounded-xl text-xs flex items-center justify-between font-medium">
                <div>
                  <p className="font-bold text-gray-900">Midtrans Gateway (Otomatis)</p>
                  <p className="text-[10px] text-gray-500 font-normal mt-0.5">
                    Mendukung otomatisasi scan QRIS, GoPay, ShopeePay, ShopeePay Later, dan Virtual Account Multi-bank.
                  </p>
                </div>
                <span className="bg-green-600 text-white text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">
                  Aktif
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <CheckoutSummary
              subtotal={calculateSubtotal()}
              shippingCost={shippingCost}
              grandTotal={grandTotal}
              submitting={submitting}
              hasAddress={!!selectedAddress}
              hasCourier={!!selectedCourier}
              courierCompany={selectedCourier?.company}
              onPlaceOrder={handlePlaceOrder}
            />
          </div>
        </div>
      </div>

      <AddressSelectModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={addresses}
        selectedAddress={selectedAddress}
        onSelectAddress={handleSelectAddress}
      />
    </div>
  );
}