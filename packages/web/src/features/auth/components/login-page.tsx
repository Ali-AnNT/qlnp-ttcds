import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/use-auth";
import { api } from "@/shared/api/client";
import { setTokens } from "@/shared/lib/token-store";
import { ROUTES } from "@/app/routes";
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
    if (user) navigate(ROUTES.layout, { replace: true });
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
    // Trigger AuthProvider to re-fetch user; useEffect on `user` will
    // navigate to the layout page. Avoids a full-page reload.
    await retryAuth();
  };

  const handleRetry = async () => {
    setRetrying(true);
    await retryAuth();
    setRetrying(false);
  };

  if (loading && !user) {
    return (
      <div className="lma-min-h-screen lma-bg-primary lma-flex lma-items-center lma-justify-center">
        <Loader2 className="lma-h-8 lma-w-8 lma-animate-spin lma-text-primary-foreground" />
      </div>
    );
  }

  // Production mode: no dev login available — show access denied + retry
  if (!DEV_MODE) {
    return (
      <div className="lma-min-h-screen lma-bg-primary lma-flex lma-items-center lma-justify-center !lma-p-4">
        <Card className="lma-shadow-xl lma-border-0 lma-max-w-md lma-w-full lma-text-center !lma-p-8">
          <div className="lma-inline-flex lma-items-center lma-justify-center lma-w-16 lma-h-16 lma-rounded-2xl lma-bg-accent lma-mb-4">
            <CalendarDays className="lma-h-8 lma-w-8 lma-text-accent-foreground" />
          </div>
          <h1 className="lma-text-xl lma-font-bold lma-mb-2">
            Bạn không có quyền truy cập module này
          </h1>
          <p className="lma-text-sm lma-text-muted-foreground lma-mb-6">
            Vui lòng đăng nhập qua cổng thông tin chính để được cấp quyền truy
            cập.
          </p>
          <Button
            onClick={handleRetry}
            disabled={retrying}
            className="lma-w-full lma-gap-2"
          >
            {retrying ? (
              <Loader2 className="lma-h-4 lma-w-4 lma-animate-spin" />
            ) : (
              <RefreshCw className="lma-h-4 lma-w-4" />
            )}
            {retrying ? "Đang thử lại..." : "Thử lại"}
          </Button>
        </Card>
      </div>
    );
  }

  // Dev mode: show dev login form
  return (
    <div className="lma-min-h-screen lma-bg-primary lma-flex lma-items-center lma-justify-center !lma-p-4">
      <Card className="lma-shadow-xl lma-border-0 lma-max-w-md lma-w-full lma-text-center !lma-p-8">
        <div className="lma-inline-flex lma-items-center lma-justify-center lma-w-16 lma-h-16 lma-rounded-2xl lma-bg-accent lma-mb-4">
          <CalendarDays className="lma-h-8 lma-w-8 lma-text-accent-foreground" />
        </div>
        <h1 className="lma-text-xl lma-font-bold lma-mb-2">HỆ THỐNG QUẢN LÝ NGHỈ PHÉP</h1>
        <p className="lma-text-sm lma-text-muted-foreground lma-mb-6">
          Đăng nhập qua hệ thống SSO để tiếp tục
        </p>

        <div className="lma-mt-6 lma-pt-6 lma-border-t lma-border-border">
          <h3 className="lma-text-sm lma-font-semibold lma-mb-3 lma-text-foreground">
            Dev Login
          </h3>
          <select
            value={devUser}
            onChange={(e) => {
              setDevUser(e.target.value);
              setDevError("");
            }}
            className="lma-w-full lma-px-3 lma-py-2 lma-rounded-md lma-border lma-border-input lma-bg-background lma-text-sm lma-mb-3"
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
            className="lma-w-full lma-gap-2"
          >
            {devLoggingIn ? (
              <Loader2 className="lma-h-4 lma-w-4 lma-animate-spin" />
            ) : (
              <LogIn className="lma-h-4 lma-w-4" />
            )}
            {devLoggingIn ? "Đang đăng nhập..." : "Đăng nhập (Dev)"}
          </Button>
          {devError && (
            <p className="lma-text-xs lma-text-destructive lma-mt-2">{devError}</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
