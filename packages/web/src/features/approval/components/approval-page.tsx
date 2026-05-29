import { useState, useMemo } from "react";
import { useAuth } from "@/features/auth";
import { useApprovalConfigs } from "../hooks/use-approval-configs";
import { useApprovalRequests } from "../hooks/use-approval-requests";
import { useApproveLeaveRequest, useRejectLeaveRequest } from "../hooks/use-approval-actions";
import { useLeaveTypes } from "@/features/leave-requests";
import { useQuery } from "@tanstack/react-query";
import { departmentsApi, type DepartmentDto } from "@/features/layout";
import { ApprovalTable } from "./approval-table";
import { RejectDialog } from "./reject-dialog";
import { DetailDialog } from "./detail-dialog";
import { Input } from "@/shared/ui/input";
import { AppRoles } from "@/features/shared-reference-data";
import { Card, CardContent } from "@/shared/ui/card";
import type { LeaveRequestDto } from "@/features/leave-requests";

export function ApprovalPage() {
  const { user } = useAuth();
  const { data: leaveRequests = [], isLoading: requestsLoading } = useApprovalRequests();
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { maxLevelByType, flowByType } = useApprovalConfigs();
  const approveMutation = useApproveLeaveRequest();
  const rejectMutation = useRejectLeaveRequest();
  const [filterName, setFilterName] = useState("");
  const [detailRequest, setDetailRequest] = useState<LeaveRequestDto | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);

  // Fetch departments via TanStack Query
  const { data: departments = [] } = useQuery<DepartmentDto[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await departmentsApi.list();
      return res.data ?? [];
    },
  });

  // Config-driven filtering: show requests where the current user's role
  // is a valid approver at the next approval level
  const visibleRequests = useMemo(
    () =>
      leaveRequests
        .filter((r) => {
          if (!user) return false;
          if (r.status !== "pending") return false;

          const flow = flowByType.get(r.leaveTypeId);
          if (!flow) return false;

          const nextLevel = r.approvedLevel + 1;
          const rolesAtNextLevel = flow.get(nextLevel);
          if (!rolesAtNextLevel) return false;

          const hasRole = rolesAtNextLevel.some((role) => role === user.role);
          if (!hasRole) return false;

          if (user.role === AppRoles.Leader) {
            if (r.userId === user.userId) return false;
          }

          return true;
        })
        .filter(
          (r) =>
            !filterName ||
            (r.userName || "").toLowerCase().includes(filterName.toLowerCase()),
        ),
    [leaveRequests, user, flowByType, filterName],
  );

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
            leaveTypes={leaveTypes}
            departments={departments}
            maxLevelByType={maxLevelByType}
            loading={requestsLoading}
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
        leaveTypes={leaveTypes}
        departments={departments}
        maxLevelByType={maxLevelByType}
        onClose={() => setDetailRequest(null)}
      />
    </div>
  );
}
