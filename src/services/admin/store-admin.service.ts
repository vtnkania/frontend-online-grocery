import { api } from "@/lib/axios";
import type { AdminMeta, AdminStore, StoreManager, StoreType } from "@/types/admin.type";

export type StoreAdminParams = {
  page?: number;
  limit?: number;
  search?: string;
  type?: StoreType | "all";
  sortBy?: "name" | "type" | "createdAt";
  sortOrder?: "asc" | "desc";
};

export type StoreBody = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: StoreType;
  managerUserId?: string;
};

type StoreListResponse = { data: AdminStore[]; meta: AdminMeta };

const cleanParams = (params: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

export const getAdminStores = async (params: StoreAdminParams) => {
  const response = await api.get<StoreListResponse>("/admin/stores", { params: cleanParams(params) });
  return response.data;
};

export const getAdminStore = async (id: string) => {
  const response = await api.get<{ data: AdminStore }>(`/admin/stores/${id}`);
  return response.data.data;
};

export const getStoreManagers = async () => {
  const response = await api.get<{ data: StoreManager[] }>("/admin/stores/managers");
  return response.data.data;
};

export const createAdminStore = async (body: StoreBody) => {
  const response = await api.post<{ data: AdminStore }>("/admin/stores", body);
  return response.data.data;
};

export const updateAdminStore = async (id: string, body: StoreBody) => {
  const response = await api.patch<{ data: AdminStore }>(`/admin/stores/${id}`, body);
  return response.data.data;
};

export const deleteAdminStore = async (id: string) => {
  const response = await api.delete<{ message: string }>(`/admin/stores/${id}`);
  return response.data;
};
