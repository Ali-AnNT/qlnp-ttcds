import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Eye } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { DepartmentViolation } from "../api/types";

interface ViolationDeptTableProps {
  violations: DepartmentViolation[];
  onDetail: (id: number) => void;
}

export function ViolationDeptTable({ violations, onDetail }: ViolationDeptTableProps) {
  return (
    <Card>
      <CardHeader className="lma-pb-2">
        <CardTitle className="lma-text-sm">Vượt mức theo phòng ban</CardTitle>
      </CardHeader>
      <CardContent className="lma-p-0">
        <Table>
          <TableHeader>
            <TableRow className="lma-bg-muted/50">
              <TableHead>Phòng ban</TableHead>
              <TableHead className="lma-text-center">Tổng CB</TableHead>
              <TableHead className="lma-text-center">CB vượt mức</TableHead>
              <TableHead className="lma-text-center">Tổng ngày đã duyệt</TableHead>
              <TableHead className="lma-text-center">Định mức</TableHead>
              <TableHead className="lma-text-center">Vượt (ngày)</TableHead>
              <TableHead className="lma-text-center">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {violations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="lma-text-center lma-text-muted-foreground lma-py-8">
                  Không có vi phạm
                </TableCell>
              </TableRow>
            ) : (
              violations.map((d, i) => (
                <TableRow key={d.dept.donViId} className={cn(i % 2 === 1 ? "lma-bg-muted/20" : "")}>
                  <TableCell className="lma-font-medium">{d.dept.tenDonVi ?? ""}</TableCell>
                  <TableCell className="lma-text-center">{d.empCount}</TableCell>
                  <TableCell className="lma-text-center lma-font-bold lma-text-warning">{d.violatingCount}</TableCell>
                  <TableCell className="lma-text-center">{d.totalUsed}</TableCell>
                  <TableCell className="lma-text-center lma-text-muted-foreground">{d.allowed}</TableCell>
                  <TableCell className="lma-text-center lma-font-bold lma-text-destructive">+{d.totalEmpOverage}</TableCell>
                  <TableCell className="lma-text-center">
                    <Button variant="ghost" size="sm" onClick={() => onDetail(d.dept.donViId)}>
                      <Eye className="lma-h-4 lma-w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
