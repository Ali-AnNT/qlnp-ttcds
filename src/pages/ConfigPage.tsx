import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/store/useStore";
import { roleLabels } from "@/lib/leave-data";

const ConfigPage = () => {
  const leaveTypes = useStore((s) => s.leaveTypes);

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-lg font-bold">Cấu hình quy định nghỉ phép</h2>
      <Tabs defaultValue="types">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="types" className="text-xs">Loại phép</TabsTrigger>
          <TabsTrigger value="approval" className="text-xs">Cấp phê duyệt</TabsTrigger>
        </TabsList>
        <TabsContent value="types">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Danh sách loại phép</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tên loại phép</TableHead>
                    <TableHead>Mã</TableHead>
                    <TableHead className="text-center">Số ngày mặc định</TableHead>
                    <TableHead>Mô tả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.map((lt) => (
                    <TableRow key={lt.id}>
                      <TableCell className="font-medium">{lt.name}</TableCell>
                      <TableCell>{lt.code}</TableCell>
                      <TableCell className="text-center">{lt.default_days}</TableCell>
                      <TableCell className="text-muted-foreground">{lt.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="approval">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Quy trình phê duyệt</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>1. Cán bộ ({roleLabels["CB.PCM"]}) tạo đơn → gửi Lãnh đạo phòng</p>
              <p>2. Lãnh đạo phòng ({roleLabels["LD.PCM"]}) duyệt → gửi Giám đốc</p>
              <p>3. Giám đốc ({roleLabels["GD.PGD"]}) duyệt cuối cùng</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigPage;
