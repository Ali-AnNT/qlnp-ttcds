import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/date-utils";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ["#2563EB", "#16A34A", "#D97706", "#DC2626", "#8B5CF6", "#EC4899", "#14B8A6"];

const SummaryPage = () => {
  const leaveRequests = useStore((s) => s.leaveRequests);
  const departments = useStore((s) => s.departments);
  const employees = useStore((s) => s.employees);
  const leaveTypes = useStore((s) => s.leaveTypes);
  const getEmployee = useStore((s) => s.getEmployee);
  const getLeaveType = useStore((s) => s.getLeaveType);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("all");

  // Dialog state
  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [empDialogDeptId, setEmpDialogDeptId] = useState<string>("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailDialogDeptId, setDetailDialogDeptId] = useState<string>("");
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [userDetailEmpId, setUserDetailEmpId] = useState<string>("");

  // Available years from data
  const years = useMemo(() => {
    const ySet = new Set<number>();
    leaveRequests.forEach((r) => {
      const y = new Date(r.start_date).getFullYear();
      ySet.add(y);
    });
    ySet.add(currentYear);
    return Array.from(ySet).sort((a, b) => b - a);
  }, [leaveRequests, currentYear]);

  // Filtered approved requests
  const approvedRequests = useMemo(() => {
    return leaveRequests.filter((r) => {
      const isApproved = r.status === "approved_leader" || r.status === "approved_director";
      if (!isApproved) return false;
      const y = new Date(r.start_date).getFullYear();
      if (String(y) !== selectedYear) return false;
      if (selectedLeaveType !== "all" && r.leave_type_id !== selectedLeaveType) return false;
      return true;
    });
  }, [leaveRequests, selectedYear, selectedLeaveType]);

  // Chart data by type
  const byType = useMemo(() => {
    return leaveTypes
      .map((lt) => ({
        name: lt.name,
        value: approvedRequests
          .filter((r) => r.leave_type_id === lt.id)
          .reduce((s, r) => s + Number(r.total_days), 0),
      }))
      .filter((d) => d.value > 0);
  }, [leaveTypes, approvedRequests]);

  // Dept summary
  const deptSummary = useMemo(() => {
    return departments.map((dept) => {
      const deptEmployees = employees.filter((e) => e.department_id === dept.id);
      const deptRequests = approvedRequests.filter((r) =>
        deptEmployees.some((e) => e.id === r.employee_id)
      );
      return {
        ...dept,
        totalEmp: deptEmployees.length,
        totalLeave: deptRequests.reduce((s, r) => s + Number(r.total_days), 0),
      };
    });
  }, [departments, employees, approvedRequests]);

  // Popup: employees in dept with their approved days
  const empListForDept = useMemo(() => {
    if (!empDialogDeptId) return [];
    const deptEmps = employees.filter((e) => e.department_id === empDialogDeptId);
    return deptEmps.map((emp) => {
      const empReqs = approvedRequests.filter((r) => r.employee_id === emp.id);
      const totalDays = empReqs.reduce((s, r) => s + Number(r.total_days), 0);
      return { ...emp, totalApprovedDays: totalDays };
    });
  }, [empDialogDeptId, employees, approvedRequests]);

  // Popup: detail list for dept (all approved requests)
  const detailListForDept = useMemo(() => {
    if (!detailDialogDeptId) return [];
    const deptEmps = employees.filter((e) => e.department_id === detailDialogDeptId);
    const deptName = departments.find((d) => d.id === detailDialogDeptId)?.name || "";
    return approvedRequests
      .filter((r) => deptEmps.some((e) => e.id === r.employee_id))
      .map((r) => ({
        deptName,
        empName: getEmployee(r.employee_id)?.full_name || "",
        leaveType: getLeaveType(r.leave_type_id)?.name || "",
        startDate: r.start_date,
        endDate: r.end_date,
        totalDays: r.total_days,
      }));
  }, [detailDialogDeptId, employees, departments, approvedRequests, getEmployee, getLeaveType]);

  // Popup: user detail leave requests
  const userDetailList = useMemo(() => {
    if (!userDetailEmpId) return [];
    return approvedRequests
      .filter((r) => r.employee_id === userDetailEmpId)
      .map((r) => ({
        leaveType: getLeaveType(r.leave_type_id)?.name || "",
        startDate: r.start_date,
        endDate: r.end_date,
        totalDays: r.total_days,
        reason: r.reason || "",
      }));
  }, [userDetailEmpId, approvedRequests, getLeaveType]);

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Tổng hợp lịch nghỉ toàn trung tâm</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Năm:</span>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Loại phép:</span>
          <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {leaveTypes.map((lt) => (
                <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
              ))}
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
                  <TableRow key={d.id} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-center">
                      <button
                        className="text-primary underline hover:text-primary/80 font-semibold"
                        onClick={() => {
                          setEmpDialogDeptId(d.id);
                          setEmpDialogOpen(true);
                        }}
                      >
                        {d.totalEmp}
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        className="text-primary underline hover:text-primary/80 font-semibold"
                        onClick={() => {
                          setDetailDialogDeptId(d.id);
                          setDetailDialogOpen(true);
                        }}
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
                  <Pie
                    data={byType}
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ value }) => value}
                    labelLine={false}
                  >
                    {byType.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
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

      {/* Dialog: Employee list of department */}
      <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Danh sách cán bộ - {departments.find((d) => d.id === empDialogDeptId)?.name}
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
                <TableRow key={emp.id}>
                  <TableCell>{emp.full_name}</TableCell>
                  <TableCell className="text-center font-semibold">{emp.totalApprovedDays}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setUserDetailEmpId(emp.id);
                        setUserDetailOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {empListForDept.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Dialog: User detail leave list */}
      <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chi tiết nghỉ phép - {getEmployee(userDetailEmpId)?.full_name}
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
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Chưa có lịch nghỉ phép
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detail list for dept total days */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chi tiết ngày phép đã duyệt - {departments.find((d) => d.id === detailDialogDeptId)?.name}
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
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SummaryPage;
