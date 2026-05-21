import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Loader2, LogIn } from "lucide-react";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

const DEV_USERS = [
  { username: "admin", label: "admin (QTHT)" },
  { username: "trinh.vo", label: "trinh.vo (GD.PGD) — Lãnh đạo đơn vị" },
  { username: "nvhau.ttcds", label: "nvhau.ttcds (LD.PCM) — Lãnh đạo phòng" },
  { username: "htquy.ttcds", label: "htquy.ttcds (CB.PCM) — Chuyên viên" },
];

const LoginPage = () => {
  const { user, loading, isEmbed } = useAuth();
  const navigate = useNavigate();
  const [devUser, setDevUser] = useState("");
  const [devLoggingIn, setDevLoggingIn] = useState(false);
  const [devError, setDevError] = useState("");

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleDevLogin = async () => {
    if (!devUser) return;
    setDevLoggingIn(true);
    setDevError("");
    const { data, error } = await api.post<{ token: string }>("/auth/dev/login", { userName: devUser });
    if (error || !data) {
      setDevError(error || "Login failed");
      setDevLoggingIn(false);
      return;
    }
    localStorage.setItem("jwt", data.token);
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  if (isEmbed) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <Card className="shadow-xl border-0 max-w-md w-full text-center p-8">
          <CalendarDays className="h-12 w-12 text-accent mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Đang chờ xác thực</h2>
          <p className="text-sm text-muted-foreground">
            Vui lòng đợi ứng dụng chính gửi token xác thực...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <Card className="shadow-xl border-0 max-w-md w-full text-center p-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-4">
          <CalendarDays className="h-8 w-8 text-accent-foreground" />
        </div>
        <h1 className="text-xl font-bold mb-2">HỆ THỐNG QUẢN LÝ NGHỈ PHÉP</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Đăng nhập qua hệ thống SSO để tiếp tục
        </p>
        <p className="text-xs text-muted-foreground">
          Nếu không tự động chuyển hướng, vui lòng truy cập ứng dụng từ cổng thông tin chính.
        </p>

        {DEV_MODE && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Dev Login</h3>
            <select
              value={devUser}
              onChange={(e) => { setDevUser(e.target.value); setDevError(""); }}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm mb-3"
            >
              <option value="">-- Chọn tài khoản test --</option>
              {DEV_USERS.map((u) => (
                <option key={u.username} value={u.username}>{u.label}</option>
              ))}
            </select>
            <Button
              onClick={handleDevLogin}
              disabled={!devUser || devLoggingIn}
              className="w-full gap-2"
            >
              {devLoggingIn ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {devLoggingIn ? "Đang đăng nhập..." : "Đăng nhập (Dev)"}
            </Button>
            {devError && (
              <p className="text-xs text-destructive mt-2">{devError}</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default LoginPage;
