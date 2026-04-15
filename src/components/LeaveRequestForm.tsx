import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LeaveType, leaveTypeLabels, LeaveRequest } from "@/lib/leave-data";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface Props {
  onSubmit: (request: LeaveRequest) => void;
}

export function LeaveRequestForm({ onSubmit }: Props) {
  const [type, setType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      toast({ title: "Lỗi", description: "Ngày kết thúc phải sau ngày bắt đầu", variant: "destructive" });
      return;
    }
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const request: LeaveRequest = {
      id: Date.now().toString(),
      type,
      startDate,
      endDate,
      reason,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
      days,
    };
    onSubmit(request);
    setStartDate("");
    setEndDate("");
    setReason("");
    toast({ title: "Thành công", description: "Đơn nghỉ phép đã được gửi" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Tạo đơn nghỉ phép
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Loại nghỉ phép</Label>
            <Select value={type} onValueChange={(v) => setType(v as LeaveType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(leaveTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Từ ngày</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Đến ngày</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Lý do</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do nghỉ phép..." rows={3} />
          </div>
          <Button type="submit" className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Gửi đơn
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
