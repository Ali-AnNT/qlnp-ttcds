import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { roleLabels, type UserRole, AppRoles } from "@/features/shared-reference-data";
import { LeaveTypeDto } from "../api/types";

export interface ApprovalConfigEdit {
  id?: number;
  leaveTypeId: number;
  approvalLevel: number;
  approverRole: UserRole;
}

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingApproval: ApprovalConfigEdit | null;
  onSetEditingApproval: (config: ApprovalConfigEdit) => void;
  leaveTypes: LeaveTypeDto[];
  onSave: () => void;
}

export const ApprovalDialog = ({
  open,
  onOpenChange,
  editingApproval,
  onSetEditingApproval,
  leaveTypes,
  onSave,
}: ApprovalDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingApproval?.id ? "Sửa cấp duyệt" : "Thêm cấp duyệt"}</DialogTitle>
        </DialogHeader>
        {editingApproval && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Loại phép</Label>
              <Select
                value={String(editingApproval.leaveTypeId)}
                onValueChange={(v) =>
                  onSetEditingApproval({ ...editingApproval, leaveTypeId: Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={String(lt.id)}>
                      {lt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Cấp duyệt</Label>
              <Select
                value={String(editingApproval.approvalLevel)}
                onValueChange={(v) =>
                  onSetEditingApproval({
                    ...editingApproval,
                    approvalLevel: parseInt(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <SelectItem key={level} value={String(level)}>
                      Cấp {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Vai trò duyệt</Label>
              <Select
                value={editingApproval.approverRole}
                onValueChange={(v) =>
                  onSetEditingApproval({
                    ...editingApproval,
                    approverRole: v as UserRole,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {([AppRoles.Leader, AppRoles.Director, AppRoles.Admin] as UserRole[]).map(
                    (role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onSave}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
