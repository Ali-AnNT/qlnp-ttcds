import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export interface LeaveTypeEdit {
  id?: number;
  name: string;
  code: string;
  defaultDays: number;
  description: string;
  isActive: boolean;
}

interface LeaveTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingType: LeaveTypeEdit | null;
  onSetEditingType: (type: LeaveTypeEdit) => void;
  onSave: () => void;
}

export const LeaveTypeDialog = ({
  open,
  onOpenChange,
  editingType,
  onSetEditingType,
  onSave,
}: LeaveTypeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingType?.id ? "Sửa loại phép" : "Thêm loại phép"}</DialogTitle>
        </DialogHeader>
        {editingType && (
          <div className="lma-space-y-3">
            <div>
              <Label className="lma-text-xs">Tên loại phép</Label>
              <Input
                value={editingType.name}
                onChange={(e) => onSetEditingType({ ...editingType, name: e.target.value })}
              />
            </div>
            <div>
              <Label className="lma-text-xs">Mã</Label>
              <Input
                value={editingType.code}
                onChange={(e) => onSetEditingType({ ...editingType, code: e.target.value })}
              />
            </div>
            <div>
              <Label className="lma-text-xs">Số ngày mặc định</Label>
              <Input
                type="number"
                min={0}
                value={editingType.defaultDays}
                onChange={(e) =>
                  onSetEditingType({
                    ...editingType,
                    defaultDays: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label className="lma-text-xs">Mô tả</Label>
              <Input
                value={editingType.description}
                onChange={(e) =>
                  onSetEditingType({ ...editingType, description: e.target.value })
                }
              />
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
