import { useState } from "react";
import { useStore } from "@/store/useStore";
import { leaveStatusLabels, LeaveStatus, LeaveRequest } from "@/lib/leave-data";
import { formatDate } from "@/lib/date-utils";
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

const ApprovalPage = () => {
  const currentUser = useStore((s) => s.currentUser);
  const leaveRequests = useStore((s) => s.leaveRequests);
  const updateLeaveRequest = useStore((s) => s.updateLeaveRequest);
  const getEmployee = useStore((s) => s.getEmployee);
  const getDepartment = useStore((s) => s.getDepartment);
  const getLeaveType = useStore((s) => s.getLeaveType);
  const employees = useStore((s) => s.employees);
  const [filterName, setFilterName] = useState("");
  const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Filter pending requests based on approver role
  const pendingRequests = leaveRequests
    .filter((r) => r.status === "pending")
    .filter((r) => {
      if (!currentUser) return false;
      const emp = getEmployee(r.employee_id);
      if (!emp) return false;

      // LD.PCM: only sees requests from their own department
      if (currentUser.role === "LD.PCM") {
        const currentEmp = employees.find((e) => e.id === currentUser.employeeId);
        return emp.department_id === currentEmp?.department_id && emp.id !== currentUser.employeeId;
      }
      // GD.PGD: sees all pending requests (or those already approved by leader)
      if (currentUser.role === "GD.PGD") {
        return true;
      }
      // QTHT: sees all
      if (currentUser.role === "QTHT") {
        return true;
      }
      return false;
    })
    .filter((r) => {
      const emp = getEmployee(r.employee_id);
      return !filterName || emp?.full_name.toLowerCase().includes(filterName.toLowerCase());
    });

  const handleApprove = async (id: string) => {
    const newStatus = currentUser?.role === "GD.PGD" ? "approved_director" : "approved_leader";
    await updateLeaveRequest(id, { status: newStatus, approved_by: currentUser?.employeeId });
    toast.success("Đã phê duyệt");
  };

  const handleReject = async () => {
    if (!rejectId) return;
    await updateLeaveRequest(rejectId, {
      status: "rejected",
      rejected_reason: rejectReason,
      approved_by: currentUser?.employeeId,
    });
    toast.success("Đã từ chối");
    setRejectId(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Phê duyệt đơn nghỉ phép</h2>
        <Input
          placeholder="Tìm theo tên..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="w-60"
        />
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
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Không có đơn chờ duyệt
                  </TableCell>
                </TableRow>
              ) : (
                pendingRequests.map((r, i) => {
                  const emp = getEmployee(r.employee_id);
                  const dept = emp?.department_id ? getDepartment(emp.department_id) : undefined;
                  return (
                    <TableRow key={r.id} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                      <TableCell className="text-center">{i + 1}</TableCell>
                      <TableCell className="font-medium">{emp?.full_name}</TableCell>
                      <TableCell>{dept?.name}</TableCell>
                      <TableCell>{getLeaveType(r.leave_type_id)?.name}</TableCell>
                      <TableCell>{formatDate(r.start_date)}</TableCell>
                      <TableCell>{formatDate(r.end_date)}</TableCell>
                      <TableCell className="text-center">{r.total_days}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{r.reason}</TableCell>
                      <TableCell>{formatDate(r.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className="h-7 px-2 bg-success hover:bg-success/90 text-success-foreground"
                            onClick={() => handleApprove(r.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2"
                            onClick={() => setRejectId(r.id)}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setDetailRequest(r)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối đơn nghỉ phép</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Lý do từ chối..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailRequest} onOpenChange={() => setDetailRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết đơn nghỉ phép</DialogTitle>
          </DialogHeader>
          {detailRequest &&
            (() => {
              const emp = getEmployee(detailRequest.employee_id);
              const dept = emp?.department_id ? getDepartment(emp.department_id) : undefined;
              return (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Họ tên:</span> <strong>{emp?.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phòng ban:</span> {dept?.name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Loại phép:</span>{" "}
                      {getLeaveType(detailRequest.leave_type_id)?.name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Số ngày:</span> {detailRequest.total_days}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Từ ngày:</span> {formatDate(detailRequest.start_date)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Đến ngày:</span> {formatDate(detailRequest.end_date)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lý do:</span> {detailRequest.reason}
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalPage;
