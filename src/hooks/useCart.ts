import { create } from "zustand";
import { getUserCart } from "@/services/cart.service";

interface CartState {
  cartCount: number;
  fetchCartCount: () => Promise<void>;
  setCartCount: (count: number) => void;
}

export const useCart = create<CartState>((set) => ({
  cartCount: 0,
  setCartCount: (count) => set({ cartCount: count }),
  
  // Fungsi global untuk menembak API dan memperbarui angka secara serentak
  fetchCartCount: async () => {
    try {
      const res = await getUserCart();
      const total = res.items?.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0) || 0;
      set({ cartCount: total });
    } catch {
      set({ cartCount: 0 });
    }
  },
}));