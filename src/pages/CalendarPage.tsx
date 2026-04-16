import { useState } from "react";
import { useStore } from "@/store/useStore";
import { leaveStatusLabels, LeaveStatus } from "@/lib/leave-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";

const statusColor: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  approved_leader: "bg-blue-100 text-blue-700 border-blue-300",
  approved_director: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
};

const CalendarPage = () => {
  const leaveRequests = useStore((s) => s.leaveRequests);
  const departments = useStore((s) => s.departments);
  const getEmployee = useStore((s) => s.getEmployee);
  const getDepartment = useStore((s) => s.getDepartment);
  const getLeaveType = useStore((s) => s.getLeaveType);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterDept, setFilterDept] = useState("all");

  const activeRequests = leaveRequests.filter((r) => r.status !== "cancelled" && r.status !== "rejected");

  const filteredRequests = activeRequests.filter((r) => {
    if (filterDept === "all") return true;
    const emp = getEmployee(r.employee_id);
    return emp?.department_id === filterDept;
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getLeaveForDay = (day: Date) =>
    filteredRequests.filter((r) => {
      const start = parseISO(r.start_date);
      const end = parseISO(r.end_date);
      return isWithinInterval(day, { start, end });
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Theo dõi lịch nghỉ phép</h2>
        <div className="flex gap-2">
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Phòng ban" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button variant={viewMode === "calendar" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("calendar")}><CalendarDays className="h-4 w-4" /></Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="font-semibold">{format(currentMonth, "MMMM yyyy", { locale: vi })}</span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => <div key={d} className="py-1 font-medium">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map((day) => {
                const leaves = getLeaveForDay(day);
                return (
                  <div key={day.toISOString()} className={cn("min-h-[60px] border rounded p-1 text-xs", leaves.length > 0 && "bg-accent/5")}>
                    <div className="font-medium text-right">{format(day, "d")}</div>
                    {leaves.slice(0, 2).map((l) => {
                      const e = getEmployee(l.employee_id);
                      return (
                        <div key={l.id} className={cn("truncate text-[10px] rounded px-1 mt-0.5", l.status.includes("approved") ? "bg-success/20 text-success" : "bg-warning/20 text-warning")}>
                          {e?.full_name.split(" ").pop()}
                        </div>
                      );
                    })}
                    {leaves.length > 2 && <div className="text-[10px] text-muted-foreground">+{leaves.length - 2}</div>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Tên CB</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Loại phép</TableHead>
                  <TableHead>Từ ngày</TableHead>
                  <TableHead>Đến ngày</TableHead>
                  <TableHead>Số ngày</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.sort((a, b) => a.start_date.localeCompare(b.start_date)).map((r, i) => {
                  const emp = getEmployee(r.employee_id);
                  const dept = emp?.department_id ? getDepartment(emp.department_id) : undefined;
                  return (
                    <TableRow key={r.id} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                      <TableCell className="font-medium">{emp?.full_name}</TableCell>
                      <TableCell>{dept?.name}</TableCell>
                      <TableCell>{getLeaveType(r.leave_type_id)?.name}</TableCell>
                      <TableCell>{r.start_date}</TableCell>
                      <TableCell>{r.end_date}</TableCell>
                      <TableCell className="text-center">{r.total_days}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[11px]", statusColor[r.status])}>
                          {leaveStatusLabels[r.status as LeaveStatus]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarPage;
