import { api } from "@/shared/api/client";

export interface SystemConfigDto {
  id: number;
  configKey: string;
  configValue: string;
  description: string | null;
  updatedAt: string;
}

export const systemConfigsApi = {
  get: () => api.get<SystemConfigDto[]>("/system-configs"),
  update: (data: SystemConfigDto[]) => api.put<{ message: string }>("/system-configs", data),
};