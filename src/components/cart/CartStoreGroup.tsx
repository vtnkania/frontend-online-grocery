"use client";

import { Store, CheckSquare, Square } from "lucide-react";
import CartItemCard, { type CartItem } from "./CartItemCard";

interface CartStoreGroupProps {
  storeId: string;
  storeName: string;
  items: CartItem[];
  checkedItemIds: string[];
  onToggleStoreAll: (storeId: string, storeItems: CartItem[]) => void;
  onToggleCheck: (item: CartItem) => void;
  onQtyChange: (id: string, currentQty: number, delta: number, maxStock: number) => void;
}

export default function CartStoreGroup({
  storeId,
  storeName,
  items,
  checkedItemIds,
  onToggleStoreAll,
  onToggleCheck,
  onQtyChange,
}: CartStoreGroupProps) {
  const allIds = items.map((i) => i.id);
  const isStoreChecked = allIds.some((id) => checkedItemIds.includes(id));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleStoreAll(storeId, items)}
            className="text-gray-400 hover:text-green-600 transition"
          >
            {isStoreChecked ? (
              <CheckSquare className="size-4 text-green-600" />
            ) : (
              <Square className="size-4" />
            )}
          </button>
          <div className="flex items-center gap-1.5">
            <Store className="size-4 text-emerald-600" />
            <span className="text-xs font-bold text-gray-800">
              FreshMart Cabang <span className="text-emerald-700">{storeName}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {items.map((item) => (
          <CartItemCard
            key={item.id}
            item={item}
            isChecked={checkedItemIds.includes(item.id)}
            onToggleCheck={onToggleCheck}
            onQtyChange={onQtyChange}
          />
        ))}
      </div>
    </div>
  );
}