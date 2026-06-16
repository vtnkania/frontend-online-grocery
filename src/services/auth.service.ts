import { api } from "@/lib/axios";
import type { ApiMessage, AuthResponse } from "@/types/auth.type";
import type { FreshMartUser } from "@/types/user.type";

export const registerUser = async (email: string) => {
  const res = await api.post<ApiMessage>("/auth/register", { email });
  return res.data;
};

export const resendVerification = async (email: string) => {
  const res = await api.post<ApiMessage>("/auth/resend-verification", { email });
  return res.data;
};

export const verifyEmail = async (token: string, password: string) => {
  const res = await api.post<ApiMessage>("/auth/verify-email", { token, password });
  return res.data;
};

export const loginUser = async (email: string, password: string) => {
  const res = await api.post<AuthResponse>("/auth/login", { email, password });
  return res.data;
};

export const loginWithGitHubCode = async (code: string) => {
  const res = await api.post<AuthResponse>("/auth/github/callback", { code });
  return res.data;
};

export const requestPasswordReset = async (email: string) => {
  const res = await api.post<ApiMessage>("/auth/forgot-password", { email });
  return res.data;
};

export const confirmPasswordReset = async (token: string, password: string) => {
  const res = await api.post<ApiMessage>("/auth/reset-password", { token, password });
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await api.get<{ data: FreshMartUser }>("/auth/me");
  return res.data.data;
};

export const updateProfile = async (name: string) => {
  const res = await api.patch<{ data: FreshMartUser }>("/auth/profile", { name });
  return res.data.data;
};

export const uploadProfileImage = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await api.patch<{ data: FreshMartUser }>("/auth/profile/image", formData);
  return res.data.data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const res = await api.patch<ApiMessage>("/auth/password", { currentPassword, newPassword });
  return res.data;
};

export const requestEmailChange = async (email: string) => {
  const res = await api.post<ApiMessage>("/auth/request-email-change", { email });
  return res.data;
};

export const verifyEmailChange = async (token: string) => {
  const res = await api.post<ApiMessage>("/auth/verify-email-change", { token });
  return res.data;
};
