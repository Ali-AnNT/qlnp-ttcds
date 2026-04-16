import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#2563EB", "#16A34A", "#D97706", "#DC2626", "#8B5CF6"];

const SummaryPage = () => {
  const leaveRequests = useStore((s) => s.leaveRequests);
  const departments = useStore((s) => s.departments);
  const employees = useStore((s) => s.employees);
  const leaveTypes = useStore((s) => s.leaveTypes);

  const approvedRequests = leaveRequests.filter((r) => r.status === "approved_leader" || r.status === "approved_director");

  const byType = leaveTypes.map((lt) => ({
    name: lt.name,
    value: approvedRequests.filter((r) => r.leave_type_id === lt.id).reduce((s, r) => s + Number(r.total_days), 0),
  })).filter((d) => d.value > 0);

  const deptSummary = departments.map((dept) => {
    const deptEmployees = employees.filter((e) => e.department_id === dept.id);
    const deptRequests = approvedRequests.filter((r) => deptEmployees.some((e) => e.id === r.employee_id));
    return {
      ...dept,
      totalEmp: deptEmployees.length,
      totalLeave: deptRequests.reduce((s, r) => s + Number(r.total_days), 0),
    };
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Tổng hợp lịch nghỉ toàn trung tâm</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tổng hợp theo phòng ban</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Phòng ban</TableHead>
                  <TableHead className="text-center">Tổng CB</TableHead>
                  <TableHead className="text-center">Tổng ngày phép đã duyệt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptSummary.map((d, i) => (
                  <TableRow key={d.id} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-center">{d.totalEmp}</TableCell>
                    <TableCell className="text-center font-semibold">{d.totalLeave}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Phân bổ theo loại phép</CardTitle></CardHeader>
          <CardContent>
            {byType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={byType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SummaryPage;
