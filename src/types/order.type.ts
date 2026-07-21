export interface OrderItem {
  id: string;
  quantity: number;
  priceSnapshot: string;
  product: { name: string };
}

export interface RawAddress {
  name?: string;
  recipientName?: string;
  receiverName?: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  street?: string;
  detail?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  postcode?: string;
}

export interface StoreInfo {
  name?: string;
  address?: string;
  city?: string;
}

export interface OrderDetailData {
  id: string;
  createdAt: string;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status:
    | 'WAITING_PAYMENT'
    | 'WAITING_CONFIRMATION'
    | 'PROCESSING'
    | 'PREPARING'
    | 'READY_TO_SHIP'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED';
  storeId: string;
  courierCompany: string;
  courierName: string;
  notes: string | null;
  biteshipTrackingUrl?: string;
  store?: StoreInfo;
  address?: RawAddress;
  shipping?: {
    originStore?: StoreInfo;
    destinationAddress?: RawAddress;
  } | null;
  items: OrderItem[];
}