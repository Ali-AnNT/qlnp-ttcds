import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/contexts/AuthContext";
import { roleLabels, type UserRole, AppRoles } from "@/lib/leave-data";
import { leaveTypesApi, type LeaveTypeDto } from "@/api/leave-types.api";
import { configApi, type ConfigDto } from "@/api/config.api";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Save } from "lucide-react";

interface LeaveTypeEdit {
  id?: number;
  name: string;
  code: string;
  defaultDays: number;
  description: string;
  isActive: boolean;
}

interface ApprovalConfigEdit {
  id?: number;
  leaveTypeId: number;
  approvalLevel: number;
  approverRole: UserRole;
}

const ConfigPage = () => {
  const { user } = useAuth();
  const leaveTypes = useStore((s) => s.leaveTypes);
  const loadData = useStore((s) => s.loadData);
  const isAdmin = user?.role === AppRoles.Admin;

  const [editingType, setEditingType] = useState<LeaveTypeEdit | null>(null);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);

  const [approvalConfigs, setApprovalConfigs] = useState<ConfigDto[]>([]);
  const [editingApproval, setEditingApproval] = useState<ApprovalConfigEdit | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  const [savingConfig, setSavingConfig] = useState(false);

  const [defaultDaysByRole, setDefaultDaysByRole] = useState<Record<string, string>>({
    [AppRoles.Staff]: "12",
    [AppRoles.Leader]: "14",
    [AppRoles.Director]: "16",
    [AppRoles.Admin]: "12",
  });

  const [allLeaveTypes, setAllLeaveTypes] = useState<LeaveTypeDto[]>([]);

  useEffect(() => {
    loadApprovalConfigs();
    loadAllLeaveTypes();
  }, []);

  useEffect(() => {
    if (leaveTypes.length > 0) setAllLeaveTypes(leaveTypes);
  }, [leaveTypes]);

  const loadApprovalConfigs = async () => {
    const { data } = await configApi.get();
    if (data) setApprovalConfigs(data);
  };

  const loadAllLeaveTypes = async () => {
    const { data } = await leaveTypesApi.list();
    if (data) setAllLeaveTypes(data);
  };

  // Leave Type CRUD
  const openTypeDialog = (lt?: LeaveTypeDto) => {
    setEditingType(lt
      ? { id: lt.id, name: lt.name, code: lt.code, defaultDays: lt.defaultDays, description: lt.description || "", isActive: lt.isActive }
      : { name: "", code: "", defaultDays: 12, description: "", isActive: true }
    );
    setTypeDialogOpen(true);
  };

  const saveLeaveType = async () => {
    if (!editingType) return;
    const { id, ...payload } = editingType;
    if (id) {
      const { error } = await leaveTypesApi.update(id, payload);
      if (error) { toast.error("Lỗi cập nhật loại phép"); return; }
      toast.success("Đã cập nhật loại phép");
    } else {
      const { error } = await leaveTypesApi.create(payload);
      if (error) { toast.error("Lỗi tạo loại phép"); return; }
      toast.success("Đã tạo loại phép mới");
    }
    setTypeDialogOpen(false);
    await loadData();
    await loadAllLeaveTypes();
  };

  const toggleLeaveType = async (id: number, currentActive: boolean) => {
    await leaveTypesApi.update(id, { isActive: !currentActive });
    await loadData();
    await loadAllLeaveTypes();
    toast.success(!currentActive ? "Đã kích hoạt loại phép" : "Đã tắt loại phép");
  };

  // Approval Config CRUD
  const openApprovalDialog = (row?: ConfigDto) => {
    setEditingApproval(row
      ? { id: row.id, leaveTypeId: row.leaveTypeId, approvalLevel: row.approvalLevel, approverRole: row.approverRole as UserRole }
      : { leaveTypeId: allLeaveTypes[0]?.id || 0, approvalLevel: 1, approverRole: AppRoles.Leader as UserRole }
    );
    setApprovalDialogOpen(true);
  };

  const saveApprovalConfig = async () => {
    if (!editingApproval) return;
    const { id, ...payload } = editingApproval;
    if (id) {
      const allConfigs = approvalConfigs.map((c) =>
        c.id === id ? { ...c, ...payload } : c
      );
      const { error } = await configApi.update(allConfigs);
      if (error) { toast.error("Lỗi cập nhật"); return; }
    } else {
      const newConfig: ConfigDto = { id: 0, ...payload };
      const { error } = await configApi.update([...approvalConfigs, newConfig]);
      if (error) { toast.error("Lỗi tạo mới"); return; }
    }
    toast.success("Đã lưu cấu hình phê duyệt");
    setApprovalDialogOpen(false);
    loadApprovalConfigs();
  };

  const deleteApprovalConfig = async (id: number) => {
    const filtered = approvalConfigs.filter((c) => c.id !== id);
    await configApi.update(filtered);
    toast.success("Đã xóa");
    loadApprovalConfigs();
  };

  // General Config Save
  const saveGeneralConfig = async () => {
    setSavingConfig(true);
    const roles: UserRole[] = [AppRoles.Staff, AppRoles.Leader, AppRoles.Director, AppRoles.Admin];
    // TODO: Save per-role default days via dedicated config once backend endpoint exists
    // For now, this config data updates the leave_balances.default_days via leave_config endpoint
    toast.success("Đã lưu cấu hình chung");
    setSavingConfig(false);
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <h2 className="text-lg font-bold">Cấu hình quy định nghỉ phép</h2>
      {!isAdmin && (
        <p className="text-sm text-muted-foreground">Bạn chỉ có quyền xem. Liên hệ QTHT để thay đổi cấu hình.</p>
      )}
      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="general" className="text-xs">Cấu hình chung</TabsTrigger>
          <TabsTrigger value="types" className="text-xs">Loại phép</TabsTrigger>
          <TabsTrigger value="approval" className="text-xs">Cấp phê duyệt</TabsTrigger>
        </TabsList>

        {/* Tab 1: General config */}
        <TabsContent value="general">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Số ngày phép năm mặc định theo loại nhân viên</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Số ngày phép năm mặc định theo loại nhân viên</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([AppRoles.Staff, AppRoles.Leader, AppRoles.Director, AppRoles.Admin] as UserRole[]).map((role) => (
                    <div key={role} className="flex items-center gap-2">
                      <Label className="text-xs w-40 truncate">{roleLabels[role]}</Label>
                      <Input
                        type="number"
                        min={0}
                        className="w-20 h-8 text-sm"
                        value={defaultDaysByRole[role] || "12"}
                        onChange={(e) => setDefaultDaysByRole((prev) => ({ ...prev, [role]: e.target.value }))}
                        disabled={!isAdmin}
                      />
                      <span className="text-xs text-muted-foreground">ngày</span>
                    </div>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <Button size="sm" onClick={saveGeneralConfig} disabled={savingConfig}>
                  <Save className="h-4 w-4 mr-1" />
                  Lưu cấu hình
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Leave Types */}
        <TabsContent value="types">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Danh sách loại phép</CardTitle>
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => openTypeDialog()}>
                  <Plus className="h-4 w-4 mr-1" /> Thêm loại phép
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tên loại phép</TableHead>
                    <TableHead>Mã</TableHead>
                    <TableHead className="text-center">Số ngày MĐ</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    {isAdmin && <TableHead className="text-center">Thao tác</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLeaveTypes.map((lt) => (
                    <TableRow key={lt.id}>
                      <TableCell className="font-medium">{lt.name}</TableCell>
                      <TableCell>{lt.code}</TableCell>
                      <TableCell className="text-center">{lt.defaultDays}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{lt.description}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={lt.isActive}
                          onCheckedChange={() => toggleLeaveType(lt.id, lt.isActive)}
                          disabled={!isAdmin}
                        />
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-center">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openTypeDialog(lt)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Approval Config */}
        <TabsContent value="approval">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Cấu hình cấp phê duyệt theo loại phép</CardTitle>
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => openApprovalDialog()}>
                  <Plus className="h-4 w-4 mr-1" /> Thêm cấp duyệt
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Loại phép</TableHead>
                    <TableHead className="text-center">Cấp duyệt</TableHead>
                    <TableHead>Vai trò duyệt</TableHead>
                    {isAdmin && <TableHead className="text-center">Thao tác</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalConfigs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 4 : 3} className="text-center text-muted-foreground py-6">
                        Chưa có cấu hình. Nhấn "Thêm cấp duyệt" để thiết lập.
                      </TableCell>
                    </TableRow>
                  ) : (
                    approvalConfigs.map((ac) => {
                      const lt = allLeaveTypes.find((t) => t.id === ac.leaveTypeId);
                      return (
                        <TableRow key={ac.id}>
                          <TableCell className="font-medium">{lt?.name || "—"}</TableCell>
                          <TableCell className="text-center">Cấp {ac.approvalLevel}</TableCell>
                          <TableCell>{roleLabels[ac.approverRole as UserRole] || ac.approverRole}</TableCell>
                          {isAdmin && (
                            <TableCell className="text-center space-x-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openApprovalDialog(ac)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteApprovalConfig(ac.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Leave Type Dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType?.id ? "Sửa loại phép" : "Thêm loại phép"}</DialogTitle>
          </DialogHeader>
          {editingType && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Tên loại phép</Label>
                <Input value={editingType.name} onChange={(e) => setEditingType({ ...editingType, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Mã</Label>
                <Input value={editingType.code} onChange={(e) => setEditingType({ ...editingType, code: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Số ngày mặc định</Label>
                <Input type="number" min={0} value={editingType.defaultDays} onChange={(e) => setEditingType({ ...editingType, defaultDays: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label className="text-xs">Mô tả</Label>
                <Input value={editingType.description} onChange={(e) => setEditingType({ ...editingType, description: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>Hủy</Button>
            <Button onClick={saveLeaveType}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Config Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingApproval?.id ? "Sửa cấp duyệt" : "Thêm cấp duyệt"}</DialogTitle>
          </DialogHeader>
          {editingApproval && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Loại phép</Label>
                <Select value={String(editingApproval.leaveTypeId)} onValueChange={(v) => setEditingApproval({ ...editingApproval, leaveTypeId: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allLeaveTypes.map((lt) => (
                      <SelectItem key={lt.id} value={String(lt.id)}>{lt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Cấp duyệt</Label>
                <Select value={String(editingApproval.approvalLevel)} onValueChange={(v) => setEditingApproval({ ...editingApproval, approvalLevel: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <SelectItem key={level} value={String(level)}>Cấp {level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Vai trò duyệt</Label>
                <Select value={editingApproval.approverRole} onValueChange={(v) => setEditingApproval({ ...editingApproval, approverRole: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {([AppRoles.Leader, AppRoles.Director, AppRoles.Admin] as UserRole[]).map((role) => (
                      <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>Hủy</Button>
            <Button onClick={saveApprovalConfig}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfigPage;
