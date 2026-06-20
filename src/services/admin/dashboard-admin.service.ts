import { api } from "@/lib/axios";
import type { AdminDashboardData } from "@/types/admin.type";

export const getAdminDashboard = async () => {
  const response = await api.get<{ data: AdminDashboardData }>("/admin/dashboard");
  return response.data.data;
};
