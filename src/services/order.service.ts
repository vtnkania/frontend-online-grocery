 const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function getOrderDetailApi(orderId: string) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: getAuthHeaders(),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Gagal memuat detail nota.');
  return result.data;
}

export async function cancelOrderApi(orderId: string) {
  const res = await fetch(`${API_BASE_URL}/orders/cancel`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderId }),
  });
  if (!res.ok) throw new Error('Gagal membatalkan pesanan.');
  return res.json();
}

export async function completeOrderApi(orderId: string) {
  const res = await fetch(`${API_BASE_URL}/orders/complete`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderId }),
  });
  if (!res.ok) throw new Error('Gagal menyelesaikan pesanan.');
  return res.json();
}