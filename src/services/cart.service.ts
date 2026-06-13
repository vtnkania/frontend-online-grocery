const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// 1. Ambil semua item di keranjang user
export const getUserCart = async () => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/carts`, { method: 'GET' });
  if (!response.ok) throw new Error('Gagal mengambil data keranjang');
  return await response.json();
};

// 2. Tambah produk ke keranjang (Add to Cart)
export const addToCart = async (productId: string, storeId: string, quantity: number) => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/carts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, storeId, quantity }),
  });
  if (!response.ok) throw new Error('Gagal menambahkan barang');
  return await response.json();
};

// 3. Update jumlah barang (Klik + atau -)
export const updateCartQty = async (cartItemId: string, quantity: number) => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/carts/${cartItemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!response.ok) throw new Error('Gagal memperbarui jumlah');
  return await response.json();
};

// 4. Hapus barang dari keranjang
export const deleteCartItem = async (cartItemId: string) => {
  const response = await fetch(`${NEXT_PUBLIC_API_URL}/carts/${cartItemId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Gagal menghapus item');
  return await response.json();
};