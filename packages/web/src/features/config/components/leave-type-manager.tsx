import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Plus, Pencil } from "lucide-react";
import { LeaveTypeDto } from "../api/types";

interface LeaveTypeManagerProps {
  leaveTypes: LeaveTypeDto[];
  onAdd: () => void;
  onEdit: (lt: LeaveTypeDto) => void;
  onToggle: (id: number, isActive: boolean) => void;
  isAdmin: boolean;
}

export const LeaveTypeManager = ({
  leaveTypes,
  onAdd,
  onEdit,
  onToggle,
  isAdmin,
}: LeaveTypeManagerProps) => {
  return (
    <Card>
      <CardHeader className="lma-pb-2 lma-flex lma-flex-row lma-items-center lma-justify-between">
        <CardTitle className="lma-text-sm">Danh sách loại phép</CardTitle>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="lma-h-4 lma-w-4 lma-mr-1" /> Thêm loại phép
          </Button>
        )}
      </CardHeader>
      <CardContent className="lma-p-0">
        <Table>
          <TableHeader>
            <TableRow className="lma-bg-muted/50">
              <TableHead>Tên loại phép</TableHead>
              <TableHead>Mã</TableHead>
              <TableHead className="lma-text-center">Số ngày MĐ</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="lma-text-center">Trạng thái</TableHead>
              {isAdmin && <TableHead className="lma-text-center">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaveTypes.map((lt) => (
              <TableRow key={lt.id}>
                <TableCell className="lma-font-medium">{lt.name}</TableCell>
                <TableCell>{lt.code}</TableCell>
                <TableCell className="lma-text-center">{lt.defaultDays}</TableCell>
                <TableCell className="lma-text-muted-foreground lma-text-xs">{lt.description}</TableCell>
                <TableCell className="lma-text-center">
                  <Switch
                    checked={lt.isActive}
                    onCheckedChange={() => onToggle(lt.id, lt.isActive)}
                    disabled={!isAdmin}
                  />
                </TableCell>
                {isAdmin && (
                  <TableCell className="lma-text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="lma-h-7 lma-w-7"
                      onClick={() => onEdit(lt)}
                    >
                      <Pencil className="lma-h-3.5 lma-w-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
