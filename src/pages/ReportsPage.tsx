import { useStore } from "@/store/useStore";
import { employees, departments, leaveTypeLabels, leaveStatusLabels } from "@/lib/leave-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Download } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#2563EB", "#16A34A", "#D97706", "#DC2626", "#8B5CF6"];

const ReportsPage = () => {
  const leaveRequests = useStore(s => s.leaveRequests);
  const approved = leaveRequests.filter(r => r.status === "approved");
  const rejected = leaveRequests.filter(r => r.status === "rejected");

  const totalDays = approved.reduce((s, r) => s + r.days, 0);
  const approvedRatio = leaveRequests.length > 0 ? Math.round((approved.length / leaveRequests.length) * 100) : 0;

  // By dept bar chart
  const byDept = departments.map(d => {
    const deptEmps = employees.filter(e => e.departmentId === d.id);
    const days = approved.filter(r => deptEmps.some(e => e.id === r.employeeId)).reduce((s, r) => s + r.days, 0);
    return { name: d.name.replace("Phòng ", ""), days };
  });

  // By type pie
  const byType = Object.entries(leaveTypeLabels).map(([type, label]) => ({
    name: label,
    value: approved.filter(r => r.type === type).reduce((s, r) => s + r.days, 0),
  })).filter(d => d.value > 0);

  // Monthly trend
  const months = Array.from({ length: 6 }, (_, i) => {
    const m = i + 1;
    const monthStr = `2026-${String(m).padStart(2, "0")}`;
    const days = approved.filter(r => r.startDate.startsWith(monthStr)).reduce((s, r) => s + r.days, 0);
    return { name: `T${m}`, days };
  });

  const handleExport = () => {
    const rows = [["Họ tên", "Phòng ban", "Loại phép", "Từ ngày", "Đến ngày", "Số ngày", "Trạng thái"]];
    leaveRequests.forEach(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      const dept = departments.find(d => d.id === emp?.departmentId);
      rows.push([emp?.name || "", dept?.name || "", leaveTypeLabels[r.type], r.startDate, r.endDate, String(r.days), leaveStatusLabels[r.status]]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "bao-cao-nghi-phep.csv"; a.click();
    toast.success("Đã xuất file báo cáo");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Thống kê báo cáo</h2>
        <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1" /> Xuất Excel</Button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalDays}</p><p className="text-xs text-muted-foreground">Tổng ngày nghỉ đã duyệt</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{approvedRatio}%</p><p className="text-xs text-muted-foreground">Tỷ lệ duyệt</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{rejected.length}</p><p className="text-xs text-muted-foreground">Đơn bị từ chối</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ngày nghỉ theo phòng ban</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byDept}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="days" fill="#2563EB" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Phân bổ theo loại phép</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart><Pie data={byType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>{byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Line chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Xu hướng nghỉ phép theo tháng</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={months}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Line type="monotone" dataKey="days" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} /></LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
