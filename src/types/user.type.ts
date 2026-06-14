export type FreshMartUser = {
  id: string;
  name: string | null;
  email: string;
  role: "SUPER_ADMIN" | "STORE_ADMIN" | "CUSTOMER";
  authProvider: "EMAIL" | "GOOGLE" | "GITHUB";
  isVerified: boolean;
  emailVerifiedAt: string | null;
  profileImageUrl: string | null;
};
