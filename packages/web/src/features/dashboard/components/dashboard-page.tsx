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
      color: "lma-text-accent",
    },
    {
      label: "Đơn đang chờ duyệt",
      value: pendingCount,
      icon: Clock,
      color: "lma-text-warning",
    },
    {
      label: "Đơn đã duyệt",
      value: approvedCount,
      icon: CheckCircle,
      color: "lma-text-success",
    },
    {
      label: "Tổng ngày đã nghỉ",
      value: usedDays,
      icon: FileText,
      color: "lma-text-info",
    },
  ];

  return (
    <div className="lma-space-y-6">
      <div className="lma-grid lma-grid-cols-1 sm:lma-grid-cols-2 lg:lma-grid-cols-4 lma-gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="lma-p-4 lma-flex lma-items-center lma-gap-4">
              <div
                className={cn("lma-p-2.5 lma-rounded-lg lma-bg-muted", m.color)}
              >
                <m.icon className="lma-h-5 lma-w-5" />
              </div>
              <div>
                <p className="lma-text-2xl lma-font-bold">
                  {loading ? "—" : m.value}
                </p>
                <p className="lma-text-xs lma-text-muted-foreground">
                  {m.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="lma-flex lma-flex-wrap lma-gap-2">
        {(user?.role === AppRoles.Staff || user?.role === AppRoles.Leader) && (
          <Link to={ROUTES.leaveNew}>
            <Button className="lma-bg-accent hover:lma-bg-accent/90 lma-text-accent-foreground">
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
        <CardHeader className="lma-pb-3">
          <CardTitle className="lma-text-base">Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="lma-space-y-2">
            {recentRequests.map((r) => {
              const lt = leaveTypes.find((t) => t.id === r.leaveTypeId);
              return (
                <div
                  key={r.id}
                  className="lma-flex lma-items-center lma-justify-between lma-py-2 lma-border-b last:lma-border-0 lma-text-sm"
                >
                  <div className="lma-flex-1 lma-min-w-0">
                    <span className="lma-font-medium">{r.userName}</span>
                    <span className="lma-text-muted-foreground">
                      {" "}
                      — {lt?.name}: {formatDate(r.startDate)} →{" "}
                      {formatDate(r.endDate)} ({r.totalDays} ngày)
                    </span>
                  </div>
                  <Badge
                    className={cn(
                      "lma-text-[11px] lma-ml-2 lma-shrink-0",
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
              <p className="lma-text-center lma-text-muted-foreground lma-py-4">
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
