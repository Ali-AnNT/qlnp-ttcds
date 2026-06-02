import { api } from "@/shared/api/client";
import type { AuthUser } from "./types";

export const authApi = {
  me: () => api.get<AuthUser>("/auth/me"),
};