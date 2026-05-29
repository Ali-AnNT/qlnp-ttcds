import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import type { LeaveRequestDto } from "@/features/leave-requests";

interface CalendarGridProps {
  requests: LeaveRequestDto[];
}

export const CalendarGrid = ({ requests }: CalendarGridProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getLeaveForDay = (day: Date) =>
    requests.filter((r) => {
      const start = parseISO(r.startDate);
      const end = parseISO(r.endDate);
      return isWithinInterval(day, { start, end });
    });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale: vi })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
            <div key={d} className="py-1 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const leaves = getLeaveForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[60px] border rounded p-1 text-xs",
                  leaves.length > 0 && "bg-accent/5",
                )}
              >
                <div className="font-medium text-right">{format(day, "d")}</div>
                {leaves.slice(0, 2).map((l) => (
                  <div
                    key={l.id}
                    className={cn(
                      "truncate text-[10px] rounded px-1 mt-0.5",
                      l.status === "approved"
                        ? "bg-success/20 text-success"
                        : "bg-warning/20 text-warning",
                    )}
                  >
                    {l.userName?.split(" ").pop()}
                  </div>
                ))}
                {leaves.length > 2 && (
                  <div className="text-[10px] text-muted-foreground">
                    +{leaves.length - 2}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
