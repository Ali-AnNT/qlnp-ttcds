import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { api } from "@/shared/api/client";
import { setTokens } from "@/shared/lib/token-store";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { CalendarDays, Loader2, LogIn, RefreshCw } from "lucide-react";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

const DEV_USERS = [
  { username: "quantri", label: "quantri (QTHT) — Quản trị" },
  { username: "trinh.vo", label: "trinh.vo (GD.PGD) — Lãnh đạo đơn vị" },
  { username: "nvhau.ttcds", label: "nvhau.ttcds (LD.PCM) — Lãnh đạo phòng" },
  { username: "htquy.ttcds", label: "htquy.ttcds (CB.PCM) — Chuyên viên" },
];

const LoginPage = () => {
  const { user, loading, retryAuth } = useAuth();
  const navigate = useNavigate();
  const [devUser, setDevUser] = useState("");
  const [devLoggingIn, setDevLoggingIn] = useState(false);
  const [devError, setDevError] = useState("");
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleDevLogin = async () => {
    if (!devUser) return;
    setDevLoggingIn(true);
    setDevError("");
    const { data, error } = await api.post<{ token: string }>(
      "/auth/dev-login",
      { userName: devUser },
    );
    if (error || !data) {
      setDevError(error || "Login failed");
      setDevLoggingIn(false);
      return;
    }
    // Dev login: 8h JWT, no renewal needed → tokenRenew = ""
    setTokens(data.token, Date.now() + 8 * 3600 * 1000, "");
    window.location.href = "/";
  };

  const handleRetry = async () => {
    setRetrying(true);
    await retryAuth();
    setRetrying(false);
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  // Production mode: no dev login available — show access denied + retry
  if (!DEV_MODE) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <Card className="shadow-xl border-0 max-w-md w-full text-center p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-4">
            <CalendarDays className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-xl font-bold mb-2">
            Bạn không có quyền truy cập module này
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Vui lòng đăng nhập qua cổng thông tin chính để được cấp quyền truy cập.
          </p>
          <Button onClick={handleRetry} disabled={retrying} className="w-full gap-2">
            {retrying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {retrying ? "Đang thử lại..." : "Thử lại"}
          </Button>
        </Card>
      </div>
    );
  }

  // Dev mode: show dev login form
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

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold mb-3 text-foreground">
            Dev Login
          </h3>
          <select
            value={devUser}
            onChange={(e) => {
              setDevUser(e.target.value);
              setDevError("");
            }}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm mb-3"
          >
            <option value="">-- Chọn tài khoản test --</option>
            {DEV_USERS.map((u) => (
              <option key={u.username} value={u.username}>
                {u.label}
              </option>
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
      </Card>
    </div>
  );
};

export default LoginPage;