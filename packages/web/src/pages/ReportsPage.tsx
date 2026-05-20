import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { formatDate } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#2563EB", "#16A34A", "#D97706", "#DC2626", "#8B5CF6"];

const ReportsPage = () => {
  const leaveRequests = useStore((s) => s.leaveRequests);
  const departments = useStore((s) => s.departments);
  const leaveTypes = useStore((s) => s.leaveTypes);
  const loadData = useStore((s) => s.loadData);

  useEffect(() => { loadData(); }, []);

  const approved = leaveRequests.filter((r) => r.status === "approved_leader" || r.status === "approved_director");
  const rejected = leaveRequests.filter((r) => r.status === "rejected");
  const totalDays = approved.reduce((s, r) => s + Number(r.totalDays), 0);
  const approvedRatio = leaveRequests.length > 0 ? Math.round((approved.length / leaveRequests.length) * 100) : 0;

  const byDept = departments.map((d) => {
    const days = approved
      .filter((r) => r.donViId === d.donViId)
      .reduce((s, r) => s + Number(r.totalDays), 0);
    const label = d.tenDonVi.length > 15 ? d.tenDonVi.substring(0, 15) + "..." : d.tenDonVi;
    return { name: label, days };
  });

  const byType = leaveTypes
    .map((lt) => ({
      name: lt.name,
      value: approved.filter((r) => r.leaveTypeId === lt.id).reduce((s, r) => s + Number(r.totalDays), 0),
    }))
    .filter((d) => d.value > 0);

  const handleExport = () => {
    const rows = [["Họ tên", "Phòng ban", "Loại phép", "Từ ngày", "Đến ngày", "Số ngày", "Trạng thái"]];
    leaveRequests.forEach((r) => {
      const dept = departments.find((d) => d.donViId === r.donViId);
      const lt = leaveTypes.find((t) => t.id === r.leaveTypeId);
      rows.push([
        r.userName || "",
        dept?.tenDonVi || "",
        lt?.name || "",
        formatDate(r.startDate),
        formatDate(r.endDate),
        String(r.totalDays),
        r.status,
      ]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bao-cao-nghi-phep.csv";
    a.click();
    toast.success("Đã xuất file báo cáo");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Thống kê báo cáo</h2>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Xuất Excel
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalDays}</p><p className="text-xs text-muted-foreground">Tổng ngày nghỉ đã duyệt</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{approvedRatio}%</p><p className="text-xs text-muted-foreground">Tỷ lệ duyệt</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{rejected.length}</p><p className="text-xs text-muted-foreground">Đơn bị từ chối</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ngày nghỉ theo phòng ban</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byDept}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="days" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Phân bổ theo loại phép</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
