import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { SystemConfigDto } from "../api/types";
import { cn } from "@/shared/lib/utils";

interface GeneralSettingsProps {
  configs: SystemConfigDto[];
  onChange: (key: string, value: string) => void;
  isAdmin: boolean;
}

export const GeneralSettings = ({ configs, onChange, isAdmin }: GeneralSettingsProps) => {
  const getSystemConfig = (key: string) =>
    configs.find((c) => c.configKey === key)?.configValue ?? "";

  const workDaysValue = getSystemConfig("work_days");
  const workDays = workDaysValue ? workDaysValue.split(",").map(Number) : [1, 2, 3, 4, 5];
  const daysLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const toggleDay = (day: number) => {
    const next = workDays.includes(day)
      ? workDays.filter((d) => d !== day)
      : [...workDays, day].sort((a, b) => a - b);

    // Ensure at least one day is selected to avoid invalid config
    if (next.length === 0) return;

    onChange("work_days", next.join(","));
  };

  return (
    <Card>
      <CardHeader className="lma-pb-2">
        <CardTitle className="lma-text-sm">Cài đặt chung</CardTitle>
      </CardHeader>
      <CardContent className="lma-space-y-3">
        <div className="lma-grid lma-grid-cols-1 sm:lma-grid-cols-2 lma-gap-3">
          <div className="lma-flex lma-items-center lma-gap-2">
            <Label className="lma-text-xs lma-w-40">Số ngày phép tối đa/năm</Label>
            <Input
              type="number"
              min={0}
              className="lma-w-20 lma-h-8 lma-text-sm"
              value={getSystemConfig("max_annual_leave")}
              onChange={(e) => onChange("max_annual_leave", e.target.value)}
              disabled={!isAdmin}
            />
            <span className="lma-text-xs lma-text-muted-foreground">ngày</span>
          </div>
          <div className="lma-flex lma-items-center lma-gap-2">
            <Label className="lma-text-xs lma-w-40">Số ngày tối thiểu/đơn</Label>
            <Input
              type="number"
              min={0}
              className="lma-w-20 lma-h-8 lma-text-sm"
              value={getSystemConfig("min_request_days")}
              onChange={(e) => onChange("min_request_days", e.target.value)}
              disabled={!isAdmin}
            />
            <span className="lma-text-xs lma-text-muted-foreground">ngày</span>
          </div>
          <div className="lma-flex lma-items-center lma-gap-2">
            <Label className="lma-text-xs lma-w-40">Số ngày phép chuyển sang</Label>
            <Input
              type="number"
              min={0}
              className="lma-w-20 lma-h-8 lma-text-sm"
              value={getSystemConfig("max_carry_over")}
              onChange={(e) => onChange("max_carry_over", e.target.value)}
              disabled={!isAdmin}
            />
            <span className="lma-text-xs lma-text-muted-foreground">ngày</span>
          </div>
          <div className="lma-flex lma-items-center lma-gap-2">
            <Label className="lma-text-xs lma-w-40">Chu kỳ tính phép</Label>
            <Select
              value={getSystemConfig("leave_cycle") || "yearly"}
              onValueChange={(v) => onChange("leave_cycle", v)}
              disabled={!isAdmin}
            >
              <SelectTrigger className="lma-w-28 lma-h-8 lma-text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yearly">Hàng năm</SelectItem>
                <SelectItem value="monthly">Hàng tháng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="lma-flex lma-items-center lma-gap-2">
            <Label className="lma-text-xs lma-w-40">Ngày làm việc trong tuần</Label>
            <div className="lma-flex lma-gap-1">
              {daysLabels.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => toggleDay(idx)}
                  className={cn(
                    "lma-w-7 lma-h-7 lma-text-[10px] rounded lma-flex lma-items-center lma-justify-center lma-transition-colors",
                    workDays.includes(idx)
                      ? "lma-bg-primary lma-text-primary-foreground"
                      : "lma-bg-muted lma-text-muted-foreground hover:lma-bg-muted-foreground/20"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
