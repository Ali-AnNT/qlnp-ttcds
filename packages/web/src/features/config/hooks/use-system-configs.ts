import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { systemConfigsApi } from "../api/system-configs.api";
import { SystemConfigDto } from "../api/types";
import { toast } from "sonner";

export const useSystemConfigs = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["system-configs"],
    queryFn: async () => {
      const { data, error } = await systemConfigsApi.get();
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SystemConfigDto[]) => systemConfigsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-configs"] });
      toast.success("Đã lưu cấu hình chung");
    },
    onError: () => toast.error("Lỗi lưu cấu hình chung"),
  });

  return {
    systemConfigs: query.data || [],
    isLoading: query.isLoading,
    updateSystemConfigs: updateMutation.mutateAsync,
  };
};
