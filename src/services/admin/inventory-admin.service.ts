import { api } from "@/lib/axios";
import type { AdminInventory, AdminInventoryStats, AdminMeta, StockMutation } from "@/types/admin.type";

export type InventoryAdminParams = {
  page?: number;
  limit?: number;
  search?: string;
  storeId?: string;
  categoryId?: string;
  stockStatus?: string;
  sortBy?: string;
  sortOrder?: string;
};

type InventoryListResponse = {
  data: AdminInventory[];
  meta: AdminMeta;
  stats: AdminInventoryStats;
};

const cleanParams = (params: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

export const getAdminInventories = async (params: InventoryAdminParams) => {
  const response = await api.get<InventoryListResponse>("/admin/inventories", { params: cleanParams(params) });
  return response.data;
};

export const createAdminInventory = async (body: { productId: string; storeId: string; stock: number }) => {
  const response = await api.post<{ data: AdminInventory }>("/admin/inventories", body);
  return response.data.data;
};

export const updateAdminInventoryStock = async (id: string, body: { type: "IN" | "OUT"; quantity: number; notes?: string }) => {
  const response = await api.patch<{ data: AdminInventory }>(`/admin/inventories/${id}/stock`, body);
  return response.data.data;
};

export const deleteAdminInventory = async (id: string) => {
  const response = await api.delete<{ message: string }>(`/admin/inventories/${id}`);
  return response.data;
};

export const getAdminInventoryMutations = async (id: string) => {
  const response = await api.get<{ data: StockMutation[] }>(`/admin/inventories/${id}/mutations`);
  return response.data.data;
};
