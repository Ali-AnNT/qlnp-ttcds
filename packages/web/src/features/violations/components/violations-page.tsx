import { useState, useMemo } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Badge } from "@/shared/ui/badge";
import { Search } from "lucide-react";
import { Period } from "../api/types";
import { useViolations } from "../hooks/use-violations";
import { ViolationMetrics } from "./violation-metrics";
import { ViolationDeptTable } from "./violation-dept-table";
import { ViolationEmpTable } from "./violation-emp-table";
import { ViolationChart } from "./violation-chart";
import { EmpDetailDialog } from "./emp-detail-dialog";
import { DeptDetailDialog } from "./dept-detail-dialog";

const ViolationsPage = () => {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("year");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [quarter, setQuarter] = useState(`${Math.floor(new Date().getMonth() / 3) + 1}`);
  const [month, setMonth] = useState(`${new Date().getMonth() + 1}`);
  const [empDetail, setEmpDetail] = useState<number | null>(null);
  const [deptDetail, setDeptDetail] = useState<number | null>(null);

  const {
    years,
    employeeViolations,
    departmentViolations,
    violationByType,
    totalSystemOverage,
    isLoading,
    leaveTypes,
  } = useViolations(Number(year), period, Number(month), Number(quarter));

  const searchedEmpViolations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employeeViolations;
    return employeeViolations.filter(
      (v) => v.userName.toLowerCase().includes(q) || (v.dept?.tenDonVi || "").toLowerCase().includes(q)
    );
  }, [employeeViolations, search]);

  const searchedDeptViolations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departmentViolations;
    return departmentViolations.filter((d) => d.dept.tenDonVi?.toLowerCase().includes(q));
  }, [departmentViolations, search]);

  const empDetailData = empDetail ? employeeViolations.find((v) => v.userId === empDetail) : null;
  const deptDetailData = deptDetail ? departmentViolations.find((d) => d.dept.donViId === deptDetail) : null;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Theo dõi vượt mức quy định</h2>
        <Badge variant="outline" className="text-xs">Định mức: theo cán bộ/năm</Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm cán bộ hoặc phòng ban..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="year">Theo năm</SelectItem>
                <SelectItem value="quarter">Theo quý</SelectItem>
                <SelectItem value="month">Theo tháng</SelectItem>
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => <SelectItem key={y} value={y.toString()}>Năm {y}</SelectItem>)}
              </SelectContent>
            </Select>
            {period === "quarter" && (
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((q) => <SelectItem key={q} value={q.toString()}>Quý {q}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {period === "month" && (
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <SelectItem key={m} value={m.toString()}>Tháng {m}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <ViolationMetrics
        empCount={employeeViolations.length}
        deptCount={departmentViolations.length}
        totalOverage={totalSystemOverage}
        period={period}
        year={year}
        quarter={quarter}
        month={month}
      />

      <ViolationChart 
        violationByType={violationByType}
        deptViolations={departmentViolations}
      />

      <ViolationDeptTable 
        violations={searchedDeptViolations}
        onDetail={setDeptDetail}
      />

      <ViolationEmpTable 
        violations={searchedEmpViolations}
        onDetail={setEmpDetail}
      />

      <EmpDetailDialog 
        data={empDetailData || null}
        leaveTypes={leaveTypes}
        open={!!empDetail}
        onOpenChange={(o) => !o && setEmpDetail(null)}
      />

      <DeptDetailDialog 
        data={deptDetailData || null}
        employeeViolations={employeeViolations}
        open={!!deptDetail}
        onOpenChange={(o) => !o && setDeptDetail(null)}
      />
    </div>
  );
};

export default ViolationsPage;
