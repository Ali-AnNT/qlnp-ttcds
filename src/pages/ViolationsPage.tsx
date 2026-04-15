import { useStore } from "@/store/useStore";
import { employees, departments, leaveTypeLabels } from "@/lib/leave-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const ViolationsPage = () => {
  const leaveRequests = useStore(s => s.leaveRequests);
  const approved = leaveRequests.filter(r => r.status === "approved");

  // Calculate overage per employee
  const violations = employees.map(emp => {
    const empRequests = approved.filter(r => r.employeeId === emp.id);
    const totalUsed = empRequests.reduce((s, r) => s + r.days, 0);
    const overage = totalUsed - emp.annualLeaveTotal;
    const dept = departments.find(d => d.id === emp.departmentId);
    return { emp, dept, totalUsed, overage, requests: empRequests };
  }).filter(v => v.overage > 0);

  // Dept summary
  const deptViolations = departments.map(d => {
    const deptV = violations.filter(v => v.dept?.id === d.id);
    return { dept: d, count: deptV.length, totalOverage: deptV.reduce((s, v) => s + v.overage, 0) };
  }).filter(d => d.count > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Theo dõi vượt mức quy định</h2>

      {/* Alert cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-warning/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-warning" />
            <div>
              <p className="text-2xl font-bold">{violations.length}</p>
              <p className="text-xs text-muted-foreground">Cán bộ vượt mức</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{deptViolations.length}</p>
              <p className="text-xs text-muted-foreground">Phòng ban có vi phạm</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee violations */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Chi tiết vượt mức cá nhân</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Cán bộ</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead className="text-center">Ngày phép QĐ</TableHead>
                <TableHead className="text-center">Đã sử dụng</TableHead>
                <TableHead className="text-center">Vượt (ngày)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {violations.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Không có vi phạm</TableCell></TableRow>
              ) : violations.map((v, i) => (
                <TableRow key={v.emp.id} className={cn(i % 2 === 1 ? "bg-muted/20" : "", "bg-destructive/5")}>
                  <TableCell className="font-medium">{v.emp.name}</TableCell>
                  <TableCell>{v.dept?.name}</TableCell>
                  <TableCell className="text-center">{v.emp.annualLeaveTotal}</TableCell>
                  <TableCell className="text-center">{v.totalUsed}</TableCell>
                  <TableCell className="text-center font-bold text-destructive">+{v.overage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dept summary */}
      {deptViolations.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tổng hợp theo phòng ban</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Phòng ban</TableHead>
                  <TableHead className="text-center">Số CB vượt mức</TableHead>
                  <TableHead className="text-center">Tổng ngày vượt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptViolations.map(d => (
                  <TableRow key={d.dept.id}>
                    <TableCell className="font-medium">{d.dept.name}</TableCell>
                    <TableCell className="text-center">{d.count}</TableCell>
                    <TableCell className="text-center font-bold text-destructive">+{d.totalOverage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ViolationsPage;
