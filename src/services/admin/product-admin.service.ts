import { api } from "@/lib/axios";
import type { AdminMeta, AdminOptions, AdminProduct } from "@/types/admin.type";

export type ProductAdminParams = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  storeId?: string;
  stockStatus?: string;
  sortBy?: string;
  sortOrder?: string;
};

type ProductListResponse = {
  data: AdminProduct[];
  meta: AdminMeta;
};

const cleanParams = (params: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

export const getAdminProducts = async (params: ProductAdminParams) => {
  const response = await api.get<ProductListResponse>("/admin/products", { params: cleanParams(params) });
  return response.data;
};

export const getAdminProductOptions = async () => {
  const response = await api.get<{ data: AdminOptions }>("/admin/products/options");
  return response.data.data;
};

export const getAdminProduct = async (id: string) => {
  const response = await api.get<{ data: AdminProduct }>(`/admin/products/${id}`);
  return response.data.data;
};

export const createAdminProduct = async (form: FormData) => {
  const response = await api.post<{ data: AdminProduct }>("/admin/products", form);
  return response.data.data;
};

export const updateAdminProduct = async (id: string, form: FormData) => {
  const response = await api.patch<{ data: AdminProduct }>(`/admin/products/${id}`, form);
  return response.data.data;
};

export const deleteAdminProduct = async (id: string) => {
  const response = await api.delete<{ message: string }>(`/admin/products/${id}`);
  return response.data;
};
