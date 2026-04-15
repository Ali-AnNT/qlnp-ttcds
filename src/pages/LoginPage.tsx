import { useState } from "react";
import { useStore } from "@/store/useStore";
import { UserRole, roleLabels } from "@/lib/leave-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Shield } from "lucide-react";
import { toast } from "sonner";

const LoginPage = () => {
  const login = useStore(s => s.login);
  const [username, setUsername] = useState("nvan");
  const [password, setPassword] = useState("123456");
  const [role, setRole] = useState<UserRole>("CB.PCM");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password, role);
    if (!success) toast.error("Sai tên đăng nhập, mật khẩu hoặc vai trò!");
  };

  const demoAccounts = [
    { label: "CB.PCM (Nhân viên)", username: "nvan", role: "CB.PCM" as UserRole },
    { label: "LĐ.PCM (Trưởng phòng)", username: "lhcuong", role: "LD.PCM" as UserRole },
    { label: "GĐ/PGĐ (Giám đốc)", username: "dqson", role: "GD.PGD" as UserRole },
    { label: "QTHT (Quản trị)", username: "cttam", role: "QTHT" as UserRole },
  ];

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-4">
            <CalendarDays className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">HỆ THỐNG QUẢN LÝ NGHỈ PHÉP</h1>
          <p className="text-primary-foreground/70 text-sm mt-1">Đăng nhập để tiếp tục</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Đăng nhập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Tên đăng nhập</Label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Nhập tên đăng nhập" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Mật khẩu</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Vai trò</Label>
                <Select value={role} onValueChange={v => setRole(v as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(roleLabels) as UserRole[]).map(r => (
                      <SelectItem key={r} value={r}>{r} — {roleLabels[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Đăng nhập</Button>
            </form>

            <div className="mt-6 border-t pt-4">
              <p className="text-xs text-muted-foreground mb-3">Tài khoản demo (mật khẩu: 123456):</p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map(a => (
                  <button
                    key={a.username}
                    onClick={() => { setUsername(a.username); setRole(a.role); }}
                    className="text-left p-2 rounded-md border text-xs hover:bg-muted transition-colors"
                  >
                    <span className="font-medium text-accent">{a.username}</span>
                    <br />
                    <span className="text-muted-foreground">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
