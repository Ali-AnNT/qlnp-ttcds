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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chi tiết phòng ban - {data?.dept?.tenDonVi || ""}</DialogTitle>
        </DialogHeader>
        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Tổng CB:</span>{" "}
                <span className="font-medium">{data.empCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">CB vượt:</span>{" "}
                <span className="font-bold text-warning">{data.violatingCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Đã duyệt:</span>{" "}
                <span className="font-medium">{data.totalUsed}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tổng vượt:</span>{" "}
                <span className="font-bold text-destructive">+{data.totalEmpOverage}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 text-muted-foreground">
                PHÂN LOẠI THEO LÝ DO NGHỈ
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.byType).map(([k, val]) => (
                  <Badge key={k} variant="outline">
                    {k}: {val} ngày
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 text-muted-foreground">CÁN BỘ VƯỢT MỨC</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cán bộ</TableHead>
                    <TableHead className="text-center">Đã sử dụng</TableHead>
                    <TableHead className="text-center">Vượt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeViolations
                    .filter((v) => v.dept?.donViId === data.dept.donViId)
                    .map((v) => (
                      <TableRow key={v.userId}>
                        <TableCell className="font-medium">{v.userName}</TableCell>
                        <TableCell className="text-center">{v.totalUsed}</TableCell>
                        <TableCell className="text-center font-bold text-destructive">
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
