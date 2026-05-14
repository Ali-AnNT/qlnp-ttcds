import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, Eye, Building2, Users, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

const LIMIT = 12;
const COLORS = ["hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "#8b5cf6", "#06b6d4", "#f59e0b"];
type Period = "year" | "quarter" | "month";

const ViolationsPage = () => {
  const leaveRequests = useStore((s) => s.leaveRequests);
  const departments = useStore((s) => s.departments);
  const leaveTypes = useStore((s) => s.leaveTypes);

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("year");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [quarter, setQuarter] = useState(`${Math.floor(new Date().getMonth() / 3) + 1}`);
  const [month, setMonth] = useState(`${new Date().getMonth() + 1}`);
  const [empDetail, setEmpDetail] = useState<number | null>(null);
  const [deptDetail, setDeptDetail] = useState<number | null>(null);

  const years = useMemo(() => {
    const set = new Set<number>([new Date().getFullYear()]);
    leaveRequests.forEach((r) => set.add(new Date(r.startDate).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [leaveRequests]);

  const filteredApproved = useMemo(() => {
    return leaveRequests.filter((r) => {
      if (r.status !== "approved_leader" && r.status !== "approved_director") return false;
      const d = new Date(r.startDate);
      if (d.getFullYear() !== Number(year)) return false;
      if (period === "month" && d.getMonth() + 1 !== Number(month)) return false;
      if (period === "quarter") {
        const q = Math.floor(d.getMonth() / 3) + 1;
        if (q !== Number(quarter)) return false;
      }
      return true;
    });
  }, [leaveRequests, year, period, month, quarter]);

  // Group by userId to get per-user violations
  const userAggregates = useMemo(() => {
    const map = new Map<number, { userId: number; userName: string; donViId: number; totalUsed: number; requests: typeof filteredApproved; byType: Record<string, number> }>();
    filteredApproved.forEach((r) => {
      const existing = map.get(r.userId);
      if (existing) {
        existing.totalUsed += Number(r.totalDays);
        existing.requests.push(r);
        const ltName = leaveTypes.find((t) => t.id === r.leaveTypeId)?.name || "Khác";
        existing.byType[ltName] = (existing.byType[ltName] || 0) + Number(r.totalDays);
      } else {
        const ltName = leaveTypes.find((t) => t.id === r.leaveTypeId)?.name || "Khác";
        map.set(r.userId, {
          userId: r.userId,
          userName: r.userName || "",
          donViId: r.donViId,
          totalUsed: Number(r.totalDays),
          requests: [r],
          byType: { [ltName]: Number(r.totalDays) },
        });
      }
    });
    return Array.from(map.values());
  }, [filteredApproved, leaveTypes]);

  const employeeViolations = useMemo(() => {
    return userAggregates
      .map((u) => {
        const overage = u.totalUsed - LIMIT;
        const dept = departments.find((d) => d.donViId === u.donViId);
        return { ...u, dept, overage };
      })
      .filter((v) => v.overage > 0);
  }, [userAggregates, departments]);

  const searchedEmpViolations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employeeViolations;
    return employeeViolations.filter(
      (v) => v.userName.toLowerCase().includes(q) || (v.dept?.tenDonVi || "").toLowerCase().includes(q)
    );
  }, [employeeViolations, search]);

  const departmentViolations = useMemo(() => {
    return departments.map((d) => {
      const deptUsers = userAggregates.filter((u) => u.donViId === d.donViId);
      const totalUsed = deptUsers.reduce((s, u) => s + u.totalUsed, 0);
      const allowed = deptUsers.length * LIMIT;
      const overage = totalUsed - allowed;

      const violatingEmps = employeeViolations.filter((v) => v.dept?.donViId === d.donViId);
      const totalEmpOverage = violatingEmps.reduce((s, v) => s + v.overage, 0);

      const byType: Record<string, number> = {};
      deptUsers.forEach((u) => {
        Object.entries(u.byType).forEach(([k, val]) => {
          byType[k] = (byType[k] || 0) + val;
        });
      });

      return {
        dept: d,
        totalUsed,
        allowed,
        overage,
        empCount: deptUsers.length,
        violatingCount: violatingEmps.length,
        totalEmpOverage,
        byType,
      };
    }).filter((d) => d.violatingCount > 0 || d.overage > 0);
  }, [departments, userAggregates, employeeViolations]);

  const searchedDeptViolations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departmentViolations;
    return departmentViolations.filter((d) => d.dept.tenDonVi.toLowerCase().includes(q));
  }, [departmentViolations, search]);

  const violationByType = useMemo(() => {
    const map: Record<string, number> = {};
    employeeViolations.forEach((v) => {
      Object.entries(v.byType).forEach(([k, val]) => {
        map[k] = (map[k] || 0) + val;
      });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [employeeViolations]);

  const totalSystemOverage = employeeViolations.reduce((s, v) => s + v.overage, 0);

  const empDetailData = empDetail ? employeeViolations.find((v) => v.userId === empDetail) : null;
  const deptDetailData = deptDetail ? departmentViolations.find((d) => d.dept.donViId === deptDetail) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Theo dõi vượt mức quy định</h2>
        <Badge variant="outline" className="text-xs">Định mức: {LIMIT} ngày/cán bộ/năm</Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm cán bộ hoặc phòng ban..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="year">Theo năm</SelectItem>
                <SelectItem value="quarter">Theo quý</SelectItem>
                <SelectItem value="month">Theo tháng</SelectItem>
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => <SelectItem key={y} value={y.toString()}>Năm {y}</SelectItem>)}
              </SelectContent>
            </Select>
            {period === "quarter" && (
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((q) => <SelectItem key={q} value={q.toString()}>Quý {q}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {period === "month" && (
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <SelectItem key={m} value={m.toString()}>Tháng {m}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-warning/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-warning" />
            <div><p className="text-2xl font-bold">{employeeViolations.length}</p><p className="text-xs text-muted-foreground">Cán bộ vượt mức</p></div>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-destructive" />
            <div><p className="text-2xl font-bold">{departmentViolations.length}</p><p className="text-xs text-muted-foreground">Phòng ban có vi phạm</p></div>
          </CardContent>
        </Card>
        <Card className="border-warning/30">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-warning" />
            <div><p className="text-2xl font-bold">+{totalSystemOverage}</p><p className="text-xs text-muted-foreground">Tổng ngày vượt (toàn cơ quan)</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-bold">
                {period === "year" && `Năm ${year}`}
                {period === "quarter" && `Quý ${quarter}/${year}`}
                {period === "month" && `Tháng ${month}/${year}`}
              </p>
              <p className="text-xs text-muted-foreground">Kỳ thống kê</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Phân loại vượt mức theo lý do nghỉ</CardTitle></CardHeader>
          <CardContent>
            {violationByType.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Không có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={violationByType} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} label={(e) => `${e.value}`}>
                    {violationByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Số ngày vượt mức theo phòng ban</CardTitle></CardHeader>
          <CardContent>
            {departmentViolations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Không có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={departmentViolations.map((d) => ({ name: d.dept.tenDonVi, value: d.totalEmpOverage }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--destructive))" name="Ngày vượt" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Vượt mức theo phòng ban</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Phòng ban</TableHead>
                <TableHead className="text-center">Tổng CB</TableHead>
                <TableHead className="text-center">CB vượt mức</TableHead>
                <TableHead className="text-center">Tổng ngày đã duyệt</TableHead>
                <TableHead className="text-center">Định mức</TableHead>
                <TableHead className="text-center">Vượt (ngày)</TableHead>
                <TableHead className="text-center">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchedDeptViolations.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Không có vi phạm</TableCell></TableRow>
              ) : searchedDeptViolations.map((d, i) => (
                <TableRow key={d.dept.donViId} className={cn(i % 2 === 1 ? "bg-muted/20" : "")}>
                  <TableCell className="font-medium">{d.dept.tenDonVi}</TableCell>
                  <TableCell className="text-center">{d.empCount}</TableCell>
                  <TableCell className="text-center font-bold text-warning">{d.violatingCount}</TableCell>
                  <TableCell className="text-center">{d.totalUsed}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{d.allowed}</TableCell>
                  <TableCell className="text-center font-bold text-destructive">+{d.totalEmpOverage}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => setDeptDetail(d.dept.donViId)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Chi tiết vượt mức cá nhân</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Cán bộ</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead className="text-center">Định mức</TableHead>
                <TableHead className="text-center">Đã sử dụng</TableHead>
                <TableHead className="text-center">Vượt</TableHead>
                <TableHead>Phân loại theo lý do</TableHead>
                <TableHead className="text-center">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchedEmpViolations.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Không có vi phạm</TableCell></TableRow>
              ) : searchedEmpViolations.map((v, i) => (
                <TableRow key={v.userId} className={cn(i % 2 === 1 ? "bg-muted/20" : "", "bg-destructive/5")}>
                  <TableCell className="font-medium">{v.userName}</TableCell>
                  <TableCell>{v.dept?.tenDonVi}</TableCell>
                  <TableCell className="text-center">{LIMIT}</TableCell>
                  <TableCell className="text-center">{v.totalUsed}</TableCell>
                  <TableCell className="text-center font-bold text-destructive">+{v.overage}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(v.byType).map(([k, val]) => (
                        <Badge key={k} variant="outline" className="text-xs">{k}: {val}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => setEmpDetail(v.userId)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!empDetail} onOpenChange={(o) => !o && setEmpDetail(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Chi tiết vượt mức - {empDetailData?.userName}</DialogTitle></DialogHeader>
          {empDetailData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground">Phòng ban:</span> <span className="font-medium">{empDetailData.dept?.tenDonVi}</span></div>
                <div><span className="text-muted-foreground">Đã sử dụng:</span> <span className="font-medium">{empDetailData.totalUsed} ngày</span></div>
                <div><span className="text-muted-foreground">Vượt:</span> <span className="font-bold text-destructive">+{empDetailData.overage} ngày</span></div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại phép</TableHead>
                    <TableHead>Từ ngày</TableHead>
                    <TableHead>Đến ngày</TableHead>
                    <TableHead className="text-center">Số ngày</TableHead>
                    <TableHead>Lý do</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empDetailData.requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{leaveTypes.find((t) => t.id === r.leaveTypeId)?.name}</TableCell>
                      <TableCell>{formatDate(r.startDate)}</TableCell>
                      <TableCell>{formatDate(r.endDate)}</TableCell>
                      <TableCell className="text-center">{r.totalDays}</TableCell>
                      <TableCell className="max-w-xs truncate">{r.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deptDetail} onOpenChange={(o) => !o && setDeptDetail(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Chi tiết phòng ban - {deptDetailData?.dept.tenDonVi}</DialogTitle></DialogHeader>
          {deptDetailData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><span className="text-muted-foreground">Tổng CB:</span> <span className="font-medium">{deptDetailData.empCount}</span></div>
                <div><span className="text-muted-foreground">CB vượt:</span> <span className="font-bold text-warning">{deptDetailData.violatingCount}</span></div>
                <div><span className="text-muted-foreground">Đã duyệt:</span> <span className="font-medium">{deptDetailData.totalUsed}</span></div>
                <div><span className="text-muted-foreground">Tổng vượt:</span> <span className="font-bold text-destructive">+{deptDetailData.totalEmpOverage}</span></div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2 text-muted-foreground">PHÂN LOẠI THEO LÝ DO NGHỈ</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(deptDetailData.byType).map(([k, val]) => (
                    <Badge key={k} variant="outline">{k}: {val} ngày</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2 text-muted-foreground">CÁN BỘ VƯỢT MỨC</p>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Cán bộ</TableHead><TableHead className="text-center">Đã sử dụng</TableHead><TableHead className="text-center">Vượt</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeViolations.filter((v) => v.dept?.donViId === deptDetailData.dept.donViId).map((v) => (
                      <TableRow key={v.userId}>
                        <TableCell className="font-medium">{v.userName}</TableCell>
                        <TableCell className="text-center">{v.totalUsed}</TableCell>
                        <TableCell className="text-center font-bold text-destructive">+{v.overage}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViolationsPage;
