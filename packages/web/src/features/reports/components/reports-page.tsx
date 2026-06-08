import { useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { toast } from "sonner";
import { getAccessToken } from "@/shared/lib/token-store";
import { useReportsStatistics } from "../hooks/use-reports-statistics";
import { reportsApi } from "../api/reports.api";
import { DeptBarChart } from "./dept-bar-chart";
import { TypePieChart } from "./type-pie-chart";
import { ReportsFilterBar } from "./reports-filter-bar";
import type { FilterState } from "./reports-filter-bar";
import type { ReportsFilterParams } from "../api/reports.api";
import { lastDayOfMonth, format } from "date-fns";

const mapFiltersToParams = (filters: FilterState): ReportsFilterParams => {
  const year = parseInt(filters.year, 10);
  let from = "";
  let to = "";

  if (filters.type === "year") {
    from = `${year}-01-01`;
    to = `${year}-12-31`;
  } else if (filters.type === "quarter") {
    const quarter = parseInt(filters.quarter, 10);
    if (quarter === 1) {
      from = `${year}-01-01`;
      to = `${year}-03-31`;
    } else if (quarter === 2) {
      from = `${year}-04-01`;
      to = `${year}-06-30`;
    } else if (quarter === 3) {
      from = `${year}-07-01`;
      to = `${year}-09-30`;
    } else {
      from = `${year}-10-01`;
      to = `${year}-12-31`;
    }
  } else if (filters.type === "month") {
    const month = parseInt(filters.month, 10);
    const monthStr = String(month).padStart(2, "0");
    from = `${year}-${monthStr}-01`;
    const monthDate = new Date(year, month - 1, 1);
    to = format(lastDayOfMonth(monthDate), "yyyy-MM-dd");
  }

  return {
    from,
    to,
    status: filters.status,
    period: filters.type,
  };
};

const ReportsPage = () => {
  const [filters, setFilters] = useState<FilterState>(() => {
    const date = new Date();
    return {
      type: "year",
      year: String(date.getFullYear()),
      quarter: String(Math.floor(date.getMonth() / 3) + 1),
      month: String(date.getMonth() + 1),
      status: undefined,
    };
  });
  const [isExporting, setIsExporting] = useState(false);

  const apiParams = mapFiltersToParams(filters);
  const { data, isLoading, isError, error } = useReportsStatistics(apiParams);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const url = reportsApi.exportUrl(apiParams);
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `bao-cao-nghi-phep-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast.success("Đã xuất file báo cáo");
    } catch (err) {
      console.error(err);
      toast.error("Không thể xuất file báo cáo. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="lma-space-y-6">
        <h2 className="lma-text-lg lma-font-bold">Thống kê báo cáo</h2>
        <div className="lma-h-16 lma-bg-muted lma-animate-pulse lma-rounded-lg" />
        <div className="lma-grid lma-grid-cols-1 sm:lma-grid-cols-3 lma-gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="lma-p-6">
                <div className="lma-h-8 lma-w-24 lma-bg-muted lma-animate-pulse lma-mx-auto lma-mb-2" />
                <div className="lma-h-4 lma-w-32 lma-bg-muted lma-animate-pulse lma-mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="lma-grid lma-grid-cols-1 lg:lma-grid-cols-2 lma-gap-4">
          <div className="lma-h-[350px] lma-bg-muted lma-animate-pulse lma-rounded-lg" />
          <div className="lma-h-[350px] lma-bg-muted lma-animate-pulse lma-rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="lma-space-y-6">
        <h2 className="lma-text-lg lma-font-bold">Thống kê báo cáo</h2>
        <Card className="lma-border-destructive">
          <CardContent className="lma-p-6 lma-text-center">
            <p className="lma-text-destructive lma-font-semibold">
              Đã xảy ra lỗi khi tải dữ liệu thống kê
            </p>
            <p className="lma-text-sm lma-text-muted-foreground">
              {error instanceof Error ? error.message : "Lỗi không xác định"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = data ?? {
    totalDays: 0,
    approvedRatio: 0,
    rejectedCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    byDept: [],
    byType: [],
    byPeriod: null,
  };

  return (
    <div className="lma-space-y-6">
      <h2 className="lma-text-lg lma-font-bold">Thống kê báo cáo</h2>

      <ReportsFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onExport={handleExport}
        isExporting={isExporting}
      />

      <div className="lma-grid lma-grid-cols-1 sm:lma-grid-cols-3 lma-gap-4">
        <Card>
          <CardContent className="lma-p-4 lma-text-center">
            <p className="lma-text-2xl lma-font-bold">{stats.totalDays}</p>
            <p className="lma-text-xs lma-text-muted-foreground">
              Tổng ngày nghỉ đã duyệt
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="lma-p-4 lma-text-center">
            <p className="lma-text-2xl lma-font-bold lma-text-success">
              {stats.approvedRatio}%
            </p>
            <p className="lma-text-xs lma-text-muted-foreground">
              Tỷ lệ duyệt
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="lma-p-4 lma-text-center">
            <p className="lma-text-2xl lma-font-bold lma-text-destructive">
              {stats.rejectedCount}
            </p>
            <p className="lma-text-xs lma-text-muted-foreground">
              Đơn bị từ chối
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="lma-grid lma-grid-cols-1 lg:lma-grid-cols-2 lma-gap-4">
        <DeptBarChart data={stats.byDept} />
        <TypePieChart data={stats.byType} />
      </div>
    </div>
  );
};

export default ReportsPage;
