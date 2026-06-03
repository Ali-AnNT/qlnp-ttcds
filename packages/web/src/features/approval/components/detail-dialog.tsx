import type { LeaveRequestDto } from "@/features/leave-requests";
import type { DepartmentDto } from "@/features/layout";
import { formatDate } from "@/shared/lib/date-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { getApprovalStatusLabel } from "@/features/shared-reference-data";

interface DetailDialogProps {
  request: LeaveRequestDto | null;
  departments: DepartmentDto[];
  maxLevelByType: Map<number, number>;
  onClose: () => void;
}

export function DetailDialog({ request, departments, maxLevelByType, onClose }: DetailDialogProps) {
  if (!request) return null;

  const maxLevel = maxLevelByType.get(request.leaveTypeId) ?? 1;
  const statusLabel = getApprovalStatusLabel(request.status, request.approvedLevel, maxLevel);
  const department = departments.find((d) => d.donViId === request.donViId);

  return (
    <Dialog open={!!request} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Chi tiết đơn nghỉ phép</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">Họ tên:</span> <strong>{request.userName}</strong></div>
            <div><span className="text-muted-foreground">Phòng ban:</span> {department?.tenDonVi ?? "—"}</div>
            <div><span className="text-muted-foreground">Loại phép:</span> {request.leaveTypeName ?? "—"}</div>
            <div><span className="text-muted-foreground">Số ngày:</span> {request.totalDays}</div>
            <div><span className="text-muted-foreground">Trạng thái:</span> {statusLabel}</div>
            <div><span className="text-muted-foreground">Từ ngày:</span> {formatDate(request.startDate)}</div>
            <div><span className="text-muted-foreground">Đến ngày:</span> {formatDate(request.endDate)}</div>
          </div>
          <div><span className="text-muted-foreground">Lý do:</span> {request.reason}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
