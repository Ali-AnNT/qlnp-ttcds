import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { SystemConfigDto } from "../api/types";

interface GeneralSettingsProps {
  configs: SystemConfigDto[];
  onChange: (key: string, value: string) => void;
  isAdmin: boolean;
}

export const GeneralSettings = ({ configs, onChange, isAdmin }: GeneralSettingsProps) => {
  const getSystemConfig = (key: string) => 
    configs.find((c) => c.configKey === key)?.configValue ?? "";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Cài đặt chung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs w-40">Số ngày phép tối đa/năm</Label>
            <Input
              type="number"
              min={0}
              className="w-20 h-8 text-sm"
              value={getSystemConfig("max_annual_leave")}
              onChange={(e) => onChange("max_annual_leave", e.target.value)}
              disabled={!isAdmin}
            />
            <span className="text-xs text-muted-foreground">ngày</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-40">Số ngày tối thiểu/đơn</Label>
            <Input
              type="number"
              min={0}
              className="w-20 h-8 text-sm"
              value={getSystemConfig("min_request_days")}
              onChange={(e) => onChange("min_request_days", e.target.value)}
              disabled={!isAdmin}
            />
            <span className="text-xs text-muted-foreground">ngày</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-40">Số ngày phép chuyển sang</Label>
            <Input
              type="number"
              min={0}
              className="w-20 h-8 text-sm"
              value={getSystemConfig("max_carry_over")}
              onChange={(e) => onChange("max_carry_over", e.target.value)}
              disabled={!isAdmin}
            />
            <span className="text-xs text-muted-foreground">ngày</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-40">Chu kỳ tính phép</Label>
            <Select
              value={getSystemConfig("leave_cycle") || "yearly"}
              onValueChange={(v) => onChange("leave_cycle", v)}
              disabled={!isAdmin}
            >
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yearly">Hàng năm</SelectItem>
                <SelectItem value="monthly">Hàng tháng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
