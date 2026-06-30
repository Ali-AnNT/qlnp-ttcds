import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/shared/ui/table";
import { formatDate } from "@/shared/lib/date-utils";
import { EmployeeViolation } from "../api/types";
import { LeaveTypeDto } from "@/features/config";

interface EmpDetailDialogProps {
  data: EmployeeViolation | null;
  leaveTypes: LeaveTypeDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmpDetailDialog({ data, leaveTypes, open, onOpenChange }: EmpDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lma-max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chi tiết vượt mức - {data?.userName}</DialogTitle>
        </DialogHeader>
        {data && (
          <div className="lma-space-y-4">
            <div className="lma-grid lma-grid-cols-3 lma-gap-3 lma-text-sm">
              <div>
                <span className="lma-text-muted-foreground">Phòng ban:</span>{" "}
                <span className="lma-font-medium">{data.dept?.tenDonVi}</span>
              </div>
              <div>
                <span className="lma-text-muted-foreground">Đã sử dụng:</span>{" "}
                <span className="lma-font-medium">{data.totalUsed} ngày</span>
              </div>
              <div>
                <span className="lma-text-muted-foreground">Vượt:</span>{" "}
                <span className="lma-font-bold lma-text-destructive">+{data.overage} ngày</span>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại phép</TableHead>
                  <TableHead>Từ ngày</TableHead>
                  <TableHead>Đến ngày</TableHead>
                  <TableHead className="lma-text-center">Số ngày</TableHead>
                  <TableHead>Lý do</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{leaveTypes.find((t) => t.id === r.leaveTypeId)?.name}</TableCell>
                    <TableCell>{formatDate(r.startDate)}</TableCell>
                    <TableCell>{formatDate(r.endDate)}</TableCell>
                    <TableCell className="lma-text-center">{r.totalDays}</TableCell>
                    <TableCell className="lma-max-w-xs truncate">{r.reason}</TableCell>
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
