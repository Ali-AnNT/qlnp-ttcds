import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Loader2 } from "lucide-react";

const LoginPage = () => {
  const { user, loading, isEmbed } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

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
      </Card>
    </div>
  );
};

export default LoginPage;
