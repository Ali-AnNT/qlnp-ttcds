import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, type DefaultLegendContentProps } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { formatDate } from "@/shared/lib/date-utils";
import { Eye } from "lucide-react";
import { Button } from "@/shared/ui/button";

const COLORS = ["#2563EB", "#16A34A", "#D97706", "#DC2626", "#8B5CF6", "#EC4899", "#14B8A6"];

const SummaryPage = () => {
  const leaveRequests = useStore((s) => s.leaveRequests);
  const departments = useStore((s) => s.departments);
  const leaveTypes = useStore((s) => s.leaveTypes);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("all");

  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [empDialogDeptId, setEmpDialogDeptId] = useState<number | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailDialogDeptId, setDetailDialogDeptId] = useState<number | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [userDetailUserId, setUserDetailUserId] = useState<number | null>(null);

  const years = useMemo(() => {
    const ySet = new Set<number>();
    leaveRequests.forEach((r) => {
      const y = new Date(r.startDate).getFullYear();
      ySet.add(y);
    });
    ySet.add(currentYear);
    return Array.from(ySet).sort((a, b) => b - a);
  }, [leaveRequests, currentYear]);

  const approvedRequests = useMemo(() => {
    return leaveRequests.filter((r) => {
      const isApproved = r.status === "approved";
      if (!isApproved) return false;
      const y = new Date(r.startDate).getFullYear();
      if (String(y) !== selectedYear) return false;
      if (selectedLeaveType !== "all" && String(r.leaveTypeId) !== selectedLeaveType) return false;
      return true;
    });
  }, [leaveRequests, selectedYear, selectedLeaveType]);

  const byType = useMemo(() => {
    return leaveTypes
      .map((lt) => ({
        name: lt.name,
        value: approvedRequests
          .filter((r) => r.leaveTypeId === lt.id)
          .reduce((s, r) => s + Number(r.totalDays), 0),
      }))
      .filter((d) => d.value > 0);
  }, [leaveTypes, approvedRequests]);

  const deptSummary = useMemo(() => {
    return departments.map((dept) => {
      const deptRequests = approvedRequests.filter((r) => r.donViId === dept.donViId);
      const uniqueUsers = new Set(deptRequests.map((r) => r.userId));
      return {
        ...dept,
        totalEmp: uniqueUsers.size,
        totalLeave: deptRequests.reduce((s, r) => s + Number(r.totalDays), 0),
      };
    });
  }, [departments, approvedRequests]);

  const empListForDept = useMemo(() => {
    if (!empDialogDeptId) return [];
    const deptReqs = approvedRequests.filter((r) => r.donViId === empDialogDeptId);
    const userMap = new Map<number, { userId: number; userName: string; totalApprovedDays: number }>();
    deptReqs.forEach((r) => {
      const existing = userMap.get(r.userId);
      if (existing) {
        existing.totalApprovedDays += Number(r.totalDays);
      } else {
        userMap.set(r.userId, { userId: r.userId, userName: r.userName || "", totalApprovedDays: Number(r.totalDays) });
      }
    });
    return Array.from(userMap.values());
  }, [empDialogDeptId, approvedRequests]);

  const detailListForDept = useMemo(() => {
    if (!detailDialogDeptId) return [];
    const deptName = departments.find((d) => d.donViId === detailDialogDeptId)?.tenDonVi || "";
    return approvedRequests
      .filter((r) => r.donViId === detailDialogDeptId)
      .map((r) => ({
        deptName,
        empName: r.userName || "",
        leaveType: leaveTypes.find((t) => t.id === r.leaveTypeId)?.name || "",
        startDate: r.startDate,
        endDate: r.endDate,
        totalDays: r.totalDays,
      }));
  }, [detailDialogDeptId, departments, approvedRequests, leaveTypes]);

  const userDetailList = useMemo(() => {
    if (!userDetailUserId) return [];
    return approvedRequests
      .filter((r) => r.userId === userDetailUserId)
      .map((r) => ({
        leaveType: leaveTypes.find((t) => t.id === r.leaveTypeId)?.name || "",
        startDate: r.startDate,
        endDate: r.endDate,
        totalDays: r.totalDays,
        reason: r.reason || "",
      }));
  }, [userDetailUserId, approvedRequests, leaveTypes]);

  const renderLegend = (props: DefaultLegendContentProps) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {payload?.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Tổng hợp lịch nghỉ toàn trung tâm</h2>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Năm:</span>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Loại phép:</span>
          <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {leaveTypes.map((lt) => <SelectItem key={lt.id} value={String(lt.id)}>{lt.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tổng hợp theo phòng ban</CardTitle>
          </CardHeader>
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
                  <TableRow key={d.donViId} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                    <TableCell className="font-medium">{d.tenDonVi}</TableCell>
                    <TableCell className="text-center">
                      <button
                        className="text-primary underline hover:text-primary/80 font-semibold"
                        onClick={() => { setEmpDialogDeptId(d.donViId); setEmpDialogOpen(true); }}
                      >
                        {d.totalEmp}
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        className="text-primary underline hover:text-primary/80 font-semibold"
                        onClick={() => { setDetailDialogDeptId(d.donViId); setDetailDialogOpen(true); }}
                      >
                        {d.totalLeave}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Phân bổ theo loại phép</CardTitle>
          </CardHeader>
          <CardContent>
            {byType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={byType} cx="50%" cy="45%" outerRadius={80} dataKey="value" label={({ value }) => value} labelLine={false}>
                    {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} ngày`, name]} />
                  <Legend content={renderLegend} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Danh sách cán bộ - {departments.find((d) => d.donViId === empDialogDeptId)?.tenDonVi}
            </DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead className="text-center">Tổng ngày phép đã duyệt</TableHead>
                <TableHead className="text-center w-[60px]">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empListForDept.map((emp) => (
                <TableRow key={emp.userId}>
                  <TableCell>{emp.userName}</TableCell>
                  <TableCell className="text-center font-semibold">{emp.totalApprovedDays}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => { setUserDetailUserId(emp.userId); setUserDetailOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {empListForDept.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chi tiết nghỉ phép - {userDetailList.length > 0 ? approvedRequests.find((r) => r.userId === userDetailUserId)?.userName : ""}
            </DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại phép</TableHead>
                <TableHead>Từ ngày</TableHead>
                <TableHead>Đến ngày</TableHead>
                <TableHead className="text-center">Số ngày</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userDetailList.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.leaveType}</TableCell>
                  <TableCell>{formatDate(r.startDate)}</TableCell>
                  <TableCell>{formatDate(r.endDate)}</TableCell>
                  <TableCell className="text-center font-semibold">{r.totalDays}</TableCell>
                </TableRow>
              ))}
              {userDetailList.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Chưa có lịch nghỉ phép</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chi tiết ngày phép đã duyệt - {departments.find((d) => d.donViId === detailDialogDeptId)?.tenDonVi}
            </DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phòng ban</TableHead>
                <TableHead>Cán bộ</TableHead>
                <TableHead>Loại phép</TableHead>
                <TableHead>Từ ngày</TableHead>
                <TableHead>Đến ngày</TableHead>
                <TableHead className="text-center">Số ngày</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailListForDept.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.deptName}</TableCell>
                  <TableCell>{r.empName}</TableCell>
                  <TableCell>{r.leaveType}</TableCell>
                  <TableCell>{formatDate(r.startDate)}</TableCell>
                  <TableCell>{formatDate(r.endDate)}</TableCell>
                  <TableCell className="text-center font-semibold">{r.totalDays}</TableCell>
                </TableRow>
              ))}
              {detailListForDept.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SummaryPage;
