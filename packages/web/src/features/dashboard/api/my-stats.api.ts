import { api } from "@/shared/api/client";

/** Server-computed dashboard metrics for the current user.
 *  Shape mirrors QLNP.Api.Features.MyStats.MyStatsResponse (camelCase via FastEndpoints). */
export interface MyStatsResponse {
  remainingDays: number;
  pendingCount: number;
  approvedCount: number;
  usedDays: number;
}

export const myStatsApi = {
  get: () => api.get<MyStatsResponse>("/my-stats"),
};
