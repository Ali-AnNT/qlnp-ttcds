import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveTypesApi } from "../api/leave-types.api";
import { LeaveTypeDto } from "../api/types";
import { toast } from "sonner";

export const useLeaveTypes = (opts?: { q?: string; includeInactive?: boolean }) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["leave-types", { q: opts?.q, includeInactive: opts?.includeInactive }],
    queryFn: async () => {
      const { data, error } = await leaveTypesApi.list({ q: opts?.q, includeInactive: opts?.includeInactive });
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<LeaveTypeDto, "id">) => leaveTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      // Also invalidate global data if needed, but in VSA we try to keep it local
      toast.success("Đã tạo loại phép mới");
    },
    onError: () => toast.error("Lỗi tạo loại phép"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<LeaveTypeDto, "id"> }) =>
      leaveTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      toast.success("Đã cập nhật loại phép");
    },
    onError: () => toast.error("Lỗi cập nhật loại phép"),
  });

  // Backend Update yêu cầu full object (validator ép Name/Code/DefaultDays).
  // Merge record hiện tại từ cache với isActive mới để gửi đủ field.
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => {
      const current = query.data?.find((lt) => lt.id === id);
      if (!current) throw new Error("Không tìm thấy loại phép để đổi trạng thái");
      const { id: _id, ...rest } = current;
      return leaveTypesApi.update(id, { ...rest, isActive });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      toast.success(variables.isActive ? "Đã kích hoạt loại phép" : "Đã tắt loại phép");
    },
    onError: () => toast.error("Lỗi cập nhật trạng thái"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => leaveTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      toast.success("Đã xóa loại phép");
    },
    onError: () => toast.error("Lỗi xóa loại phép"),
  });

  return {
    leaveTypes: query.data || [],
    isLoading: query.isLoading,
    createLeaveType: createMutation.mutateAsync,
    updateLeaveType: updateMutation.mutateAsync,
    toggleLeaveType: toggleMutation.mutateAsync,
    deleteLeaveType: deleteMutation.mutateAsync,
  };
};
