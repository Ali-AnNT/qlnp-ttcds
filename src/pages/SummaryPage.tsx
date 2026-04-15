import { useStore } from "@/store/useStore";
import { employees, departments, leaveTypeLabels } from "@/lib/leave-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#2563EB", "#16A34A", "#D97706", "#DC2626", "#8B5CF6"];

const SummaryPage = () => {
  const leaveRequests = useStore(s => s.leaveRequests);
  const [filterDept, setFilterDept] = useState("all");

  const approvedRequests = leaveRequests.filter(r => r.status === "approved");

  // By type pie chart
  const byType = Object.entries(leaveTypeLabels).map(([type, label]) => ({
    name: label,
    value: approvedRequests.filter(r => r.type === type).reduce((s, r) => s + r.days, 0),
  })).filter(d => d.value > 0);

  // Department summary
  const deptSummary = departments.map(dept => {
    const deptEmployees = employees.filter(e => e.departmentId === dept.id);
    const deptRequests = approvedRequests.filter(r => deptEmployees.some(e => e.id === r.employeeId));
    return {
      ...dept,
      totalEmp: deptEmployees.length,
      totalLeave: deptRequests.reduce((s, r) => s + r.days, 0),
      annual: deptRequests.filter(r => r.type === "annual").reduce((s, r) => s + r.days, 0),
      sick: deptRequests.filter(r => r.type === "sick").reduce((s, r) => s + r.days, 0),
      unpaid: deptRequests.filter(r => r.type === "unpaid").reduce((s, r) => s + r.days, 0),
      onLeave: deptRequests.filter(r => {
        const today = "2026-04-15";
        return r.startDate <= today && r.endDate >= today;
      }).length,
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
                  <TableHead className="text-center">Tổng ngày phép</TableHead>
                  <TableHead className="text-center">Phép năm</TableHead>
                  <TableHead className="text-center">Nghỉ bệnh</TableHead>
                  <TableHead className="text-center">Nghỉ KL</TableHead>
                  <TableHead className="text-center">Đang nghỉ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptSummary.map((d, i) => (
                  <TableRow key={d.id} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-center">{d.totalEmp}</TableCell>
                    <TableCell className="text-center font-semibold">{d.totalLeave}</TableCell>
                    <TableCell className="text-center">{d.annual}</TableCell>
                    <TableCell className="text-center">{d.sick}</TableCell>
                    <TableCell className="text-center">{d.unpaid}</TableCell>
                    <TableCell className="text-center">{d.onLeave}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Phân bổ theo loại phép</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SummaryPage;
