import { useAuth } from "@/features/auth";
import { useDashboardStats } from "../hooks/use-dashboard-stats";
import { useRecentRequests } from "../hooks/use-recent-requests";
import { useMyStats } from "../hooks/use-my-stats";
import { formatDate } from "@/shared/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { CalendarDays, Clock, CheckCircle, FileText } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Link } from "react-router";
import { ROUTES } from "@/app/routes";
import { Button } from "@/shared/ui/button";
import {
  getApprovalStatusLabel,
  getApprovalStatusColor,
  AppRoles,
} from "@/features/shared-reference-data";

const DashboardPage = () => {
  const { user } = useAuth();
  const {
    leaveTypes,
    maxLevelByType,
    loading: statsLoading,
  } = useDashboardStats();

  const {
    pendingApproval,
    recentRequests,
    loading: requestsLoading,
  } = useRecentRequests();

  const {
    remainingDays,
    pendingCount,
    approvedCount,
    usedDays,
    loading: myStatsLoading,
  } = useMyStats();

  const loading = statsLoading || requestsLoading || myStatsLoading;

  const metrics = [
    {
      label: "Ngày phép còn lại",
      value: remainingDays,
      icon: CalendarDays,
      color: "text-accent",
    },
    {
      label: "Đơn đang chờ duyệt",
      value: pendingCount,
      icon: Clock,
      color: "text-warning",
    },
    {
      label: "Đơn đã duyệt",
      value: approvedCount,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      label: "Tổng ngày đã nghỉ",
      value: usedDays,
      icon: FileText,
      color: "text-info",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border p-5">
        <h1 className="text-xl font-bold">Xin chào, {user?.fullName}!</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {user?.userName} • {user?.role}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("p-2.5 rounded-lg bg-muted", m.color)}>
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "—" : m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(user?.role === AppRoles.Staff || user?.role === AppRoles.Leader) && (
          <Link to={ROUTES.leaveNew}>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Tạo đơn nghỉ phép
            </Button>
          </Link>
        )}
        {(user?.role === AppRoles.Leader ||
          user?.role === AppRoles.Director ||
          user?.role === AppRoles.Admin) && (
          <Link to={ROUTES.approval}>
            <Button variant="outline">
              Phê duyệt đơn ({pendingApproval.length})
            </Button>
          </Link>
        )}
        <Link to={ROUTES.calendar}>
          <Button variant="outline">Xem lịch nghỉ phép</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentRequests.map((r) => {
              const lt = leaveTypes.find((t) => t.id === r.leaveTypeId);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{r.userName}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      — {lt?.name}: {formatDate(r.startDate)} →{" "}
                      {formatDate(r.endDate)} ({r.totalDays} ngày)
                    </span>
                  </div>
                  <Badge
                    className={cn(
                      "text-[11px] ml-2 shrink-0",
                      getApprovalStatusColor(
                        r.status,
                        r.approvedLevel,
                        maxLevelByType.get(r.leaveTypeId) ?? 1,
                      ),
                    )}
                    variant="outline"
                  >
                    {getApprovalStatusLabel(
                      r.status,
                      r.approvedLevel,
                      maxLevelByType.get(r.leaveTypeId) ?? 1,
                    )}
                  </Badge>
                </div>
              );
            })}
            {recentRequests.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Chưa có hoạt động
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;