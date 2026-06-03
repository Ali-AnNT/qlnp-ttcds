import { useState } from "react";
import { useApprovalConfigs } from "../hooks/use-approval-configs";
import { useApprovableRequests } from "../hooks/use-approvable-requests";
import {
  useApproveLeaveRequest,
  useRejectLeaveRequest,
} from "../hooks/use-approval-actions";
import { useQuery } from "@tanstack/react-query";
import { departmentsApi, type DepartmentDto } from "@/features/layout";
import { ApprovalTable } from "./approval-table";
import { RejectDialog } from "./reject-dialog";
import { DetailDialog } from "./detail-dialog";
import { Input } from "@/shared/ui/input";
import { Card, CardContent } from "@/shared/ui/card";
import type { LeaveRequestDto } from "@/features/leave-requests";

export function ApprovalPage() {
  const { data: requests = [], isLoading } = useApprovableRequests();
  const { maxLevelByType } = useApprovalConfigs();
  const approveMutation = useApproveLeaveRequest();
  const rejectMutation = useRejectLeaveRequest();
  const [filterName, setFilterName] = useState("");
  const [detailRequest, setDetailRequest] = useState<LeaveRequestDto | null>(
    null,
  );
  const [rejectId, setRejectId] = useState<number | null>(null);

  // Departments used for display in table/detail (BE returns donViName, but
  // the existing UI looks up TenDonVi via the departments list)
  const { data: departments = [] } = useQuery<DepartmentDto[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await departmentsApi.list();
      return res.data ?? [];
    },
  });

  const visibleRequests = filterName
    ? requests.filter((r) =>
        (r.userName || "").toLowerCase().includes(filterName.toLowerCase()),
      )
    : requests;

  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  const handleRejectConfirm = (reason: string) => {
    if (!rejectId) return;
    rejectMutation.mutate({ id: rejectId, reason });
    setRejectId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Phê duyệt đơn nghỉ phép</h2>
        <Input
          placeholder="Tìm theo tên..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="w-60"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <ApprovalTable
            requests={visibleRequests}
            departments={departments}
            maxLevelByType={maxLevelByType}
            loading={isLoading}
            onApprove={handleApprove}
            onReject={(id) => setRejectId(id)}
            onDetail={(r) => setDetailRequest(r)}
          />
        </CardContent>
      </Card>

      <RejectDialog
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        onConfirm={handleRejectConfirm}
        loading={rejectMutation.isPending}
      />

      <DetailDialog
        request={detailRequest}
        departments={departments}
        maxLevelByType={maxLevelByType}
        onClose={() => setDetailRequest(null)}
      />
    </div>
  );
}
