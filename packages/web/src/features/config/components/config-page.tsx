import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useAuth } from "@/features/auth";
import { AppRoles, type UserRole } from "@/features/shared-reference-data";
import { useLeaveTypes } from "../hooks/use-leave-types";
import { useApprovalConfig } from "../hooks/use-approval-config";
import { useSystemConfigs } from "../hooks/use-system-configs";
import { GeneralSettings } from "./general-settings";
import { DefaultDaysSettings } from "./default-days-settings";
import { LeaveTypeManager } from "./leave-type-manager";
import { ApprovalFlowManager } from "./approval-flow-manager";
import { LeaveTypeDialog, type LeaveTypeEdit } from "./leave-type-dialog";
import { ApprovalDialog, type ApprovalConfigEdit } from "./approval-dialog";
import { ConfigDto, LeaveTypeDto, SystemConfigDto } from "../api/types";

export const ConfigPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === AppRoles.Admin;

  const {
    leaveTypes,
    createLeaveType,
    updateLeaveType,
    toggleLeaveType,
  } = useLeaveTypes();

  const {
    approvalConfigs,
    updateApprovalConfigs,
  } = useApprovalConfig();

  const {
    systemConfigs: remoteSystemConfigs,
    updateSystemConfigs,
  } = useSystemConfigs();

  // Local state for system configs (dirty state)
  const [localSystemConfigs, setLocalSystemConfigs] = useState<SystemConfigDto[]>([]);
  const [isSavingSystemConfigs, setIsSavingSystemConfigs] = useState(false);

  useEffect(() => {
    if (remoteSystemConfigs.length > 0) {
      setLocalSystemConfigs(remoteSystemConfigs);
    }
  }, [remoteSystemConfigs]);

  const handleSystemConfigChange = (key: string, value: string) => {
    setLocalSystemConfigs((prev) => {
      const existing = prev.find((c) => c.configKey === key);
      if (existing) return prev.map((c) => c.configKey === key ? { ...c, configValue: value } : c);
      return [...prev, { id: 0, configKey: key, configValue: value, description: null, updatedAt: new Date().toISOString() }];
    });
  };

  const handleRoleDefaultDaysChange = (role: string, value: string) => {
    const suffix = role.replace("QLNP.", "");
    const key = `default_days_${suffix}`;
    handleSystemConfigChange(key, value);
  };

  const handleSaveSystemConfigs = async () => {
    setIsSavingSystemConfigs(true);
    try {
      await updateSystemConfigs(localSystemConfigs);
    } finally {
      setIsSavingSystemConfigs(false);
    }
  };

  // Leave Type Dialog
  const [editingType, setEditingType] = useState<LeaveTypeEdit | null>(null);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);

  const handleAddLeaveType = () => {
    setEditingType({ name: "", code: "", defaultDays: 12, description: "", isActive: true });
    setTypeDialogOpen(true);
  };

  const handleEditLeaveType = (lt: LeaveTypeDto) => {
    setEditingType({
      id: lt.id,
      name: lt.name,
      code: lt.code,
      defaultDays: lt.defaultDays,
      description: lt.description || "",
      isActive: lt.isActive,
    });
    setTypeDialogOpen(true);
  };

  const handleSaveLeaveType = async () => {
    if (!editingType) return;
    const { id, ...payload } = editingType;
    if (id) {
      await updateLeaveType({ id, data: payload });
    } else {
      await createLeaveType(payload);
    }
    setTypeDialogOpen(false);
  };

  // Approval Config Dialog
  const [editingApproval, setEditingApproval] = useState<ApprovalConfigEdit | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  const handleAddApproval = () => {
    setEditingApproval({
      leaveTypeId: leaveTypes[0]?.id || 0,
      approvalLevel: 1,
      approverRole: AppRoles.Leader as UserRole,
    });
    setApprovalDialogOpen(true);
  };

  const handleEditApproval = (config: ConfigDto) => {
    setEditingApproval({
      id: config.id,
      leaveTypeId: config.leaveTypeId,
      approvalLevel: config.approvalLevel,
      approverRole: config.approverRole as UserRole,
    });
    setApprovalDialogOpen(true);
  };

  const handleSaveApproval = async () => {
    if (!editingApproval) return;
    const { id, ...payload } = editingApproval;
    let updatedConfigs: ConfigDto[];
    if (id) {
      updatedConfigs = approvalConfigs.map((c) =>
        c.id === id ? { ...c, ...payload } : c
      );
    } else {
      updatedConfigs = [...approvalConfigs, { id: 0, ...payload }];
    }
    await updateApprovalConfigs(updatedConfigs);
    setApprovalDialogOpen(false);
  };

  const handleDeleteApproval = async (id: number) => {
    const filtered = approvalConfigs.filter((c) => c.id !== id);
    await updateApprovalConfigs(filtered);
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <h2 className="text-lg font-bold">Cấu hình quy định nghỉ phép</h2>
      {!isAdmin && (
        <p className="text-sm text-muted-foreground">
          Bạn chỉ có quyền xem. Liên hệ QTHT để thay đổi cấu hình.
        </p>
      )}
      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="general" className="text-xs">Cấu hình chung</TabsTrigger>
          <TabsTrigger value="types" className="text-xs">Loại phép</TabsTrigger>
          <TabsTrigger value="approval" className="text-xs">Cấp phê duyệt</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralSettings
            configs={localSystemConfigs}
            onChange={handleSystemConfigChange}
            isAdmin={isAdmin}
          />
          <DefaultDaysSettings
            configs={localSystemConfigs}
            onChange={handleRoleDefaultDaysChange}
            onSave={handleSaveSystemConfigs}
            isAdmin={isAdmin}
            isSaving={isSavingSystemConfigs}
          />
        </TabsContent>

        <TabsContent value="types">
          <LeaveTypeManager
            leaveTypes={leaveTypes}
            onAdd={handleAddLeaveType}
            onEdit={handleEditLeaveType}
            onToggle={(id, isActive) => toggleLeaveType({ id, isActive: !isActive })}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="approval">
          <ApprovalFlowManager
            approvalConfigs={approvalConfigs}
            leaveTypes={leaveTypes}
            onAdd={handleAddApproval}
            onEdit={handleEditApproval}
            onDelete={handleDeleteApproval}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>

      <LeaveTypeDialog
        open={typeDialogOpen}
        onOpenChange={setTypeDialogOpen}
        editingType={editingType}
        onSetEditingType={setEditingType}
        onSave={handleSaveLeaveType}
      />

      <ApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        editingApproval={editingApproval}
        onSetEditingApproval={setEditingApproval}
        leaveTypes={leaveTypes}
        onSave={handleSaveApproval}
      />
    </div>
  );
};
