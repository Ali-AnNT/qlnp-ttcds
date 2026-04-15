import { useStore } from "@/store/useStore";
import { employees, departments, leaveTypeLabels, leaveStatusLabels, LeaveStatus } from "@/lib/leave-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, CheckCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const statusColor: Record<LeaveStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning border-warning/30",
  approved: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
};

const DashboardPage = () => {
  const currentUser = useStore(s => s.currentUser);
  const leaveRequests = useStore(s => s.leaveRequests);
  const emp = employees.find(e => e.id === currentUser?.employeeId);
  const dept = departments.find(d => d.id === emp?.departmentId);
  const role = currentUser?.role;

  const myRequests = leaveRequests.filter(r => r.employeeId === currentUser?.employeeId);
  const pendingApproval = leaveRequests.filter(r => r.status === "pending");
  const approvedCount = myRequests.filter(r => r.status === "approved").length;
  const totalDaysUsed = myRequests.filter(r => r.status === "approved").reduce((s, r) => s + r.days, 0);
  const remaining = (emp?.annualLeaveTotal || 12) - (emp?.annualLeaveUsed || 0);

  const recentRequests = [...leaveRequests]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  const metrics = [
    { label: "Ngày phép còn lại", value: remaining, icon: CalendarDays, color: "text-accent" },
    { label: "Đơn đang chờ duyệt", value: role === "CB.PCM" ? myRequests.filter(r => r.status === "pending").length : pendingApproval.length, icon: Clock, color: "text-warning" },
    { label: "Đơn đã duyệt", value: approvedCount, icon: CheckCircle, color: "text-success" },
    { label: "Tổng ngày đã nghỉ", value: totalDaysUsed, icon: FileText, color: "text-info" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-card rounded-lg border p-5">
        <h1 className="text-xl font-bold">Xin chào, {emp?.name}!</h1>
        <p className="text-sm text-muted-foreground mt-1">{dept?.name} • {role}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
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

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {(role === "CB.PCM" || role === "LD.PCM") && (
          <Link to="/leave/new"><Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Tạo đơn nghỉ phép</Button></Link>
        )}
        {(role === "LD.PCM" || role === "GD.PGD") && (
          <Link to="/approval"><Button variant="outline">Phê duyệt đơn ({pendingApproval.length})</Button></Link>
        )}
        <Link to="/calendar"><Button variant="outline">Xem lịch nghỉ phép</Button></Link>
      </div>

      {/* Recent */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentRequests.map(r => {
              const reqEmp = employees.find(e => e.id === r.employeeId);
              return (
                <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{reqEmp?.name}</span>
                    <span className="text-muted-foreground"> — {leaveTypeLabels[r.type]}: {r.startDate} → {r.endDate} ({r.days} ngày)</span>
                  </div>
                  <Badge className={cn("text-[11px] ml-2 shrink-0", statusColor[r.status])} variant="outline">
                    {leaveStatusLabels[r.status]}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
