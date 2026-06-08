import { Card, CardContent } from "@/shared/ui/card";
import { CalendarDays } from "lucide-react";

interface LeaveBalanceInfo {
  label: string;
  total: number;
  used: number;
  remaining: number;
}

export function LeaveBalanceCard({ balance }: { balance: LeaveBalanceInfo }) {
  return (
    <Card className="hover:lma-shadow-lg lma-transition-shadow">
      <CardContent className="lma-p-6">
        <div className="lma-flex lma-items-center lma-justify-between lma-mb-4">
          <div className="lma-p-3 lma-rounded-xl lma-bg-secondary lma-text-primary">
            <CalendarDays className="lma-h-5 lma-w-5" />
          </div>
          <span className="lma-text-3xl lma-font-bold lma-text-foreground">{balance.remaining}</span>
        </div>
        <h3 className="lma-font-semibold lma-text-foreground lma-mb-1">{balance.label}</h3>
        <p className="lma-text-sm lma-text-muted-foreground">Đã dùng {balance.used}/{balance.total} ngày</p>
        <div className="lma-mt-3 lma-h-2 lma-rounded-full lma-bg-secondary lma-overflow-hidden">
          <div className="lma-h-full lma-rounded-full lma-bg-primary lma-transition-all" style={{ width: balance.total > 0 ? `${(balance.used / balance.total) * 100}%` : "0%" }} />
        </div>
      </CardContent>
    </Card>
  );
}

export type { LeaveBalanceInfo };