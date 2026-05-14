import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";

export function LeaveRequestForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Tạo đơn nghỉ phép
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">Vui lòng sử dụng menu "Tạo đơn mới" để tạo đơn nghỉ phép.</p>
      </CardContent>
    </Card>
  );
}
