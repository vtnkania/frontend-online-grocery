import type { FreshMartUser } from "./user.type";

export type AuthResponse = {
  accessToken: string;
  user: FreshMartUser;
};

export type ApiMessage = {
  message: string;
  email?: string;
  debugLink?: string;
};
