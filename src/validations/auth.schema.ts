import { z } from "zod";

export const emailOnlySchema = z.object({
  email: z.string().trim().email("Masukkan email yang valid.").max(120),
});

export const loginSchema = emailOnlySchema.extend({
  password: z.string().min(8, "Password minimal 8 karakter.").max(72),
});

export const setPasswordSchema = z.object({
  token: z.string().min(32, "Token tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter.").max(72),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Password saat ini wajib diisi."),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter.").max(72),
});
