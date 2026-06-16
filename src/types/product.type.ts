export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type CatalogCategory = {
  id: string;
  name: string;
  imageUrl: string | null;
  productCount: number;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  category: { id: string; name: string };
  storeId: string;
  storeName: string;
  stock: number;
};

export type ProductImage = {
  id: string;
  url: string;
};

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: string;
  images: ProductImage[];
  category: { id: string; name: string };
  storeId: string;
  storeName: string;
  stock: number;
  relatedProducts: CatalogProduct[];
};

export type ProductMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search: string;
  sortBy: ProductSortBy;
  sortOrder: SortOrder;
  nearestStore: StoreLocation;
};

export type ProductSortBy = "name" | "price" | "createdAt";
export type SortOrder = "asc" | "desc";

export type ProductParams = {
  latitude?: number;
  longitude?: number;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  sortBy?: ProductSortBy;
  sortOrder?: SortOrder;
};
