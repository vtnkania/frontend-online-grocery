// 🎯 IMPORT: Menggunakan fungsi pencari token resmi milik kelompok lo
import { getStoredToken } from "@/lib/auth-token";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Helper untuk membaca cookies browser sebagai tambahan cadangan (fallback)
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};

  // 🚀 AMBIL TOKEN: Menggunakan fungsi bawaan dari boilerplate kelompok lo
  const token = 
    getStoredToken() || 
    localStorage.getItem('token') || 
    localStorage.getItem('accessToken') ||
    getCookie('token') || 
    getCookie('accessToken');

  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// 1. Ambil semua item di keranjang user
export const getUserCart = async () => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/carts`, { 
    method: 'GET',
    headers: { ...getAuthHeaders() }
  });
  if (!response.ok) throw new Error('Gagal mengambil data keranjang');
  return await response.json();
};

// 2. Tambah produk ke keranjang (Add to Cart)
export const addToCart = async (productId: string, storeId: string, quantity: number) => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/carts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders() 
    },
    body: JSON.stringify({ productId, storeId, quantity }),
  });
  if (!response.ok) throw new Error('Gagal menambahkan barang');
  return await response.json();
};

// 3. Update jumlah barang di keranjang
export const updateCartQty = async (cartItemId: string, quantity: number) => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/carts/${cartItemId}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ quantity }),
  });
  if (!response.ok) throw new Error('Gagal memperbarui jumlah');
  return await response.json();
};

// 4. Hapus barang dari keranjang
export const deleteCartItem = async (cartItemId: string) => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/carts/${cartItemId}`, { 
    method: 'DELETE',
    headers: { ...getAuthHeaders() }
  });
  if (!response.ok) throw new Error('Gagal menghapus item');
  return await response.json();
};