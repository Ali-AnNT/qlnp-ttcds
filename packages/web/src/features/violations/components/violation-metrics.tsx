import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Building2, Users, TrendingUp, Calendar } from "lucide-react";
import { Period } from "../api/types";

interface ViolationMetricsProps {
  empCount: number;
  deptCount: number;
  totalOverage: number;
  period: Period;
  year: string;
  quarter: string;
  month: string;
}

export function ViolationMetrics({
  empCount,
  deptCount,
  totalOverage,
  period,
  year,
  quarter,
  month,
}: ViolationMetricsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-warning/30">
        <CardContent className="p-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-warning" />
          <div>
            <p className="text-2xl font-bold">{empCount}</p>
            <p className="text-xs text-muted-foreground">Cán bộ vượt mức</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-destructive/30">
        <CardContent className="p-4 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-destructive" />
          <div>
            <p className="text-2xl font-bold">{deptCount}</p>
            <p className="text-xs text-muted-foreground">Phòng ban có vi phạm</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-warning/30">
        <CardContent className="p-4 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-warning" />
          <div>
            <p className="text-2xl font-bold">+{totalOverage}</p>
            <p className="text-xs text-muted-foreground">Tổng ngày vượt (toàn cơ quan)</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-bold">
              {period === "year" && `Năm ${year}`}
              {period === "quarter" && `Quý ${quarter}/${year}`}
              {period === "month" && `Tháng ${month}/${year}`}
            </p>
            <p className="text-xs text-muted-foreground">Kỳ thống kê</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
