import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { leaveStatusLabels, LeaveStatus } from "@/lib/leave-data";
import { formatDate } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, CheckCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const statusColor: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  approved_leader: "bg-blue-100 text-blue-700 border-blue-300",
  approved_director: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
};

const DashboardPage = () => {
  const currentUser = useStore((s) => s.currentUser);
  const leaveRequests = useStore((s) => s.leaveRequests);
  const leaveTypes = useStore((s) => s.leaveTypes);
  const loadData = useStore((s) => s.loadData);
  const getEmployee = useStore((s) => s.getEmployee);
  const getLeaveType = useStore((s) => s.getLeaveType);
  const role = currentUser?.role;

  useEffect(() => { loadData(); }, []);

  const myRequests = leaveRequests.filter((r) => r.employee_id === currentUser?.employeeId);
  const pendingApproval = leaveRequests.filter((r) => r.status === "pending");
  const approvedCount = myRequests.filter((r) => r.status === "approved_leader" || r.status === "approved_director").length;
  const totalDaysUsed = myRequests
    .filter((r) => r.status === "approved_leader" || r.status === "approved_director")
    .reduce((s, r) => s + Number(r.total_days), 0);

  const metrics = [
    { label: "Ngày phép còn lại", value: 12 - totalDaysUsed, icon: CalendarDays, color: "text-accent" },
    { label: "Đơn đang chờ duyệt", value: role === "CB.PCM" ? myRequests.filter((r) => r.status === "pending").length : pendingApproval.length, icon: Clock, color: "text-warning" },
    { label: "Đơn đã duyệt", value: approvedCount, icon: CheckCircle, color: "text-success" },
    { label: "Tổng ngày đã nghỉ", value: totalDaysUsed, icon: FileText, color: "text-info" },
  ];

  const recentRequests = [...leaveRequests].slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border p-5">
        <h1 className="text-xl font-bold">Xin chào, {currentUser?.fullName}!</h1>
        <p className="text-sm text-muted-foreground mt-1">{currentUser?.departmentName} • {currentUser?.position} • {role}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("p-2.5 rounded-lg bg-muted", m.color)}>
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(role === "CB.PCM" || role === "LD.PCM") && (
          <Link to="/leave/new"><Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Tạo đơn nghỉ phép</Button></Link>
        )}
        {(role === "LD.PCM" || role === "GD.PGD") && (
          <Link to="/approval"><Button variant="outline">Phê duyệt đơn ({pendingApproval.length})</Button></Link>
        )}
        <Link to="/calendar"><Button variant="outline">Xem lịch nghỉ phép</Button></Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentRequests.map((r) => {
              const emp = getEmployee(r.employee_id);
              const lt = getLeaveType(r.leave_type_id);
              return (
                <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{emp?.full_name}</span>
                    <span className="text-muted-foreground"> — {lt?.name}: {formatDate(r.start_date)} → {formatDate(r.end_date)} ({r.total_days} ngày)</span>
                  </div>
                  <Badge className={cn("text-[11px] ml-2 shrink-0", statusColor[r.status])} variant="outline">
                    {leaveStatusLabels[r.status as LeaveStatus]}
                  </Badge>
                </div>
              );
            })}
            {recentRequests.length === 0 && <p className="text-center text-muted-foreground py-4">Chưa có hoạt động</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
