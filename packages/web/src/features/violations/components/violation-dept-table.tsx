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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Vượt mức theo phòng ban</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Phòng ban</TableHead>
              <TableHead className="text-center">Tổng CB</TableHead>
              <TableHead className="text-center">CB vượt mức</TableHead>
              <TableHead className="text-center">Tổng ngày đã duyệt</TableHead>
              <TableHead className="text-center">Định mức</TableHead>
              <TableHead className="text-center">Vượt (ngày)</TableHead>
              <TableHead className="text-center">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {violations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Không có vi phạm
                </TableCell>
              </TableRow>
            ) : (
              violations.map((d, i) => (
                <TableRow key={d.dept.donViId} className={cn(i % 2 === 1 ? "bg-muted/20" : "")}>
                  <TableCell className="font-medium">{d.dept.tenDonVi ?? ""}</TableCell>
                  <TableCell className="text-center">{d.empCount}</TableCell>
                  <TableCell className="text-center font-bold text-warning">{d.violatingCount}</TableCell>
                  <TableCell className="text-center">{d.totalUsed}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{d.allowed}</TableCell>
                  <TableCell className="text-center font-bold text-destructive">+{d.totalEmpOverage}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => onDetail(d.dept.donViId)}>
                      <Eye className="h-4 w-4" />
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
