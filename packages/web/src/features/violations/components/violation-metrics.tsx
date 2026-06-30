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
    <div className="lma-grid lma-grid-cols-2 lg:lma-grid-cols-4 lma-gap-4">
      <Card className="lma-border-warning/30">
        <CardContent className="lma-p-4 lma-flex lma-items-center lma-gap-3">
          <Users className="lma-h-8 lma-w-8 lma-text-warning" />
          <div>
            <p className="lma-text-2xl lma-font-bold">{empCount}</p>
            <p className="lma-text-xs lma-text-muted-foreground">Cán bộ vượt mức</p>
          </div>
        </CardContent>
      </Card>
      <Card className="lma-border-destructive/30">
        <CardContent className="lma-p-4 lma-flex lma-items-center lma-gap-3">
          <Building2 className="lma-h-8 lma-w-8 lma-text-destructive" />
          <div>
            <p className="lma-text-2xl lma-font-bold">{deptCount}</p>
            <p className="lma-text-xs lma-text-muted-foreground">Phòng ban có vi phạm</p>
          </div>
        </CardContent>
      </Card>
      <Card className="lma-border-warning/30">
        <CardContent className="lma-p-4 lma-flex lma-items-center lma-gap-3">
          <TrendingUp className="lma-h-8 lma-w-8 lma-text-warning" />
          <div>
            <p className="lma-text-2xl lma-font-bold">+{totalOverage}</p>
            <p className="lma-text-xs lma-text-muted-foreground">Tổng ngày vượt (toàn cơ quan)</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="lma-p-4 lma-flex lma-items-center lma-gap-3">
          <Calendar className="lma-h-8 lma-w-8 lma-text-primary" />
          <div>
            <p className="lma-text-sm lma-font-bold">
              {period === "year" && `Năm ${year}`}
              {period === "quarter" && `Quý ${quarter}/${year}`}
              {period === "month" && `Tháng ${month}/${year}`}
            </p>
            <p className="lma-text-xs lma-text-muted-foreground">Kỳ thống kê</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
