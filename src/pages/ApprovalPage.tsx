import { useState } from "react";
import { useStore } from "@/store/useStore";
import { employees, departments, leaveTypeLabels, leaveStatusLabels, LeaveStatus, LeaveRequest } from "@/lib/leave-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye } from "lucide-react";

const statusColor: Record<LeaveStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning border-warning/30",
  approved: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
};

const ApprovalPage = () => {
  const currentUser = useStore(s => s.currentUser);
  const leaveRequests = useStore(s => s.leaveRequests);
  const updateLeaveRequest = useStore(s => s.updateLeaveRequest);
  const [filterName, setFilterName] = useState("");
  const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pendingRequests = leaveRequests
    .filter(r => r.status === "pending")
    .filter(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return !filterName || emp?.name.toLowerCase().includes(filterName.toLowerCase());
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleApprove = (id: string) => {
    updateLeaveRequest(id, { status: "approved" });
    toast.success("Đã phê duyệt");
  };

  const handleReject = () => {
    if (!rejectId) return;
    updateLeaveRequest(rejectId, { status: "rejected", rejectionReason: rejectReason });
    toast.success("Đã từ chối");
    setRejectId(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Phê duyệt đơn nghỉ phép</h2>
        <Input placeholder="Tìm theo tên..." value={filterName} onChange={e => setFilterName(e.target.value)} className="w-60" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">STT</TableHead>
                <TableHead>Họ tên CB</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead>Loại phép</TableHead>
                <TableHead>Từ ngày</TableHead>
                <TableHead>Đến ngày</TableHead>
                <TableHead className="w-16">Số ngày</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead className="w-40">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Không có đơn chờ duyệt</TableCell></TableRow>
              ) : pendingRequests.map((r, i) => {
                const emp = employees.find(e => e.id === r.employeeId);
                const dept = departments.find(d => d.id === emp?.departmentId);
                return (
                  <TableRow key={r.id} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                    <TableCell className="text-center">{i + 1}</TableCell>
                    <TableCell className="font-medium">{emp?.name}</TableCell>
                    <TableCell>{dept?.name}</TableCell>
                    <TableCell>{leaveTypeLabels[r.type]}</TableCell>
                    <TableCell>{r.startDate}</TableCell>
                    <TableCell>{r.endDate}</TableCell>
                    <TableCell className="text-center">{r.days}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{r.reason}</TableCell>
                    <TableCell>{r.createdAt}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" className="h-7 px-2 bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleApprove(r.id)}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Duyệt
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => setRejectId(r.id)}>
                          <XCircle className="h-3 w-3 mr-1" /> Từ chối
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setDetailRequest(r)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject modal */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Từ chối đơn nghỉ phép</DialogTitle></DialogHeader>
          <Textarea placeholder="Lý do từ chối..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleReject}>Xác nhận từ chối</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail modal */}
      <Dialog open={!!detailRequest} onOpenChange={() => setDetailRequest(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chi tiết đơn nghỉ phép</DialogTitle></DialogHeader>
          {detailRequest && (() => {
            const emp = employees.find(e => e.id === detailRequest.employeeId);
            const dept = departments.find(d => d.id === emp?.departmentId);
            return (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Họ tên:</span> <strong>{emp?.name}</strong></div>
                  <div><span className="text-muted-foreground">Phòng ban:</span> {dept?.name}</div>
                  <div><span className="text-muted-foreground">Loại phép:</span> {leaveTypeLabels[detailRequest.type]}</div>
                  <div><span className="text-muted-foreground">Số ngày:</span> {detailRequest.days}</div>
                  <div><span className="text-muted-foreground">Từ ngày:</span> {detailRequest.startDate}</div>
                  <div><span className="text-muted-foreground">Đến ngày:</span> {detailRequest.endDate}</div>
                </div>
                <div><span className="text-muted-foreground">Lý do:</span> {detailRequest.reason}</div>
                <div><span className="text-muted-foreground">Ngày gửi:</span> {detailRequest.createdAt}</div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalPage;
