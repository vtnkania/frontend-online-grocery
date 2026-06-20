import { api } from "@/lib/axios";
import type { AdminCategory, AdminMeta } from "@/types/admin.type";

export type CategoryAdminParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
};

type CategoryListResponse = { data: AdminCategory[]; meta: AdminMeta };
type CategoryBody = { name: string; imageUrl?: string };

const cleanParams = (params: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

export const getAdminCategories = async (params: CategoryAdminParams) => {
  const response = await api.get<CategoryListResponse>("/admin/categories", { params: cleanParams(params) });
  return response.data;
};

export const createAdminCategory = async (body: CategoryBody) => {
  const response = await api.post<{ data: AdminCategory }>("/admin/categories", body);
  return response.data.data;
};

export const updateAdminCategory = async (id: string, body: CategoryBody) => {
  const response = await api.patch<{ data: AdminCategory }>(`/admin/categories/${id}`, body);
  return response.data.data;
};

export const deleteAdminCategory = async (id: string) => {
  const response = await api.delete<{ message: string }>(`/admin/categories/${id}`);
  return response.data;
};
