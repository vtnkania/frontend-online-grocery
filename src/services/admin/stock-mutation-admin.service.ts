import { api } from "@/lib/axios";
import type { AdminMeta, AdminOption, AdminStockMutation, StockMutationStatus } from "@/types/admin.type";

export type StockMutationParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: StockMutationStatus | "all";
  sourceStoreId?: string;
  destinationStoreId?: string;
  sortBy?: "createdAt" | "status" | "product";
  sortOrder?: "asc" | "desc";
};

type StockMutationResponse = { data: AdminStockMutation[]; meta: AdminMeta };
type StockMutationBody = { productId: string; sourceStoreId: string; destinationStoreId: string; quantity: number; notes?: string };

const cleanParams = (params: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

export const getAdminStockMutations = async (params: StockMutationParams) => {
  const response = await api.get<StockMutationResponse>("/admin/stock-mutations", { params: cleanParams(params) });
  return response.data;
};

export const requestAdminStockMutation = async (body: StockMutationBody) => {
  const response = await api.post<{ data: AdminStockMutation }>("/admin/stock-mutations", body);
  return response.data.data;
};

export const getStockMutationStores = async () => {
  const response = await api.get<{ data: AdminOption[] }>("/admin/stock-mutations/stores");
  return response.data.data;
};

export const acceptAdminStockMutation = (id: string) => action(id, "accept");
export const rejectAdminStockMutation = (id: string) => action(id, "reject");
export const shipAdminStockMutation = (id: string) => action(id, "ship");
export const receiveAdminStockMutation = (id: string) => action(id, "receive");

const action = async (id: string, name: "accept" | "reject" | "ship" | "receive") => {
  const response = await api.patch<{ data: AdminStockMutation }>(`/admin/stock-mutations/${id}/${name}`);
  return response.data.data;
};
