import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { reportsApi } from "@/api/reports.api";

const COLORS = ["#2563EB", "#16A34A", "#D97706", "#DC2626", "#8B5CF6"];

const statusOptions = [
  { value: "", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved_leader", label: "Đã duyệt LĐ" },
  { value: "approved_director", label: "Đã duyệt GĐ" },
  { value: "rejected", label: "Từ chối" },
  { value: "cancelled", label: "Đã hủy" },
];

const periodOptions = [
  { value: "none", label: "Chi tiết" },
  { value: "month", label: "Theo tháng" },
  { value: "quarter", label: "Theo quý" },
  { value: "year", label: "Theo năm" },
];

const ReportsPage = () => {
  const leaveRequests = useStore((s) => s.leaveRequests);
  const departments = useStore((s) => s.departments);
  const leaveTypes = useStore((s) => s.leaveTypes);
  const loadData = useStore((s) => s.loadData);

  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [period, setPeriod] = useState("none");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const approved = leaveRequests.filter(
    (r) => r.status === "approved_leader" || r.status === "approved_director",
  );
  const rejected = leaveRequests.filter((r) => r.status === "rejected");
  const totalDays = approved.reduce((s, r) => s + Number(r.totalDays), 0);
  const approvedRatio =
    leaveRequests.length > 0
      ? Math.round((approved.length / leaveRequests.length) * 100)
      : 0;

  const byDept = departments.map((d) => {
    const days = approved
      .filter((r) => r.donViId === d.donViId)
      .reduce((s, r) => s + Number(r.totalDays), 0);
    const label =
      d.tenDonVi.length > 15
        ? d.tenDonVi.substring(0, 15) + "..."
        : d.tenDonVi;
    return { name: label, days };
  });

  const byType = leaveTypes
    .map((lt) => ({
      name: lt.name,
      value: approved
        .filter((r) => r.leaveTypeId === lt.id)
        .reduce((s, r) => s + Number(r.totalDays), 0),
    }))
    .filter((d) => d.value > 0);

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportsApi.downloadExport({
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
        period,
      });
      toast.success("Đã tải file báo cáo");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Xuất báo cáo thất bại";
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Thống kê báo cáo</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Trạng thái</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Từ ngày</label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Đến ngày</label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Gộp theo</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Chi tiết" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExport} disabled={exporting} className="h-9">
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1" />
          )}
          Xuất Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalDays}</p>
            <p className="text-xs text-muted-foreground">
              Tổng ngày nghỉ đã duyệt
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{approvedRatio}%</p>
            <p className="text-xs text-muted-foreground">Tỷ lệ duyệt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {rejected.length}
            </p>
            <p className="text-xs text-muted-foreground">Đơn bị từ chối</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ngày nghỉ theo phòng ban</CardTitle>
          </CardHeader>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Phân bổ theo loại phép</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={byType}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  {byType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
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
