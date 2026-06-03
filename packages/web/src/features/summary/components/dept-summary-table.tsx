import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import type { DepartmentDto } from "../api/summary.api";

interface DeptSummaryRow extends DepartmentDto {
  totalEmp: number;
  totalLeave: number;
}

interface DeptSummaryTableProps {
  deptSummary: DeptSummaryRow[];
  onEmpClick: (donViId: number) => void;
  onDetailClick: (donViId: number) => void;
}

export function DeptSummaryTable({
  deptSummary,
  onEmpClick,
  onDetailClick,
}: DeptSummaryTableProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Tổng hợp theo phòng ban</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Phòng ban</TableHead>
              <TableHead className="text-center">Tổng CB</TableHead>
              <TableHead className="text-center">
                Tổng ngày phép đã duyệt
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deptSummary.map((d, i) => (
              <TableRow
                key={d.donViId}
                className={i % 2 === 1 ? "bg-muted/20" : ""}
              >
                <TableCell className="font-medium">
                  {d.tenDonVi ?? ""}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto !p-0 font-semibold"
                    onClick={() => onEmpClick(d.donViId)}
                  >
                    {d.totalEmp}
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto !p-0 font-semibold"
                    onClick={() => onDetailClick(d.donViId)}
                  >
                    {d.totalLeave}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export type { DeptSummaryRow };
