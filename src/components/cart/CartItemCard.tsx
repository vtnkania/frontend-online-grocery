"use client";

import Image from "next/image";
import { CheckSquare, Square } from "lucide-react";

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
    stock?: number;
    productImages?: {
      id: string;
      url: string;
    }[];
  };
}

interface CartItemCardProps {
  item: CartItem;
  isChecked: boolean;
  onToggleCheck: (item: CartItem) => void;
  onQtyChange: (id: string, currentQty: number, delta: number, maxStock: number) => void;
}

export default function CartItemCard({
  item,
  isChecked,
  onToggleCheck,
  onQtyChange,
}: CartItemCardProps) {
  const prod = item.product;
  const realImageUrl =
    prod.productImages && prod.productImages.length > 0
      ? prod.productImages[0].url
      : "/placeholder-grocery.png";

  return (
    <div className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0 border-gray-100 gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onToggleCheck(item)}
          className="text-gray-400 hover:text-green-600 transition shrink-0"
        >
          {isChecked ? (
            <CheckSquare className="size-4 text-green-600" />
          ) : (
            <Square className="size-4" />
          )}
        </button>

        <div className="w-16 h-16 relative flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={realImageUrl}
            alt={prod.name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">{prod.name}</h3>
          <p className="text-xs text-gray-500">
            Rp {Number(item.priceSnapshot).toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1 bg-white shadow-inner">
          <button
            type="button"
            onClick={() => onQtyChange(item.id, item.quantity, -1, Number(prod.stock || 0))}
            className="text-gray-500 hover:text-gray-700 font-bold px-1 text-sm"
          >
            -
          </button>
          <span className="text-sm font-medium text-gray-800 w-6 text-center">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onQtyChange(item.id, item.quantity, 1, Number(prod.stock || 0))}
            className="text-gray-500 hover:text-gray-700 font-bold px-1 text-sm"
          >
            +
          </button>
        </div>
        <p className="text-[11px] text-orange-600 font-semibold tracking-wide">
          Stok Cabang: {prod.stock ?? "-"}
        </p>
      </div>
    </div>
  );
}