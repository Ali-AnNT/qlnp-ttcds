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
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Danh sách loại phép</CardTitle>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={onAdd}>
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
            {leaveTypes.map((lt) => (
              <TableRow key={lt.id}>
                <TableCell className="font-medium">{lt.name}</TableCell>
                <TableCell>{lt.code}</TableCell>
                <TableCell className="text-center">{lt.defaultDays}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{lt.description}</TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={lt.isActive}
                    onCheckedChange={() => onToggle(lt.id, lt.isActive)}
                    disabled={!isAdmin}
                  />
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => onEdit(lt)}
                    >
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
  );
};
