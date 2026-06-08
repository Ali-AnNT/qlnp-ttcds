import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { DepartmentViolation, EmployeeViolation } from "../api/types";

interface DeptDetailDialogProps {
  data: DepartmentViolation | null;
  employeeViolations: EmployeeViolation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeptDetailDialog({
  data,
  employeeViolations,
  open,
  onOpenChange,
}: DeptDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lma-max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chi tiết phòng ban - {data?.dept?.tenDonVi || ""}</DialogTitle>
        </DialogHeader>
        {data && (
          <div className="lma-space-y-4">
            <div className="lma-grid lma-grid-cols-2 sm:lma-grid-cols-4 lma-gap-3 lma-text-sm">
              <div>
                <span className="lma-text-muted-foreground">Tổng CB:</span>{" "}
                <span className="lma-font-medium">{data.empCount}</span>
              </div>
              <div>
                <span className="lma-text-muted-foreground">CB vượt:</span>{" "}
                <span className="lma-font-bold lma-text-warning">{data.violatingCount}</span>
              </div>
              <div>
                <span className="lma-text-muted-foreground">Đã duyệt:</span>{" "}
                <span className="lma-font-medium">{data.totalUsed}</span>
              </div>
              <div>
                <span className="lma-text-muted-foreground">Tổng vượt:</span>{" "}
                <span className="lma-font-bold lma-text-destructive">+{data.totalEmpOverage}</span>
              </div>
            </div>
            <div>
              <p className="lma-text-xs lma-font-semibold lma-mb-2 lma-text-muted-foreground">
                PHÂN LOẠI THEO LÝ DO NGHỈ
              </p>
              <div className="lma-flex lma-flex-wrap lma-gap-2">
                {Object.entries(data.byType).map(([k, val]) => (
                  <Badge key={k} variant="outline">
                    {k}: {val} ngày
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="lma-text-xs lma-font-semibold lma-mb-2 lma-text-muted-foreground">CÁN BỘ VƯỢT MỨC</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cán bộ</TableHead>
                    <TableHead className="lma-text-center">Đã sử dụng</TableHead>
                    <TableHead className="lma-text-center">Vượt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeViolations
                    .filter((v) => v.dept?.donViId === data.dept.donViId)
                    .map((v) => (
                      <TableRow key={v.userId}>
                        <TableCell className="lma-font-medium">{v.userName}</TableCell>
                        <TableCell className="lma-text-center">{v.totalUsed}</TableCell>
                        <TableCell className="lma-text-center lma-font-bold lma-text-destructive">
                          +{v.overage}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
