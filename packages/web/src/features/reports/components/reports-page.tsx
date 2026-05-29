import { useMemo } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { formatDate } from "@/shared/lib/date-utils";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useReportsData } from "../hooks/use-reports-data";
import { DeptBarChart } from "./dept-bar-chart";
import { TypePieChart } from "./type-pie-chart";

const ReportsPage = () => {
  const { leaveRequests, departments, leaveTypes } = useReportsData();

  const approved = useMemo(
    () => leaveRequests.filter((r) => r.status === "approved"),
    [leaveRequests],
  );
  const rejected = useMemo(
    () => leaveRequests.filter((r) => r.status === "rejected"),
    [leaveRequests],
  );
  const totalDays = useMemo(
    () => approved.reduce((s, r) => s + Number(r.totalDays), 0),
    [approved],
  );
  const approvedRatio = useMemo(
    () =>
      leaveRequests.length > 0
        ? Math.round((approved.length / leaveRequests.length) * 100)
        : 0,
    [approved, leaveRequests],
  );

  const byDept = useMemo(
    () =>
      departments.map((d) => {
        const days = approved
          .filter((r) => r.donViId === d.donViId)
          .reduce((s, r) => s + Number(r.totalDays), 0);
        const label =
          d.tenDonVi.length > 15
            ? d.tenDonVi.substring(0, 15) + "..."
            : d.tenDonVi;
        return { name: label, days };
      }),
    [departments, approved],
  );

  const byType = useMemo(
    () =>
      leaveTypes
        .map((lt) => ({
          name: lt.name,
          value: approved
            .filter((r) => r.leaveTypeId === lt.id)
            .reduce((s, r) => s + Number(r.totalDays), 0),
        }))
        .filter((d) => d.value > 0),
    [leaveTypes, approved],
  );

  const handleExport = () => {
    const rows = [
      ["Họ tên", "Phòng ban", "Loại phép", "Từ ngày", "Đến ngày", "Số ngày", "Trạng thái"],
    ];
    leaveRequests.forEach((r) => {
      const dept = departments.find((d) => d.donViId === r.donViId);
      const lt = leaveTypes.find((t) => t.id === r.leaveTypeId);
      rows.push([
        r.userName || "",
        dept?.tenDonVi || "",
        lt?.name || "",
        formatDate(r.startDate),
        formatDate(r.endDate),
        String(r.totalDays),
        r.status,
      ]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bao-cao-nghi-phep.csv";
    a.click();
    toast.success("Đã xuất file báo cáo");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Thống kê báo cáo</h2>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Xuất Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalDays}</p>
            <p className="text-xs text-muted-foreground">Tổng ngày nghỉ đã duyệt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{approvedRatio}%</p>
            <p className="text-xs text-muted-foreground">Tỷ lệ duyệt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{rejected.length}</p>
            <p className="text-xs text-muted-foreground">Đơn bị từ chối</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DeptBarChart data={byDept} />
        <TypePieChart data={byType} />
      </div>
    </div>
  );
};

export default ReportsPage;
