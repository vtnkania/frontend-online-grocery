const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function fetchShippingRatesApi(userId: string, storeId: string) {
  const response = await fetch(`${API_BASE_URL}/shippings/rates`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId, storeId }),
  });
  return response.json();
}

export async function createOrderApi(payload: {
  userId: string;
  courierCompany: string;
  courierName: string;
  shippingCost: number;
  cartItemIds: string[];
  paymentMethod: string;
}) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Gagal membuat invoice.');
  return result.data;
}

export async function getQrisTokenApi(orderId: string) {
  const response = await fetch(`${API_BASE_URL}/payments/qris`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderId }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Gagal memicu Midtrans token.');
  return result.data.token;
}

export async function notifyMidtransPaymentApi(orderId: string) {
  return fetch(`${API_BASE_URL}/payments/midtrans-notification`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      order_id: orderId,
      transaction_status: 'settlement',
      fraud_status: 'accept',
    }),
  });
}

export function loadMidtransScript() {
  if (typeof window === 'undefined') return;
  const snapScriptUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js';
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  if (!document.querySelector(`script[src="${snapScriptUrl}"]`)) {
    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('src', snapScriptUrl);
    if (clientKey) scriptTag.setAttribute('data-client-key', clientKey);
    document.body.appendChild(scriptTag);
  }
}