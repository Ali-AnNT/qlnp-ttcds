import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Eye } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { EmployeeViolation } from "../api/types";

interface ViolationEmpTableProps {
  violations: EmployeeViolation[];
  onDetail: (id: number) => void;
}

export function ViolationEmpTable({ violations, onDetail }: ViolationEmpTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Chi tiết vượt mức cá nhân</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Cán bộ</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead className="text-center">Định mức</TableHead>
              <TableHead className="text-center">Đã sử dụng</TableHead>
              <TableHead className="text-center">Vượt</TableHead>
              <TableHead>Phân loại theo lý do</TableHead>
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
              violations.map((v, i) => (
                <TableRow key={v.userId} className={cn(i % 2 === 1 ? "bg-muted/20" : "", "bg-destructive/5")}>
                  <TableCell className="font-medium">{v.userName}</TableCell>
                  <TableCell>{v.dept?.tenDonVi}</TableCell>
                  <TableCell className="text-center">{v.limit}</TableCell>
                  <TableCell className="text-center">{v.totalUsed}</TableCell>
                  <TableCell className="text-center font-bold text-destructive">+{v.overage}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(v.byType).map(([k, val]) => (
                        <Badge key={k} variant="outline" className="text-xs">
                          {k}: {val}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => onDetail(v.userId)}>
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
