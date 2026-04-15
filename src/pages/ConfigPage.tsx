import { useState } from "react";
import { useStore } from "@/store/useStore";
import { LeaveType, leaveTypeLabels, UserRole, roleLabels } from "@/lib/leave-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const ConfigPage = () => {
  const leaveConfig = useStore(s => s.leaveConfig);
  const updateLeaveConfig = useStore(s => s.updateLeaveConfig);

  const [defaultDays, setDefaultDays] = useState(leaveConfig.defaultAnnualDays);
  const [cycleType, setCycleType] = useState(leaveConfig.leaveCycleType);
  const [leaveTypes, setLeaveTypes] = useState(leaveConfig.leaveTypes);

  const handleSaveDefault = () => {
    updateLeaveConfig({ defaultAnnualDays: defaultDays });
    toast.success("Đã cập nhật");
  };

  const handleSaveCycle = () => {
    updateLeaveConfig({ leaveCycleType: cycleType });
    toast.success("Đã cập nhật");
  };

  const toggleLeaveType = (type: LeaveType) => {
    const updated = leaveTypes.map(lt => lt.type === type ? { ...lt, enabled: !lt.enabled } : lt);
    setLeaveTypes(updated);
    updateLeaveConfig({ leaveTypes: updated });
    toast.success("Đã cập nhật");
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-lg font-bold">Cấu hình quy định nghỉ phép</h2>

      <Tabs defaultValue="days">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="days" className="text-xs">Số ngày phép</TabsTrigger>
          <TabsTrigger value="cycle" className="text-xs">Chu kỳ tính</TabsTrigger>
          <TabsTrigger value="types" className="text-xs">Loại phép</TabsTrigger>
          <TabsTrigger value="approval" className="text-xs">Cấp phê duyệt</TabsTrigger>
        </TabsList>

        <TabsContent value="days">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Số ngày phép mặc định</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="text-[13px] w-48">Ngày phép năm mặc định:</Label>
                <Input type="number" value={defaultDays} onChange={e => setDefaultDays(Number(e.target.value))} className="w-24" />
                <span className="text-sm text-muted-foreground">ngày/năm</span>
              </div>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleSaveDefault}>Lưu thay đổi</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cycle">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Chu kỳ tính phép</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={cycleType} onValueChange={v => setCycleType(v as "yearly" | "monthly")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yearly" id="yearly" />
                  <Label htmlFor="yearly">Theo năm</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly">Theo tháng</Label>
                </div>
              </RadioGroup>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleSaveCycle}>Lưu thay đổi</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Danh sách loại phép</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaveTypes.map(lt => (
                  <div key={lt.type} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{lt.label}</span>
                    <Switch checked={lt.enabled} onCheckedChange={() => toggleLeaveType(lt.type)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Cấp phê duyệt theo loại phép</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Loại phép</TableHead>
                    <TableHead>Cấp phê duyệt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveConfig.approvalChain.map(ac => (
                    <TableRow key={ac.leaveType}>
                      <TableCell className="font-medium">{leaveTypeLabels[ac.leaveType]}</TableCell>
                      <TableCell>{ac.approvers.map(a => roleLabels[a]).join(" → ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigPage;
