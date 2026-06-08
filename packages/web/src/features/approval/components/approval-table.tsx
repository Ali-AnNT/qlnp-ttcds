import type { LeaveRequestDto } from "@/features/leave-requests";
import type { DepartmentDto } from "@/features/layout";
import { formatDate } from "@/shared/lib/date-utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { getApprovalStatusLabel } from "@/features/shared-reference-data";

interface ApprovalTableProps {
  requests: LeaveRequestDto[];
  departments: DepartmentDto[];
  maxLevelByType: Map<number, number>;
  loading: boolean;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onDetail: (request: LeaveRequestDto) => void;
}

export function ApprovalTable({
  requests,
  departments,
  maxLevelByType,
  loading,
  onApprove,
  onReject,
  onDetail,
}: ApprovalTableProps) {
  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow className="lma-bg-muted/50">
            <TableHead className="lma-w-12">STT</TableHead>
            <TableHead>Họ tên CB</TableHead>
            <TableHead>Phòng ban</TableHead>
            <TableHead>Loại phép</TableHead>
            <TableHead>Từ ngày</TableHead>
            <TableHead>Đến ngày</TableHead>
            <TableHead className="lma-w-16">Số ngày</TableHead>
            <TableHead>Lý do</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày gửi</TableHead>
            <TableHead className="lma-w-40">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 11 }).map((_, j) => (
                <TableCell key={j}>
                  <div className="lma-h-4 lma-bg-muted rounded lma-animate-pulse" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (requests.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow className="lma-bg-muted/50">
            <TableHead className="lma-w-12">STT</TableHead>
            <TableHead>Họ tên CB</TableHead>
            <TableHead>Phòng ban</TableHead>
            <TableHead>Loại phép</TableHead>
            <TableHead>Từ ngày</TableHead>
            <TableHead>Đến ngày</TableHead>
            <TableHead className="lma-w-16">Số ngày</TableHead>
            <TableHead>Lý do</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày gửi</TableHead>
            <TableHead className="lma-w-40">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={11} className="lma-text-center lma-text-muted-foreground lma-py-8">
              Không có đơn chờ duyệt
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="lma-bg-muted/50">
          <TableHead className="lma-w-12">STT</TableHead>
          <TableHead>Họ tên CB</TableHead>
          <TableHead>Phòng ban</TableHead>
          <TableHead>Loại phép</TableHead>
          <TableHead>Từ ngày</TableHead>
          <TableHead>Đến ngày</TableHead>
          <TableHead className="lma-w-16">Số ngày</TableHead>
          <TableHead>Lý do</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Ngày gửi</TableHead>
          <TableHead className="lma-w-40">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((r, i) => {
          const dept = departments.find((d) => d.donViId === r.donViId);
          const maxLevel = maxLevelByType.get(r.leaveTypeId) ?? 1;
          const statusLabel = getApprovalStatusLabel(r.status, r.approvedLevel, maxLevel);
          return (
            <TableRow key={r.id} className={i % 2 === 1 ? "lma-bg-muted/20" : ""}>
              <TableCell className="lma-text-center">{i + 1}</TableCell>
              <TableCell className="lma-font-medium">{r.userName}</TableCell>
              <TableCell>{dept?.tenDonVi}</TableCell>
              <TableCell>{r.leaveTypeName ?? "—"}</TableCell>
              <TableCell>{formatDate(r.startDate)}</TableCell>
              <TableCell>{formatDate(r.endDate)}</TableCell>
              <TableCell className="lma-text-center">{r.totalDays}</TableCell>
              <TableCell className="lma-max-w-[150px] truncate">{r.reason}</TableCell>
              <TableCell>{statusLabel}</TableCell>
              <TableCell>{formatDate(r.createdAt)}</TableCell>
              <TableCell>
                <div className="lma-flex lma-gap-1">
                  <Button
                    size="sm"
                    className="lma-h-7 lma-px-2 lma-bg-success hover:lma-bg-success/90 lma-text-success-foreground disabled:lma-opacity-40 disabled:lma-cursor-not-allowed"
                    onClick={() => onApprove(r.id)}
                    disabled={!r.canCurrentUserApprove}
                    title={r.canCurrentUserApprove ? "Phê duyệt" : "Đơn đang chờ cấp khác duyệt"}
                  >
                    <CheckCircle className="lma-h-3 lma-w-3 lma-mr-1" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="lma-h-7 lma-px-2 disabled:lma-opacity-40 disabled:lma-cursor-not-allowed"
                    onClick={() => onReject(r.id)}
                    disabled={!r.canCurrentUserApprove}
                    title={r.canCurrentUserApprove ? "Từ chối" : "Đơn đang chờ cấp khác duyệt"}
                  >
                    <XCircle className="lma-h-3 lma-w-3 lma-mr-1" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="lma-h-7 lma-px-2"
                    onClick={() => onDetail(r)}
                    title="Xem chi tiết"
                  >
                    <Eye className="lma-h-3 lma-w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
