import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/shared/ui/table";
import { formatDate } from "@/shared/lib/date-utils";
import { EmployeeViolation } from "../api/types";
import { LeaveTypeDto } from "@/features/config/api/leave-types.api";

interface EmpDetailDialogProps {
  data: EmployeeViolation | null;
  leaveTypes: LeaveTypeDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmpDetailDialog({ data, leaveTypes, open, onOpenChange }: EmpDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chi tiết vượt mức - {data?.userName}</DialogTitle>
        </DialogHeader>
        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Phòng ban:</span>{" "}
                <span className="font-medium">{data.dept?.tenDonVi}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Đã sử dụng:</span>{" "}
                <span className="font-medium">{data.totalUsed} ngày</span>
              </div>
              <div>
                <span className="text-muted-foreground">Vượt:</span>{" "}
                <span className="font-bold text-destructive">+{data.overage} ngày</span>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại phép</TableHead>
                  <TableHead>Từ ngày</TableHead>
                  <TableHead>Đến ngày</TableHead>
                  <TableHead className="text-center">Số ngày</TableHead>
                  <TableHead>Lý do</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{leaveTypes.find((t) => t.id === r.leaveTypeId)?.name}</TableCell>
                    <TableCell>{formatDate(r.startDate)}</TableCell>
                    <TableCell>{formatDate(r.endDate)}</TableCell>
                    <TableCell className="text-center">{r.totalDays}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
