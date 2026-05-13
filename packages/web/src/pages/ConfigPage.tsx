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
import { roleLabels, type UserRole } from "@/lib/leave-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Save } from "lucide-react";

interface ApprovalConfigRow {
  id: string;
  leave_type_id: string;
  approval_level: number;
  approver_role: UserRole;
}

interface LeaveConfigRow {
  id: string;
  config_key: string;
  config_value: string;
  description: string | null;
}

const ConfigPage = () => {
  const currentUser = useStore((s) => s.currentUser);
  const leaveTypes = useStore((s) => s.leaveTypes);
  const loadData = useStore((s) => s.loadData);
  const isAdmin = currentUser?.role === "QTHT";

  // Leave types editing
  const [editingType, setEditingType] = useState<any | null>(null);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);

  // Approval config
  const [approvalConfigs, setApprovalConfigs] = useState<ApprovalConfigRow[]>([]);
  const [editingApproval, setEditingApproval] = useState<Partial<ApprovalConfigRow> | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  // Leave config (cycle, default days per role)
  const [leaveConfigs, setLeaveConfigs] = useState<LeaveConfigRow[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);

  // Default days per role state
  const [defaultDaysByRole, setDefaultDaysByRole] = useState<Record<string, string>>({
    "CB.PCM": "12",
    "LD.PCM": "14",
    "GD.PGD": "16",
    "QTHT": "12",
  });
  const [leaveCycle, setLeaveCycle] = useState("yearly");

  useEffect(() => {
    loadApprovalConfigs();
    loadLeaveConfigs();
  }, []);

  const loadApprovalConfigs = async () => {
    const { data } = await supabase.from("approval_config").select("*").order("leave_type_id").order("approval_level");
    if (data) setApprovalConfigs(data as ApprovalConfigRow[]);
  };

  const loadLeaveConfigs = async () => {
    const { data } = await supabase.from("leave_config").select("*");
    if (data) {
      setLeaveConfigs(data as LeaveConfigRow[]);
      const cycleConfig = data.find((c: any) => c.config_key === "leave_cycle");
      if (cycleConfig) setLeaveCycle((cycleConfig as any).config_value);

      const roles: UserRole[] = ["CB.PCM", "LD.PCM", "GD.PGD", "QTHT"];
      const newDays: Record<string, string> = { ...defaultDaysByRole };
      roles.forEach((role) => {
        const cfg = data.find((c: any) => c.config_key === `default_days_${role}`);
        if (cfg) newDays[role] = (cfg as any).config_value;
      });
      setDefaultDaysByRole(newDays);
    }
  };

  // ---- Leave Type CRUD ----
  const openTypeDialog = (lt?: any) => {
    setEditingType(lt ? { ...lt } : { name: "", code: "", default_days: 12, description: "", is_active: true });
    setTypeDialogOpen(true);
  };

  const saveLeaveType = async () => {
    if (!editingType) return;
    const { id, created_at, ...payload } = editingType;
    if (id) {
      const { error } = await supabase.from("leave_types").update(payload).eq("id", id);
      if (error) { toast.error("Lỗi cập nhật loại phép"); return; }
      toast.success("Đã cập nhật loại phép");
    } else {
      const { error } = await supabase.from("leave_types").insert(payload);
      if (error) { toast.error("Lỗi tạo loại phép"); return; }
      toast.success("Đã tạo loại phép mới");
    }
    setTypeDialogOpen(false);
    await loadData();
  };

  const toggleLeaveType = async (id: string, currentActive: boolean) => {
    await supabase.from("leave_types").update({ is_active: !currentActive }).eq("id", id);
    await loadData();
    toast.success(!currentActive ? "Đã kích hoạt loại phép" : "Đã tắt loại phép");
  };

  // ---- Approval Config CRUD ----
  const openApprovalDialog = (row?: ApprovalConfigRow) => {
    setEditingApproval(row ? { ...row } : { leave_type_id: leaveTypes[0]?.id || "", approval_level: 1, approver_role: "LD.PCM" as UserRole });
    setApprovalDialogOpen(true);
  };

  const saveApprovalConfig = async () => {
    if (!editingApproval) return;
    const { id, ...payload } = editingApproval;
    if (id) {
      const { error } = await supabase.from("approval_config").update(payload).eq("id", id);
      if (error) { toast.error("Lỗi cập nhật"); return; }
    } else {
      const { error } = await supabase.from("approval_config").insert(payload as any);
      if (error) { toast.error("Lỗi tạo mới"); return; }
    }
    toast.success("Đã lưu cấu hình phê duyệt");
    setApprovalDialogOpen(false);
    loadApprovalConfigs();
  };

  const deleteApprovalConfig = async (id: string) => {
    await supabase.from("approval_config").delete().eq("id", id);
    toast.success("Đã xóa");
    loadApprovalConfigs();
  };

  // ---- General Config Save ----
  const saveGeneralConfig = async () => {
    setSavingConfig(true);
    const upserts: { config_key: string; config_value: string; description: string }[] = [
      { config_key: "leave_cycle", config_value: leaveCycle, description: "Chu kỳ tính phép" },
    ];
    const roles: UserRole[] = ["CB.PCM", "LD.PCM", "GD.PGD", "QTHT"];
    roles.forEach((role) => {
      upserts.push({
        config_key: `default_days_${role}`,
        config_value: defaultDaysByRole[role] || "12",
        description: `Số ngày phép mặc định cho ${roleLabels[role]}`,
      });
    });

    for (const item of upserts) {
      const existing = leaveConfigs.find((c) => c.config_key === item.config_key);
      if (existing) {
        await supabase.from("leave_config").update({ config_value: item.config_value }).eq("id", existing.id);
      } else {
        await supabase.from("leave_config").insert(item);
      }
    }
    toast.success("Đã lưu cấu hình chung");
    await loadLeaveConfigs();
    setSavingConfig(false);
  };

  // All leave types (including inactive) for config
  const [allLeaveTypes, setAllLeaveTypes] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("leave_types").select("*").order("code").then(({ data }) => {
      if (data) setAllLeaveTypes(data);
    });
  }, [leaveTypes]);

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
              <CardTitle className="text-sm">Chu kỳ tính phép & Số ngày phép mặc định</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Chu kỳ tính phép</Label>
                <Select value={leaveCycle} onValueChange={setLeaveCycle} disabled={!isAdmin}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">Theo năm</SelectItem>
                    <SelectItem value="monthly">Theo tháng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Số ngày phép năm mặc định theo loại nhân viên</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(["CB.PCM", "LD.PCM", "GD.PGD", "QTHT"] as UserRole[]).map((role) => (
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
                      <TableCell className="text-center">{lt.default_days}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{lt.description}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={lt.is_active}
                          onCheckedChange={() => toggleLeaveType(lt.id, lt.is_active)}
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
                      const lt = allLeaveTypes.find((t) => t.id === ac.leave_type_id);
                      return (
                        <TableRow key={ac.id}>
                          <TableCell className="font-medium">{lt?.name || "—"}</TableCell>
                          <TableCell className="text-center">{ac.approval_level}</TableCell>
                          <TableCell>{roleLabels[ac.approver_role as UserRole] || ac.approver_role}</TableCell>
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
                <Input type="number" min={0} value={editingType.default_days} onChange={(e) => setEditingType({ ...editingType, default_days: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label className="text-xs">Mô tả</Label>
                <Input value={editingType.description || ""} onChange={(e) => setEditingType({ ...editingType, description: e.target.value })} />
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
                <Select value={editingApproval.leave_type_id} onValueChange={(v) => setEditingApproval({ ...editingApproval, leave_type_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allLeaveTypes.map((lt) => (
                      <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Cấp duyệt (1, 2, 3...)</Label>
                <Input type="number" min={1} value={editingApproval.approval_level || 1} onChange={(e) => setEditingApproval({ ...editingApproval, approval_level: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label className="text-xs">Vai trò duyệt</Label>
                <Select value={editingApproval.approver_role} onValueChange={(v) => setEditingApproval({ ...editingApproval, approver_role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["LD.PCM", "GD.PGD", "QTHT"] as UserRole[]).map((role) => (
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
