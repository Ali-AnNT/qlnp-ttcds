import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import { formatDate } from "@/shared/lib/date-utils";
import { getApprovalStatusLabel } from "@/features/shared-reference-data";
import type { LeaveRequestDto } from "@/features/leave-requests/api/types";
import type { DepartmentDto } from "@/features/layout";
import type { LeaveTypeDto } from "@/features/config";

interface CalendarListProps {
  requests: LeaveRequestDto[];
  departments: DepartmentDto[];
  leaveTypes: LeaveTypeDto[];
  maxLevelByType: Map<number, number>;
}

export const CalendarList = ({ requests, departments, leaveTypes, maxLevelByType }: CalendarListProps) => {
  const sorted = [...requests].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Tên CB</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead>Loại phép</TableHead>
              <TableHead>Từ ngày</TableHead>
              <TableHead>Đến ngày</TableHead>
              <TableHead>Số ngày</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r, i) => {
              const lt = leaveTypes.find((t) => t.id === r.leaveTypeId);
              const dept = departments.find((d) => d.donViId === r.donViId);
              return (
                <TableRow key={r.id} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                  <TableCell className="font-medium">{r.userName}</TableCell>
                  <TableCell>{dept?.tenDonVi}</TableCell>
                  <TableCell>{lt?.name}</TableCell>
                  <TableCell>{formatDate(r.startDate)}</TableCell>
                  <TableCell>{formatDate(r.endDate)}</TableCell>
                  <TableCell className="text-center">{r.totalDays}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px]",
                        r.status === "approved"
                          ? "bg-success/10 text-success border-success/30"
                          : r.status === "pending"
                            ? "bg-warning/10 text-warning border-warning/30"
                            : r.status === "rejected"
                              ? "bg-destructive/10 text-destructive border-destructive/30"
                              : "bg-muted text-muted-foreground",
                      )}
                    >
                      {getApprovalStatusLabel(r.status, r.approvedLevel, maxLevelByType.get(r.leaveTypeId) ?? 1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
