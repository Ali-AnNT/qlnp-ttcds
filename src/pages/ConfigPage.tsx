import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { roleLabels } from "@/lib/leave-data";
import type { UserRole, LeaveType } from "@/lib/leave-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Save, X, Plus, Trash2 } from "lucide-react";

interface ApprovalConfig {
  id: string;
  leave_type_id: string;
  approval_level: number;
  approver_role: UserRole;
}

const ConfigPage = () => {
  const currentUser = useStore((s) => s.currentUser);
  const leaveTypes = useStore((s) => s.leaveTypes);
  const loadData = useStore((s) => s.loadData);
  const isAdmin = currentUser?.role === "QTHT";

  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<LeaveType>>({});
  const [approvalConfigs, setApprovalConfigs] = useState<ApprovalConfig[]>([]);
  const [leaveConfig, setLeaveConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadApprovalConfigs();
    loadLeaveConfig();
  }, []);

  const loadApprovalConfigs = async () => {
    const { data } = await supabase.from("approval_config").select("*").order("approval_level");
    if (data) setApprovalConfigs(data as unknown as ApprovalConfig[]);
  };

  const loadLeaveConfig = async () => {
    const { data } = await supabase.from("leave_config").select("*");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((c: any) => { map[c.config_key] = c.config_value; });
      setLeaveConfig(map);
    }
  };

  // --- Leave Type editing ---
  const startEdit = (lt: LeaveType) => {
    setEditingTypeId(lt.id);
    setEditValues({ default_days: lt.default_days, is_active: lt.is_active, description: lt.description });
  };

  const cancelEdit = () => { setEditingTypeId(null); setEditValues({}); };

  const saveLeaveType = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from("leave_types").update(editValues as any).eq("id", id);
    setSaving(false);
    if (error) { toast.error("Lỗi khi lưu"); return; }
    toast.success("Đã cập nhật loại phép");
    setEditingTypeId(null);
    await loadData();
  };

  // --- Leave cycle config ---
  const updateLeaveCycle = async (value: string) => {
    const { error } = await supabase.from("leave_config").update({ config_value: value } as any).eq("config_key", "leave_cycle");
    if (error) {
      // Try insert if not exists
      await supabase.from("leave_config").insert({ config_key: "leave_cycle", config_value: value } as any);
    }
    setLeaveConfig((prev) => ({ ...prev, leave_cycle: value }));
    toast.success("Đã cập nhật chu kỳ tính phép");
  };

  // --- Approval config ---
  const addApprovalLevel = async (leaveTypeId: string) => {
    const existing = approvalConfigs.filter((a) => a.leave_type_id === leaveTypeId);
    const nextLevel = existing.length > 0 ? Math.max(...existing.map((a) => a.approval_level)) + 1 : 1;
    const { error } = await supabase.from("approval_config").insert({
      leave_type_id: leaveTypeId,
      approval_level: nextLevel,
      approver_role: "LD.PCM",
    } as any);
    if (error) { toast.error("Lỗi thêm cấp duyệt"); return; }
    toast.success("Đã thêm cấp phê duyệt");
    await loadApprovalConfigs();
  };

  const updateApprovalRole = async (id: string, role: string) => {
    await supabase.from("approval_config").update({ approver_role: role } as any).eq("id", id);
    toast.success("Đã cập nhật");
    await loadApprovalConfigs();
  };

  const deleteApprovalLevel = async (id: string) => {
    await supabase.from("approval_config").delete().eq("id", id);
    toast.success("Đã xóa cấp phê duyệt");
    await loadApprovalConfigs();
  };

  const approverRoles: UserRole[] = ["LD.PCM", "GD.PGD"];

  return (
    <div className="space-y-4 max-w-4xl">
      <h2 className="text-lg font-bold">Cấu hình quy định nghỉ phép</h2>

      <Tabs defaultValue="types">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="types" className="text-xs">Loại phép</TabsTrigger>
          <TabsTrigger value="cycle" className="text-xs">Chu kỳ tính phép</TabsTrigger>
          <TabsTrigger value="approval" className="text-xs">Cấp phê duyệt</TabsTrigger>
        </TabsList>

        {/* Tab 1: Leave Types */}
        <TabsContent value="types">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Danh sách loại phép</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tên loại phép</TableHead>
                    <TableHead>Mã</TableHead>
                    <TableHead className="text-center">Số ngày mặc định</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    {isAdmin && <TableHead className="text-center">Thao tác</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.map((lt) => (
                    <TableRow key={lt.id}>
                      <TableCell className="font-medium">{lt.name}</TableCell>
                      <TableCell>{lt.code}</TableCell>
                      <TableCell className="text-center">
                        {editingTypeId === lt.id ? (
                          <Input
                            type="number"
                            className="w-20 mx-auto"
                            value={editValues.default_days ?? ""}
                            onChange={(e) => setEditValues((v) => ({ ...v, default_days: Number(e.target.value) }))}
                          />
                        ) : lt.default_days}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {editingTypeId === lt.id ? (
                          <Input
                            value={editValues.description ?? ""}
                            onChange={(e) => setEditValues((v) => ({ ...v, description: e.target.value }))}
                          />
                        ) : lt.description}
                      </TableCell>
                      <TableCell className="text-center">
                        {editingTypeId === lt.id ? (
                          <Switch
                            checked={editValues.is_active ?? true}
                            onCheckedChange={(c) => setEditValues((v) => ({ ...v, is_active: c }))}
                          />
                        ) : (
                          <Badge variant={lt.is_active ? "default" : "secondary"}>
                            {lt.is_active ? "Hoạt động" : "Tắt"}
                          </Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-center">
                          {editingTypeId === lt.id ? (
                            <div className="flex gap-1 justify-center">
                              <Button size="sm" variant="ghost" disabled={saving} onClick={() => saveLeaveType(lt.id)}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => startEdit(lt)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Leave Cycle */}
        <TabsContent value="cycle">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Chu kỳ tính phép</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium min-w-[120px]">Chu kỳ tính phép:</span>
                {isAdmin ? (
                  <Select value={leaveConfig.leave_cycle || "yearly"} onValueChange={updateLeaveCycle}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yearly">Theo năm</SelectItem>
                      <SelectItem value="monthly">Theo tháng</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">
                    {leaveConfig.leave_cycle === "monthly" ? "Theo tháng" : "Theo năm"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {leaveConfig.leave_cycle === "monthly"
                  ? "Phép được tính và cộng dồn hàng tháng."
                  : "Phép được cấp toàn bộ vào đầu năm."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Approval Config */}
        <TabsContent value="approval">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cấu hình cấp phê duyệt theo loại phép</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {leaveTypes.map((lt) => {
                const levels = approvalConfigs
                  .filter((a) => a.leave_type_id === lt.id)
                  .sort((a, b) => a.approval_level - b.approval_level);
                return (
                  <div key={lt.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{lt.name} ({lt.code})</span>
                      {isAdmin && (
                        <Button size="sm" variant="outline" onClick={() => addApprovalLevel(lt.id)}>
                          <Plus className="h-3 w-3 mr-1" /> Thêm cấp
                        </Button>
                      )}
                    </div>
                    {levels.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Chưa cấu hình cấp phê duyệt</p>
                    ) : (
                      <div className="space-y-2">
                        {levels.map((lvl) => (
                          <div key={lvl.id} className="flex items-center gap-3 text-sm">
                            <Badge variant="outline" className="min-w-[70px] justify-center">
                              Cấp {lvl.approval_level}
                            </Badge>
                            {isAdmin ? (
                              <>
                                <Select value={lvl.approver_role} onValueChange={(v) => updateApprovalRole(lvl.id, v)}>
                                  <SelectTrigger className="w-[240px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {approverRoles.map((r) => (
                                      <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteApprovalLevel(lvl.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <span>{roleLabels[lvl.approver_role]}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigPage;
