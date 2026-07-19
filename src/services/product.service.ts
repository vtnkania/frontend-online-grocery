import { api } from "@/lib/axios";
import type { CatalogCategory, CatalogProduct, ProductDetail, ProductMeta, ProductParams, StoreLocation } from "@/types/product.type";

type CategoryResponse = {
  data: CatalogCategory[];
  nearestStore: StoreLocation;
};

type ProductResponse = {
  data: CatalogProduct[];
  meta: ProductMeta;
};

type ProductDetailResponse = {
  data: ProductDetail;
};

const cleanParams = (params: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

export const getDefaultStoreLocation = async () => {
  const response = await api.get<{ data: StoreLocation }>("/stores/default-location");
  return response.data.data;
};

export const getCategories = async (params: ProductParams & { limit?: number }) => {
  const response = await api.get<CategoryResponse>("/categories", { params: cleanParams(params) });
  return response.data;
};

export const getProducts = async (params: ProductParams) => {
  const response = await api.get<ProductResponse>("/products", { params: cleanParams(params) });
  return response.data;
};

export const getProductBySlug = async (slug: string, params: Pick<ProductParams, "latitude" | "longitude">) => {
  const response = await api.get<ProductDetailResponse>(`/products/${slug}`, { params: cleanParams(params) });
  return response.data.data;
};

// 🚀 VERSI PREMIUM: 100% Kebal Eror Linter Strict (Bebas dari keyword 'any')
export const getStores = async (): Promise<StoreLocation[]> => {
  try {
    // 🎯 Menggunakan 'unknown' untuk mematuhi aturan strict linter kelompok lo
    const response = await api.get<unknown>("/stores");
    const resData = response.data;

    // Kondisi A: Jika backend langsung mengembalikan Array mentah
    if (Array.isArray(resData)) {
      return resData as StoreLocation[];
    }

    // Kondisi B: Jika backend membungkusnya di dalam properti .data
    if (resData && typeof resData === "object" && "data" in resData) {
      const nestedData = (resData as Record<string, unknown>).data;
      if (Array.isArray(nestedData)) {
        return nestedData as StoreLocation[];
      }
    }

    return [];
  } catch (error) {
    console.error("Aduhh, gagal mengambil daftar toko dari backend:", error);
    return [];
  }
};