import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { differenceInBusinessDays, parseISO, format, eachDayOfInterval, isWithinInterval } from "date-fns";

const LeaveNewPage = () => {
  const currentUser = useStore((s) => s.currentUser);
  const leaveTypes = useStore((s) => s.leaveTypes);
  const employees = useStore((s) => s.employees);
  const leaveRequests = useStore((s) => s.leaveRequests);
  const approvalConfigs = useStore((s) => s.approvalConfigs);
  const addLeaveRequest = useStore((s) => s.addLeaveRequest);
  const navigate = useNavigate();

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [approverId, setApproverId] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  const days = startDate && endDate
    ? Math.max(1, differenceInBusinessDays(parseISO(endDate), parseISO(startDate)) + 1)
    : 0;

  // Get approved leave dates for current user
  const approvedDates = useMemo(() => {
    if (!currentUser) return new Set<string>();
    const dates = new Set<string>();
    leaveRequests
      .filter((r) => r.employee_id === currentUser.employeeId && (r.status === "approved_leader" || r.status === "approved_director"))
      .forEach((r) => {
        try {
          const interval = { start: parseISO(r.start_date), end: parseISO(r.end_date) };
          eachDayOfInterval(interval).forEach((d) => dates.add(format(d, "yyyy-MM-dd")));
        } catch {}
      });
    return dates;
  }, [leaveRequests, currentUser]);

  // Get approvers based on approval_config for selected leave type
  const availableApprovers = useMemo(() => {
    if (!leaveTypeId) return [];
    const configs = approvalConfigs
      .filter((c) => c.leave_type_id === leaveTypeId)
      .sort((a, b) => a.approval_level - b.approval_level);

    const emp = employees.find((e) => e.id === currentUser?.employeeId);
    const approvers: { id: string; full_name: string; level: number; role: string }[] = [];

    configs.forEach((cfg) => {
      const matchedEmployees = employees.filter((e) => {
        if (e.id === currentUser?.employeeId) return false;
        if (e.role !== cfg.approver_role) return false;
        // LD.PCM approvers must be from same department
        if (cfg.approver_role === "LD.PCM" && emp) {
          return e.department_id === emp.department_id;
        }
        return true;
      });
      matchedEmployees.forEach((e) => {
        if (!approvers.find((a) => a.id === e.id)) {
          approvers.push({ id: e.id, full_name: e.full_name, level: cfg.approval_level, role: cfg.approver_role });
        }
      });
    });

    return approvers;
  }, [leaveTypeId, approvalConfigs, employees, currentUser]);

  // Check if selected date range overlaps with approved dates
  const hasOverlap = useMemo(() => {
    if (!startDate || !endDate) return false;
    try {
      const interval = { start: parseISO(startDate), end: parseISO(endDate) };
      return eachDayOfInterval(interval).some((d) => approvedDates.has(format(d, "yyyy-MM-dd")));
    } catch {
      return false;
    }
  }, [startDate, endDate, approvedDates]);

  const handleLeaveTypeChange = (val: string) => {
    setLeaveTypeId(val);
    setApproverId("");
  };

  const handleSubmit = async (status: "pending") => {
    if (!startDate || !endDate) { toast.error("Vui lòng chọn ngày"); return; }
    if (startDate > endDate) { toast.error("Ngày bắt đầu phải trước ngày kết thúc"); return; }
    if (startDate < today) { toast.error("Không được chọn ngày trong quá khứ"); return; }
    if (!reason.trim()) { toast.error("Vui lòng nhập lý do"); return; }
    if (!leaveTypeId) { toast.error("Vui lòng chọn loại phép"); return; }
    if (!approverId) { toast.error("Vui lòng chọn người phê duyệt"); return; }
    if (hasOverlap) { toast.error("Khoảng ngày nghỉ trùng với đơn đã được duyệt"); return; }

    await addLeaveRequest({
      employee_id: currentUser!.employeeId,
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      total_days: days,
      reason,
      status,
      approved_by: approverId,
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
            <Select value={leaveTypeId} onValueChange={handleLeaveTypeChange}>
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

          <div className="space-y-2">
            <Label className="text-[13px]">Người phê duyệt</Label>
            {availableApprovers.length > 0 ? (
              <Select value={approverId} onValueChange={setApproverId}>
                <SelectTrigger><SelectValue placeholder="Chọn người phê duyệt" /></SelectTrigger>
                <SelectContent>
                  {availableApprovers.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.full_name} (Cấp {a.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input disabled value={leaveTypeId ? "Chưa cấu hình cấp phê duyệt cho loại phép này" : "Vui lòng chọn loại phép trước"} />
            )}
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
