import { api } from "@/shared/api/client";
import { SystemConfigDto } from "./types";

export const systemConfigsApi = {
  get: () => api.get<SystemConfigDto[]>("/system-configs"),
  update: (data: SystemConfigDto[]) => api.put<{ message: string }>("/system-configs", data),
};