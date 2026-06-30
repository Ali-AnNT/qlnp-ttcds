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
    <Card className="lg:lma-col-span-2">
      <CardHeader className="lma-pb-2">
        <CardTitle className="lma-text-sm">Tổng hợp theo phòng ban</CardTitle>
      </CardHeader>
      <CardContent className="lma-p-0">
        <Table>
          <TableHeader>
            <TableRow className="lma-bg-muted/50">
              <TableHead>Phòng ban</TableHead>
              <TableHead className="lma-text-center">Tổng CB</TableHead>
              <TableHead className="lma-text-center">
                Tổng ngày phép đã duyệt
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deptSummary.map((d, i) => (
              <TableRow
                key={d.donViId}
                className={i % 2 === 1 ? "lma-bg-muted/20" : ""}
              >
                <TableCell className="lma-font-medium">
                  {d.tenDonVi ?? ""}
                </TableCell>
                <TableCell className="lma-text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="lma-h-auto !lma-p-0 lma-font-semibold"
                    onClick={() => onEmpClick(d.donViId)}
                  >
                    {d.totalEmp}
                  </Button>
                </TableCell>
                <TableCell className="lma-text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="lma-h-auto !lma-p-0 lma-font-semibold"
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
