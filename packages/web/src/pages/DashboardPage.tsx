import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store/useStore";
import { formatDate } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, CheckCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LeaveBalanceCard } from "@/components/LeaveBalanceCard";
import {
  getApprovalStatusLabel,
  getApprovalStatusColor,
  AppRoles,
} from "@/lib/leave-data";
import { configApi, type ConfigDto } from "@/api/config.api";

const statusLabels: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
};

const DashboardPage = () => {
  const { user } = useAuth();
  const leaveRequests = useStore((s) => s.leaveRequests);
  const leaveTypes = useStore((s) => s.leaveTypes);
  const leaveBalances = useStore((s) => s.leaveBalances);
  const loadData = useStore((s) => s.loadData);
  const [loading, setLoading] = useState(true);
  const [approvalConfigs, setApprovalConfigs] = useState<ConfigDto[]>([]);

  useEffect(() => {
    configApi.get().then(({ data }) => {
      if (data) setApprovalConfigs(data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, []);

  const currentYear = new Date().getFullYear();
  const myBalances = leaveBalances.filter(
    (b) => b.userId === user?.userId && b.year === currentYear,
  );

  const myRequests = leaveRequests.filter((r) => r.userId === user?.userId);
  const pendingApproval = leaveRequests.filter((r) => r.status === "pending");
  const approvedCount = myRequests.filter(
    (r) => r.status === "approved",
  ).length;
  const totalDaysUsed = myRequests
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + r.totalDays, 0);

  const maxLevelByType = useMemo(() => {
    const map = new Map<number, number>();
    for (const c of approvalConfigs) {
      const current = map.get(c.leaveTypeId) ?? 0;
      if (c.approvalLevel > current) map.set(c.leaveTypeId, c.approvalLevel);
    }
    return map;
  }, [approvalConfigs]);
  const remainingDays = myBalances[0]?.remainingDays ?? 0;
  const totalDaysAllowed = myBalances[0]?.totalDays ?? 0;

  const metrics = [
    {
      label: "Ngày phép còn lại",
      value: remainingDays,
      icon: CalendarDays,
      color: "text-accent",
    },
    {
      label: "Đơn đang chờ duyệt",
      value:
        user?.role === AppRoles.Staff
          ? myRequests.filter((r) => r.status === "pending").length
          : pendingApproval.length,
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
      value: totalDaysUsed,
      icon: FileText,
      color: "text-info",
    },
  ];

  const recentRequests = (
    user?.role === AppRoles.Staff ? myRequests : leaveRequests
  ).slice(0, 8);

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

      {!loading && myBalances.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Ngày phép năm {currentYear}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myBalances.map((b) => (
              <LeaveBalanceCard
                key={b.id}
                balance={{
                  label: "Nghỉ phép năm",
                  total: b.totalDays,
                  used: b.usedDays,
                  remaining: b.remainingDays,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(user?.role === AppRoles.Staff || user?.role === AppRoles.Leader) && (
          <Link to="/leave/new">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Tạo đơn nghỉ phép
            </Button>
          </Link>
        )}
        {(user?.role === AppRoles.Leader ||
          user?.role === AppRoles.Director ||
          user?.role === AppRoles.Admin) && (
          <Link to="/approval">
            <Button variant="outline">
              Phê duyệt đơn ({pendingApproval.length})
            </Button>
          </Link>
        )}
        <Link to="/calendar">
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
