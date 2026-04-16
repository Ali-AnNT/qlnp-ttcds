import { useState } from "react";
import { useStore } from "@/store/useStore";
import { leaveStatusLabels, LeaveStatus } from "@/lib/leave-data";
import { formatDate } from "@/lib/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { XCircle, Pencil } from "lucide-react";
import { differenceInBusinessDays, parseISO } from "date-fns";

const statusColor: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  approved_leader: "bg-blue-100 text-blue-700 border-blue-300",
  approved_director: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
};

const LeaveMyPage = () => {
  const currentUser = useStore((s) => s.currentUser);
  const leaveRequests = useStore((s) => s.leaveRequests);
  const updateLeaveRequest = useStore((s) => s.updateLeaveRequest);
  const getLeaveType = useStore((s) => s.getLeaveType);
  const leaveTypes = useStore((s) => s.leaveTypes);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Edit dialog state
  const [editRequest, setEditRequest] = useState<any | null>(null);
  const [editLeaveTypeId, setEditLeaveTypeId] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editReason, setEditReason] = useState("");

  const myRequests = leaveRequests
    .filter((r) => r.employee_id === currentUser?.employeeId)
    .filter((r) => filterStatus === "all" || r.status === filterStatus);

  const handleCancel = async (id: string) => {
    await updateLeaveRequest(id, { status: "cancelled" });
    toast.success("Đã hủy đơn");
  };

  const openEdit = (r: any) => {
    setEditRequest(r);
    setEditLeaveTypeId(r.leave_type_id);
    setEditStartDate(r.start_date);
    setEditEndDate(r.end_date);
    setEditReason(r.reason || "");
  };

  const editDays = editStartDate && editEndDate
    ? Math.max(1, differenceInBusinessDays(parseISO(editEndDate), parseISO(editStartDate)) + 1)
    : 0;

  const handleSaveEdit = async () => {
    if (!editRequest) return;
    if (!editStartDate || !editEndDate) { toast.error("Vui lòng chọn ngày"); return; }
    if (editStartDate > editEndDate) { toast.error("Ngày bắt đầu phải trước ngày kết thúc"); return; }
    if (!editReason.trim()) { toast.error("Vui lòng nhập lý do"); return; }
    if (!editLeaveTypeId) { toast.error("Vui lòng chọn loại phép"); return; }

    await updateLeaveRequest(editRequest.id, {
      leave_type_id: editLeaveTypeId,
      start_date: editStartDate,
      end_date: editEndDate,
      total_days: editDays,
      reason: editReason,
      status: "pending",
    });
    toast.success("Đã cập nhật và gửi lại đơn");
    setEditRequest(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Danh sách đơn của tôi</h2>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {(Object.keys(leaveStatusLabels) as LeaveStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{leaveStatusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">STT</TableHead>
                <TableHead>Loại phép</TableHead>
                <TableHead>Ngày bắt đầu</TableHead>
                <TableHead>Ngày kết thúc</TableHead>
                <TableHead className="w-16">Số ngày</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead className="w-28">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myRequests.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Không có đơn nào</TableCell></TableRow>
              ) : myRequests.map((r, i) => (
                <TableRow key={r.id} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                  <TableCell className="text-center">{i + 1}</TableCell>
                  <TableCell>{getLeaveType(r.leave_type_id)?.name}</TableCell>
                  <TableCell>{formatDate(r.start_date)}</TableCell>
                  <TableCell>{formatDate(r.end_date)}</TableCell>
                  <TableCell className="text-center">{r.total_days}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{r.reason}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[11px]", statusColor[r.status])}>
                      {leaveStatusLabels[r.status as LeaveStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(r.created_at)}</TableCell>
                  <TableCell>
                    {r.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-primary" onClick={() => openEdit(r)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => handleCancel(r.id)}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editRequest} onOpenChange={() => setEditRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Sửa đơn xin nghỉ phép</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Loại đơn xin nghỉ</Label>
              <Select value={editLeaveTypeId} onValueChange={setEditLeaveTypeId}>
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
                <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Ngày kết thúc</Label>
                <Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
              </div>
            </div>
            {editDays > 0 && (
              <div className="bg-muted rounded-md px-3 py-2 text-sm">
                Số ngày nghỉ: <strong>{editDays}</strong> ngày
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-[13px]">Lý do nghỉ</Label>
              <Textarea value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="Nhập lý do xin nghỉ..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRequest(null)}>Hủy</Button>
            <Button onClick={handleSaveEdit}>Lưu & Gửi lại</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveMyPage;
