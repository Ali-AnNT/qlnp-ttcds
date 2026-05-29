import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { toast } from "sonner";
import { differenceInBusinessDays, parseISO, format, eachDayOfInterval } from "date-fns";

const LeaveNewPage = () => {
  const { user } = useAuth();
  const leaveTypes = useStore((s) => s.leaveTypes);
  const leaveRequests = useStore((s) => s.leaveRequests);
  const addLeaveRequest = useStore((s) => s.addLeaveRequest);
  const navigate = useNavigate();

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  const days = startDate && endDate
    ? Math.max(1, differenceInBusinessDays(parseISO(endDate), parseISO(startDate)) + 1)
    : 0;

  const approvedDates = useMemo(() => {
    if (!user) return new Set<string>();
    const dates = new Set<string>();
    leaveRequests
      .filter((r) => r.userId === user.userId && r.status === "approved")
      .forEach((r) => {
        try {
          const interval = { start: parseISO(r.startDate), end: parseISO(r.endDate) };
          eachDayOfInterval(interval).forEach((d) => dates.add(format(d, "yyyy-MM-dd")));
        } catch {
          // Ignore malformed historical dates; form validation covers the submitted range.
        }
      });
    return dates;
  }, [leaveRequests, user]);

  const hasOverlap = useMemo(() => {
    if (!startDate || !endDate) return false;
    try {
      const interval = { start: parseISO(startDate), end: parseISO(endDate) };
      return eachDayOfInterval(interval).some((d) => approvedDates.has(format(d, "yyyy-MM-dd")));
    } catch {
      return false;
    }
  }, [startDate, endDate, approvedDates]);

  const handleSubmit = async () => {
    if (!startDate || !endDate) { toast.error("Vui lòng chọn ngày"); return; }
    if (startDate > endDate) { toast.error("Ngày bắt đầu phải trước ngày kết thúc"); return; }
    if (startDate < today) { toast.error("Không được chọn ngày trong quá khứ"); return; }
    if (!reason.trim()) { toast.error("Vui lòng nhập lý do"); return; }
    if (!leaveTypeId) { toast.error("Vui lòng chọn loại phép"); return; }
    if (hasOverlap) { toast.error("Khoảng ngày nghỉ trùng với đơn đã được duyệt"); return; }

    await addLeaveRequest({
      leaveTypeId: Number(leaveTypeId),
      startDate,
      endDate,
      totalDays: days,
      reason,
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
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Ngày bắt đầu</Label>
              <Input type="date" min={today} value={startDate} onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && e.target.value > endDate) setEndDate("");
              }} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Ngày kết thúc</Label>
              <Input type="date" min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {days > 0 && (
            <div className="bg-muted rounded-md px-3 py-2 text-sm">
              Số ngày nghỉ: <strong>{days}</strong> ngày
            </div>
          )}

          {hasOverlap && (
            <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              ⚠ Khoảng ngày nghỉ trùng với đơn đã được duyệt. Vui lòng chọn ngày khác.
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[13px]">Lý do nghỉ</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do xin nghỉ..." rows={3} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleSubmit}>Gửi phê duyệt</Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>Hủy</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveNewPage;
