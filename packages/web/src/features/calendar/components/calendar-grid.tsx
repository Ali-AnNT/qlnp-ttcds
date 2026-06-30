import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWithinInterval,
  parseISO,
} from "date-fns";
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
      <CardHeader className="lma-pb-2">
        <div className="lma-flex lma-items-center lma-justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setCurrentMonth(
                (m) => new Date(m.getFullYear(), m.getMonth() - 1),
              )
            }
          >
            <ChevronLeft className="lma-h-4 lma-w-4" />
          </Button>
          <span className="lma-font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale: vi })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setCurrentMonth(
                (m) => new Date(m.getFullYear(), m.getMonth() + 1),
              )
            }
          >
            <ChevronRight className="lma-h-4 lma-w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="lma-grid lma-grid-cols-7 lma-gap-1 lma-text-center lma-text-xs lma-text-muted-foreground lma-mb-1">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
            <div key={d} className="lma-py-1 lma-font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="lma-grid lma-grid-cols-7 lma-gap-1">
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const leaves = getLeaveForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "lma-min-h-[60px] lma-border rounded !lma-p-1 lma-text-xs",
                  leaves.length > 0 && "lma-bg-accent/5",
                )}
              >
                <div className="lma-font-medium lma-text-right">{format(day, "d")}</div>
                {leaves.slice(0, 2).map((l) => (
                  <div
                    key={l.id}
                    className={cn(
                      "truncate lma-text-[10px] rounded lma-px-1 lma-mt-0.5",
                      l.status === "approved"
                        ? "lma-bg-success/20 lma-text-success"
                        : "lma-bg-warning/20 lma-text-warning",
                    )}
                  >
                    {l.userName?.split(" ").pop()}
                  </div>
                ))}
                {leaves.length > 2 && (
                  <div className="lma-text-[10px] lma-text-muted-foreground">
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
