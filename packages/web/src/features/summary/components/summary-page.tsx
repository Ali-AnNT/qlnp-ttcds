import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { formatDate } from "@/shared/lib/date-utils";
import { Eye } from "lucide-react";
import { useDeptSummary } from "../hooks/use-dept-summary";
import { DeptSummaryTable, type DeptSummaryRow } from "./dept-summary-table";
import { TypePieChart } from "./type-pie-chart";

const SummaryPage = () => {
  const { leaveRequests, departments, leaveTypes } = useDeptSummary();

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

  const deptSummary = useMemo((): DeptSummaryRow[] => {
    return departments
      .map((dept) => {
        const deptRequests = approvedRequests.filter((r) => r.donViId === dept.donViId);
        const uniqueUsers = new Set(deptRequests.map((r) => r.userId));
        return {
          ...dept,
          totalEmp: uniqueUsers.size,
          totalLeave: deptRequests.reduce((s, r) => s + Number(r.totalDays), 0),
        };
      })
      .sort((a, b) => b.totalEmp - a.totalEmp || b.totalLeave - a.totalLeave);
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
        <DeptSummaryTable
          deptSummary={deptSummary}
          onEmpClick={(donViId) => { setEmpDialogDeptId(donViId); setEmpDialogOpen(true); }}
          onDetailClick={(donViId) => { setDetailDialogDeptId(donViId); setDetailDialogOpen(true); }}
        />
        <TypePieChart data={byType} />
      </div>

      {/* Employee list dialog */}
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

      {/* User detail dialog */}
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

      {/* Department detail dialog */}
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
