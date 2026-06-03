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
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">STT</TableHead>
            <TableHead>Họ tên CB</TableHead>
            <TableHead>Phòng ban</TableHead>
            <TableHead>Loại phép</TableHead>
            <TableHead>Từ ngày</TableHead>
            <TableHead>Đến ngày</TableHead>
            <TableHead className="w-16">Số ngày</TableHead>
            <TableHead>Lý do</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày gửi</TableHead>
            <TableHead className="w-40">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 11 }).map((_, j) => (
                <TableCell key={j}>
                  <div className="h-4 bg-muted rounded animate-pulse" />
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
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">STT</TableHead>
            <TableHead>Họ tên CB</TableHead>
            <TableHead>Phòng ban</TableHead>
            <TableHead>Loại phép</TableHead>
            <TableHead>Từ ngày</TableHead>
            <TableHead>Đến ngày</TableHead>
            <TableHead className="w-16">Số ngày</TableHead>
            <TableHead>Lý do</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày gửi</TableHead>
            <TableHead className="w-40">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
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
        <TableRow className="bg-muted/50">
          <TableHead className="w-12">STT</TableHead>
          <TableHead>Họ tên CB</TableHead>
          <TableHead>Phòng ban</TableHead>
          <TableHead>Loại phép</TableHead>
          <TableHead>Từ ngày</TableHead>
          <TableHead>Đến ngày</TableHead>
          <TableHead className="w-16">Số ngày</TableHead>
          <TableHead>Lý do</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Ngày gửi</TableHead>
          <TableHead className="w-40">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((r, i) => {
          const dept = departments.find((d) => d.donViId === r.donViId);
          const maxLevel = maxLevelByType.get(r.leaveTypeId) ?? 1;
          const statusLabel = getApprovalStatusLabel(r.status, r.approvedLevel, maxLevel);
          return (
            <TableRow key={r.id} className={i % 2 === 1 ? "bg-muted/20" : ""}>
              <TableCell className="text-center">{i + 1}</TableCell>
              <TableCell className="font-medium">{r.userName}</TableCell>
              <TableCell>{dept?.tenDonVi}</TableCell>
              <TableCell>{r.leaveTypeName ?? "—"}</TableCell>
              <TableCell>{formatDate(r.startDate)}</TableCell>
              <TableCell>{formatDate(r.endDate)}</TableCell>
              <TableCell className="text-center">{r.totalDays}</TableCell>
              <TableCell className="max-w-[150px] truncate">{r.reason}</TableCell>
              <TableCell>{statusLabel}</TableCell>
              <TableCell>{formatDate(r.createdAt)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="h-7 px-2 bg-success hover:bg-success/90 text-success-foreground"
                    onClick={() => onApprove(r.id)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2"
                    onClick={() => onReject(r.id)}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => onDetail(r)}
                  >
                    <Eye className="h-3 w-3" />
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
