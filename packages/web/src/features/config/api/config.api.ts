import { api } from "@/shared/api/client";
import { ConfigDto } from "./types";

export const configApi = {
  get: () => api.get<ConfigDto[]>("/system-configs/leave-configs"),
  update: (data: ConfigDto[]) => api.put<ConfigDto[]>("/system-configs/leave-configs", data),
};
