import { api } from "@/shared/api/client";

export interface AuthUser {
  userId: number;
  userName: string;
  fullName: string;
  donViId: number | null;
  role: string;
}

export const authApi = {
  me: () => api.get<AuthUser>("/auth/me"),
};
