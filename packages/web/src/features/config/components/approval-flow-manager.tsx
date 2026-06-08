import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { roleLabels, type UserRole } from "@/features/shared-reference-data";
import { ConfigDto, LeaveTypeDto } from "../api/types";

interface ApprovalFlowManagerProps {
  approvalConfigs: ConfigDto[];
  leaveTypes: LeaveTypeDto[];
  onAdd: () => void;
  onEdit: (config: ConfigDto) => void;
  onDelete: (id: number) => void;
  isAdmin: boolean;
}

export const ApprovalFlowManager = ({
  approvalConfigs,
  leaveTypes,
  onAdd,
  onEdit,
  onDelete,
  isAdmin,
}: ApprovalFlowManagerProps) => {
  return (
    <Card>
      <CardHeader className="lma-pb-2 lma-flex lma-flex-row lma-items-center lma-justify-between">
        <CardTitle className="lma-text-sm">Cấu hình cấp phê duyệt theo loại phép</CardTitle>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="lma-h-4 lma-w-4 lma-mr-1" /> Thêm cấp duyệt
          </Button>
        )}
      </CardHeader>
      <CardContent className="lma-p-0">
        <Table>
          <TableHeader>
            <TableRow className="lma-bg-muted/50">
              <TableHead>Loại phép</TableHead>
              <TableHead className="lma-text-center">Cấp duyệt</TableHead>
              <TableHead>Vai trò duyệt</TableHead>
              {isAdmin && <TableHead className="lma-text-center">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvalConfigs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 4 : 3}
                  className="lma-text-center lma-text-muted-foreground lma-py-6"
                >
                  Chưa có cấu hình. Nhấn "Thêm cấp duyệt" để thiết lập.
                </TableCell>
              </TableRow>
            ) : (
              approvalConfigs.map((ac) => {
                const lt = leaveTypes.find((t) => t.id === ac.leaveTypeId);
                return (
                  <TableRow key={ac.id}>
                    <TableCell className="lma-font-medium">{lt?.name || "—"}</TableCell>
                    <TableCell className="lma-text-center">Cấp {ac.approvalLevel}</TableCell>
                    <TableCell>
                      {roleLabels[ac.approverRole as UserRole] || ac.approverRole}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="lma-text-center lma-space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="lma-h-7 lma-w-7"
                          onClick={() => onEdit(ac)}
                        >
                          <Pencil className="lma-h-3.5 lma-w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="lma-h-7 lma-w-7 lma-text-destructive"
                          onClick={() => onDelete(ac.id)}
                        >
                          <Trash2 className="lma-h-3.5 lma-w-3.5" />
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
  );
};
