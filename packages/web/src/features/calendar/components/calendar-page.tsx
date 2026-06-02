import { useState, useMemo } from "react";
import { CalendarDays, List } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useCalendarData } from "../hooks/use-calendar-data";
import { useLeaveTypes } from "@/features/leave-requests";
import { CalendarGrid } from "./calendar-grid";
import { CalendarList } from "./calendar-list";

const CalendarPage = () => {
  const {
    activeRequests,
    departments,
    maxLevelByType,
    loading,
  } = useCalendarData();
  const { data: leaveTypes = [] } = useLeaveTypes();

  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [filterDept, setFilterDept] = useState("all");

  const filteredRequests = useMemo(() => {
    return activeRequests.filter((r) => {
      if (filterDept === "all") return true;
      return String(r.donViId) === filterDept;
    });
  }, [activeRequests, filterDept]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Theo dõi lịch nghỉ phép</h2>
        <div className="flex gap-2">
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Phòng ban" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.donViId} value={String(d.donViId)}>{d.tenDonVi}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8">Đang tải...</div>
      ) : viewMode === "calendar" ? (
        <CalendarGrid requests={filteredRequests} />
      ) : (
        <CalendarList
          requests={filteredRequests}
          departments={departments}
          leaveTypes={leaveTypes}
          maxLevelByType={maxLevelByType}
        />
      )}
    </div>
  );
};

export default CalendarPage;
