import { api } from "@/lib/axios";
import type { AdminMeta, AdminRole, AdminUser, AdminUserStats } from "@/types/admin.type";

export type UserAdminParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: AdminRole | "all";
  verified?: "all" | "verified" | "unverified";
  sortBy?: "name" | "email" | "role" | "createdAt";
  sortOrder?: "asc" | "desc";
};

type UserListResponse = {
  data: AdminUser[];
  meta: AdminMeta;
  stats: AdminUserStats;
};

const cleanParams = (params: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

export const getAdminUsers = async (params: UserAdminParams) => {
  const response = await api.get<UserListResponse>("/admin/users", { params: cleanParams(params) });
  return response.data;
};

export const updateAdminUserRole = async (id: string, role: AdminRole) => {
  const response = await api.patch<{ data: AdminUser }>(`/admin/users/${id}/role`, { role });
  return response.data.data;
};

export const deleteAdminUser = async (id: string) => {
  const response = await api.delete<{ message: string }>(`/admin/users/${id}`);
  return response.data;
};
