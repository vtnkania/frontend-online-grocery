export type AdminMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminOption = {
  id: string;
  name: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  isActive: boolean;
  category: AdminOption;
  images: { id: string; url: string }[];
  stores: { inventoryId: string; storeId: string; storeName: string; stock: number }[];
  totalStock: number;
};

export type AdminInventory = {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  imageUrl: string | null;
  storeId: string;
  storeName: string;
  stock: number;
  updatedAt: string;
};

export type StockMutation = {
  id: string;
  type: "IN" | "OUT" | "TRANSFER";
  quantity: number;
  notes: string | null;
  createdAt: string;
};

export type AdminOptions = {
  categories: AdminOption[];
  stores: AdminOption[];
};
