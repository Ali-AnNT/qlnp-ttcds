import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store/useStore";
import { formatDate } from "@/lib/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { leaveRequestsApi, type LeaveRequestDto } from "@/api/leave-requests.api";
import { configApi, type ConfigDto } from "@/api/config.api";

const statusLabels: Record<string, string> = {
  pending: "Chờ duyệt",
  approved_leader: "LĐ đã duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
};

const ApprovalPage = () => {
  const { user } = useAuth();
  const leaveRequests = useStore((s) => s.leaveRequests);
  const leaveTypes = useStore((s) => s.leaveTypes);
  const departments = useStore((s) => s.departments);
  const loadData = useStore((s) => s.loadData);
  const [filterName, setFilterName] = useState("");
  const [detailRequest, setDetailRequest] = useState<LeaveRequestDto | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approvalConfigs, setApprovalConfigs] = useState<ConfigDto[]>([]);

  useEffect(() => {
    configApi.get().then(({ data }) => {
      if (data) setApprovalConfigs(data);
    });
  }, []);

  // Determine which leave types use single-level (1) approval
  const singleLevelLeaveTypeIds = new Set(
    approvalConfigs
      .filter((c) => c.approvalLevel === 1)
      .filter((c) => !approvalConfigs.some((c2) => c2.leaveTypeId === c.leaveTypeId && c2.approvalLevel === 2))
      .map((c) => c.leaveTypeId)
  );

  const visibleRequests = leaveRequests
    .filter((r) => {
      if (!user) return false;

      // GD.PGD sees: pending (1-level types) + approved_leader (2-level types)
      if (user.role === "quantri" || user.role === "GD.PGD") {
        if (r.status === "pending") {
          // Only show pending requests for 1-level types (where GD.PGD is level-1 approver)
          return singleLevelLeaveTypeIds.has(r.leaveTypeId);
        }
        if (r.status === "approved_leader") return true;
        return false;
      }

      // LD.PCM sees: pending requests from same department (not own)
      if (user.role === "LD.PCM") {
        if (r.status !== "pending") return false;
        if (r.userId === user.userId) return false;
        return r.donViId === user.donViId;
      }

      return false;
    })
    .filter((r) => !filterName || (r.userName || "").toLowerCase().includes(filterName.toLowerCase()));

  const handleApprove = async (id: number) => {
    const { error } = await leaveRequestsApi.approve(id);
    if (!error) { toast.success("Đã phê duyệt"); await loadData(); }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    const { error } = await leaveRequestsApi.reject(rejectId, rejectReason);
    if (!error) { toast.success("Đã từ chối"); setRejectId(null); setRejectReason(""); await loadData(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Phê duyệt đơn nghỉ phép</h2>
        <Input placeholder="Tìm theo tên..." value={filterName} onChange={(e) => setFilterName(e.target.value)} className="w-60" />
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
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead className="w-40">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRequests.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">Không có đơn chờ duyệt</TableCell></TableRow>
              ) : (
                visibleRequests.map((r, i) => {
                  const lt = leaveTypes.find((t) => t.id === r.leaveTypeId);
                  const dept = departments.find((d) => d.donViId === r.donViId);
                  return (
                    <TableRow key={r.id} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                      <TableCell className="text-center">{i + 1}</TableCell>
                      <TableCell className="font-medium">{r.userName}</TableCell>
                      <TableCell>{dept?.tenDonVi}</TableCell>
                      <TableCell>{lt?.name}</TableCell>
                      <TableCell>{formatDate(r.startDate)}</TableCell>
                      <TableCell>{formatDate(r.endDate)}</TableCell>
                      <TableCell className="text-center">{r.totalDays}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{r.reason}</TableCell>
                      <TableCell>{statusLabels[r.status] || r.status}</TableCell>
                      <TableCell>{formatDate(r.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" className="h-7 px-2 bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleApprove(r.id)}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                          </Button>
                          <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => setRejectId(r.id)}>
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
          <DialogHeader><DialogTitle>Từ chối đơn nghỉ phép</DialogTitle></DialogHeader>
          <Textarea placeholder="Lý do từ chối..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleReject}>Xác nhận từ chối</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailRequest} onOpenChange={() => setDetailRequest(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chi tiết đơn nghỉ phép</DialogTitle></DialogHeader>
          {detailRequest && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Họ tên:</span> <strong>{detailRequest.userName}</strong></div>
                <div><span className="text-muted-foreground">Loại phép:</span> {leaveTypes.find((t) => t.id === detailRequest.leaveTypeId)?.name}</div>
                <div><span className="text-muted-foreground">Số ngày:</span> {detailRequest.totalDays}</div>
                <div><span className="text-muted-foreground">Trạng thái:</span> {statusLabels[detailRequest.status] || detailRequest.status}</div>
                <div><span className="text-muted-foreground">Từ ngày:</span> {formatDate(detailRequest.startDate)}</div>
                <div><span className="text-muted-foreground">Đến ngày:</span> {formatDate(detailRequest.endDate)}</div>
              </div>
              <div><span className="text-muted-foreground">Lý do:</span> {detailRequest.reason}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalPage;