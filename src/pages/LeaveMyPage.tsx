import { useState } from "react";
import { useStore } from "@/store/useStore";
import { leaveTypeLabels, leaveStatusLabels, LeaveStatus, LeaveType } from "@/lib/leave-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Eye, Edit, XCircle, Send } from "lucide-react";

const statusColor: Record<LeaveStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning border-warning/30",
  approved: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
};

const LeaveMyPage = () => {
  const currentUser = useStore(s => s.currentUser);
  const leaveRequests = useStore(s => s.leaveRequests);
  const updateLeaveRequest = useStore(s => s.updateLeaveRequest);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const myRequests = leaveRequests
    .filter(r => r.employeeId === currentUser?.employeeId)
    .filter(r => filterStatus === "all" || r.status === filterStatus)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleCancel = (id: string) => {
    updateLeaveRequest(id, { status: "cancelled" });
    toast.success("Đã hủy đơn");
  };

  const handleSend = (id: string) => {
    updateLeaveRequest(id, { status: "pending" });
    toast.success("Đã gửi phê duyệt");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Danh sách đơn của tôi</h2>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {(Object.keys(leaveStatusLabels) as LeaveStatus[]).map(s => (
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
                <TableHead className="w-32">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myRequests.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Không có đơn nào</TableCell></TableRow>
              ) : myRequests.map((r, i) => (
                <TableRow key={r.id} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                  <TableCell className="text-center">{i + 1}</TableCell>
                  <TableCell>{leaveTypeLabels[r.type]}</TableCell>
                  <TableCell>{r.startDate}</TableCell>
                  <TableCell>{r.endDate}</TableCell>
                  <TableCell className="text-center">{r.days}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{r.reason}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[11px]", statusColor[r.status])}>
                      {leaveStatusLabels[r.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status === "draft" && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-accent" onClick={() => handleSend(r.id)}>
                          <Send className="h-3 w-3" />
                        </Button>
                      )}
                      {(r.status === "draft" || r.status === "pending") && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => handleCancel(r.id)}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveMyPage;
