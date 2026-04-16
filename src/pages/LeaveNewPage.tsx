import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { differenceInBusinessDays, parseISO } from "date-fns";

const LeaveNewPage = () => {
  const currentUser = useStore((s) => s.currentUser);
  const leaveTypes = useStore((s) => s.leaveTypes);
  const employees = useStore((s) => s.employees);
  const addLeaveRequest = useStore((s) => s.addLeaveRequest);
  const navigate = useNavigate();

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const days = startDate && endDate
    ? Math.max(1, differenceInBusinessDays(parseISO(endDate), parseISO(startDate)) + 1)
    : 0;

  const emp = employees.find((e) => e.id === currentUser?.employeeId);
  const approver = employees.find(
    (e) => e.department_id === emp?.department_id && e.role === "LD.PCM" && e.id !== emp?.id
  ) || employees.find((e) => e.role === "GD.PGD");

  const handleSubmit = async (status: "pending") => {
    if (!startDate || !endDate) { toast.error("Vui lòng chọn ngày"); return; }
    if (startDate > endDate) { toast.error("Ngày bắt đầu phải trước ngày kết thúc"); return; }
    if (!reason.trim()) { toast.error("Vui lòng nhập lý do"); return; }
    if (!leaveTypeId) { toast.error("Vui lòng chọn loại phép"); return; }

    await addLeaveRequest({
      employee_id: currentUser!.employeeId,
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      total_days: days,
      reason,
      status,
      approved_by: approver?.id || null,
      approved_at: null,
      rejected_reason: null,
    });
    toast.success("Đã gửi phê duyệt");
    navigate("/leave/my");
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tạo đơn xin nghỉ phép</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[13px]">Loại đơn xin nghỉ</Label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
              <SelectTrigger><SelectValue placeholder="Chọn loại phép" /></SelectTrigger>
              <SelectContent>
                {leaveTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Ngày bắt đầu</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Ngày kết thúc</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {days > 0 && (
            <div className="bg-muted rounded-md px-3 py-2 text-sm">
              Số ngày nghỉ: <strong>{days}</strong> ngày
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[13px]">Lý do nghỉ</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do xin nghỉ..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Người phê duyệt</Label>
            <Input disabled value={approver?.full_name || "Chưa xác định"} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => handleSubmit("pending")}>Gửi phê duyệt</Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>Hủy</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveNewPage;
