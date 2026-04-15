import { LeaveBalance } from "@/lib/leave-data";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Stethoscope, User, CalendarOff } from "lucide-react";

const iconMap = {
  annual: CalendarDays,
  sick: Stethoscope,
  personal: User,
  unpaid: CalendarOff,
};

const colorMap = {
  annual: "text-primary",
  sick: "text-accent",
  personal: "text-info",
  unpaid: "text-muted-foreground",
};

export function LeaveBalanceCard({ balance }: { balance: LeaveBalance }) {
  const Icon = iconMap[balance.type];
  const color = colorMap[balance.type];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-secondary ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-3xl font-bold text-foreground">
            {balance.remaining}
          </span>
        </div>
        <h3 className="font-semibold text-foreground mb-1">{balance.label}</h3>
        <p className="text-sm text-muted-foreground">
          Đã dùng {balance.used}/{balance.total} ngày
        </p>
        <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: balance.total > 0 ? `${(balance.used / balance.total) * 100}%` : "0%",
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
