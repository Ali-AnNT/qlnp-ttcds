import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const ViolationsPage = () => {
  const leaveRequests = useStore((s) => s.leaveRequests);
  const employees = useStore((s) => s.employees);
  const departments = useStore((s) => s.departments);
  const getDepartment = useStore((s) => s.getDepartment);

  const approved = leaveRequests.filter((r) => r.status === "approved_leader" || r.status === "approved_director");

  const violations = employees.map((emp) => {
    const empRequests = approved.filter((r) => r.employee_id === emp.id);
    const totalUsed = empRequests.reduce((s, r) => s + Number(r.total_days), 0);
    const overage = totalUsed - 12;
    const dept = emp.department_id ? getDepartment(emp.department_id) : undefined;
    return { emp, dept, totalUsed, overage };
  }).filter((v) => v.overage > 0);

  const deptViolations = departments.map((d) => {
    const deptV = violations.filter((v) => v.dept?.id === d.id);
    return { dept: d, count: deptV.length, totalOverage: deptV.reduce((s, v) => s + v.overage, 0) };
  }).filter((d) => d.count > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Theo dõi vượt mức quy định</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-warning/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-warning" />
            <div><p className="text-2xl font-bold">{violations.length}</p><p className="text-xs text-muted-foreground">Cán bộ vượt mức</p></div>
          </CardContent>
        </Card>
        <Card className="border-warning/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div><p className="text-2xl font-bold">{deptViolations.length}</p><p className="text-xs text-muted-foreground">Phòng ban có vi phạm</p></div>
          </CardContent>
        </Card>
      </div>
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
                  <TableCell className="font-medium">{v.emp.full_name}</TableCell>
                  <TableCell>{v.dept?.name}</TableCell>
                  <TableCell className="text-center">12</TableCell>
                  <TableCell className="text-center">{v.totalUsed}</TableCell>
                  <TableCell className="text-center font-bold text-destructive">+{v.overage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViolationsPage;
