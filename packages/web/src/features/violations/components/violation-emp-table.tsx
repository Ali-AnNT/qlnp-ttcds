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
      <CardHeader className="lma-pb-2">
        <CardTitle className="lma-text-sm">Chi tiết vượt mức cá nhân</CardTitle>
      </CardHeader>
      <CardContent className="lma-p-0">
        <Table>
          <TableHeader>
            <TableRow className="lma-bg-muted/50">
              <TableHead>Cán bộ</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead className="lma-text-center">Định mức</TableHead>
              <TableHead className="lma-text-center">Đã sử dụng</TableHead>
              <TableHead className="lma-text-center">Vượt</TableHead>
              <TableHead>Phân loại theo lý do</TableHead>
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
              violations.map((v, i) => (
                <TableRow key={v.userId} className={cn(i % 2 === 1 ? "lma-bg-muted/20" : "", "lma-bg-destructive/5")}>
                  <TableCell className="lma-font-medium">{v.userName}</TableCell>
                  <TableCell>{v.dept?.tenDonVi}</TableCell>
                  <TableCell className="lma-text-center">{v.limit}</TableCell>
                  <TableCell className="lma-text-center">{v.totalUsed}</TableCell>
                  <TableCell className="lma-text-center lma-font-bold lma-text-destructive">+{v.overage}</TableCell>
                  <TableCell>
                    <div className="lma-flex lma-flex-wrap lma-gap-1">
                      {Object.entries(v.byType).map(([k, val]) => (
                        <Badge key={k} variant="outline" className="lma-text-xs">
                          {k}: {val}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="lma-text-center">
                    <Button variant="ghost" size="sm" onClick={() => onDetail(v.userId)}>
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
