"use client";

import Image from "next/image";

export interface CartItem {
  id: string;
  quantity: number;
  priceSnapshot: string;
  store?: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    productImages?: { id: string; url: string }[];
  };
}

interface CheckoutItemsSectionProps {
  items: CartItem[];
}

export default function CheckoutItemsSection({ items }: CheckoutItemsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
      <h2 className="text-sm font-bold text-gray-800 border-b pb-2">📦 Produk Belanja</h2>
      {items.map((item) => {
        const prod = item.product;
        const imgUrl =
          prod.productImages && prod.productImages.length > 0
            ? prod.productImages[0].url
            : "/placeholder-grocery.png";

        return (
          <div
            key={item.id}
            className="flex items-center justify-between text-xs pb-2 border-b last:border-0 border-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative overflow-hidden rounded border border-gray-100">
                <Image src={imgUrl} alt={prod.name} fill className="object-cover" unoptimized />
              </div>
              <div>
                <h4 className="font-bold text-gray-950">{prod.name}</h4>
                <p className="text-gray-500 font-medium">
                  {item.quantity} x Rp {Number(item.priceSnapshot).toLocaleString("id-ID")}
                </p>
                <p className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                  Dikirim dari: FreshMart Cabang {item.store?.name || "Utama"}
                </p>
              </div>
            </div>
            <span className="font-black text-slate-900">
              Rp {(Number(item.priceSnapshot) * item.quantity).toLocaleString("id-ID")}
            </span>
          </div>
        );
      })}
    </div>
  );
}