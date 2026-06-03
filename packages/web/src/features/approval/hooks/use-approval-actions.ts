import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveRequestsApi } from "@/features/leave-requests";
import { toast } from "sonner";

/** Throw on API error or null data so TanStack Query tracks the mutation as failed. */
function unwrap<T>(res: { data: T | null; error: string | null }): T {
  if (res.error) throw new Error(res.error);
  if (res.data == null) throw new Error("Empty response");
  return res.data;
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await leaveRequestsApi.approve(id);
      return unwrap(res);
    },
    onSuccess: () => {
      toast.success("Đã phê duyệt");
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Phê duyệt thất bại");
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await leaveRequestsApi.reject(id, reason);
      return unwrap(res);
    },
    onSuccess: () => {
      toast.success("Đã từ chối");
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Từ chối thất bại");
    },
  });
}
