import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveRequestsApi } from "../api/leave-requests.api";
import type { CreateLeaveRequestDto } from "../api/types";

// ── Queries ──

export function useLeaveRequests() {
  return useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      const res = await leaveRequestsApi.list();
      return res.data ?? [];
    },
  });
}

export function useMyLeaveRequests() {
  return useQuery({
    queryKey: ["leave-requests", "my"],
    queryFn: async () => {
      const res = await leaveRequestsApi.listMy();
      return res.data ?? [];
    },
  });
}

// ── Mutations ──

/** Throw on API error so TanStack Query tracks the mutation as failed. */
function unwrap<T>(res: { data: T | null; error: string | null }): T {
  if (res.error) throw new Error(res.error);
  return res.data as T;
}

export function useSubmitLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLeaveRequestDto) => {
      const res = await leaveRequestsApi.create(data);
      return unwrap(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateLeaveRequestDto> }) => {
      const res = await leaveRequestsApi.update(id, data);
      return unwrap(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await leaveRequestsApi.cancel(id);
      return unwrap(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}
