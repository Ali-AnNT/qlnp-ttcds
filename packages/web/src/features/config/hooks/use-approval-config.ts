import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { configApi } from "../api/config.api";
import { ConfigDto } from "../api/types";
import { toast } from "sonner";

export const useApprovalConfig = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["approval-configs"],
    queryFn: async () => {
      const { data, error } = await configApi.get();
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ConfigDto[]) => configApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-configs"] });
      toast.success("Đã lưu cấu hình phê duyệt");
    },
    onError: () => toast.error("Lỗi cập nhật cấu hình phê duyệt"),
  });

  return {
    approvalConfigs: query.data || [],
    isLoading: query.isLoading,
    updateApprovalConfigs: updateMutation.mutateAsync,
  };
};
