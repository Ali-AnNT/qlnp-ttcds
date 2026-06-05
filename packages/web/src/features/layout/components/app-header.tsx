import { useLocation, Link } from "react-router";
import { useAuth } from "@/features/auth";
import { ROUTES } from "@/app/routes";
import { Menu, Bell, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";

const breadcrumbMap: Record<string, string> = {
  [ROUTES.layout]: "Quản lý nghỉ phép",
  [ROUTES.dashboard]: "Tổng quan",
  [ROUTES.leaveNew]: "Tạo đơn mới",
  [ROUTES.leaveMy]: "Danh sách đơn của tôi",
  [ROUTES.approval]: "Phê duyệt đơn",
  [ROUTES.calendar]: "Theo dõi lịch nghỉ phép",
  [ROUTES.summary]: "Tổng hợp lịch nghỉ",
  [ROUTES.reports]: "Thống kê báo cáo",
  [ROUTES.violations]: "Vượt mức quy định",
  [ROUTES.config]: "Cấu hình quy định",
};

export const AppHeader = ({ onToggleSidebar }: { onToggleSidebar: () => void }) => {
  const { user } = useAuth();
  const location = useLocation();
  const crumb = breadcrumbMap[location.pathname] || "Trang";

  const initials = user?.fullName?.split(" ").slice(-1)[0]?.[0] || "U";

  return (
    <header className="lma-h-14 lma-bg-card lma-border-b lma-flex lma-items-center lma-px-4 lma-gap-3 lma-sticky lma-top-0 lma-z-20">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="shrink-0">
        <Menu className="lma-h-5 lma-w-5" />
      </Button>

      <nav className="lma-flex lma-items-center lma-gap-1 lma-text-sm lma-text-muted-foreground lma-flex-1 lma-min-w-0">
        <Link to={ROUTES.layout} className="hover:lma-text-foreground">Trang chủ</Link>
        <ChevronRight className="lma-h-3 lma-w-3" />
        <span className="lma-text-foreground lma-font-medium truncate">{crumb}</span>
      </nav>

      <Button variant="ghost" size="icon" className="lma-relative">
        <Bell className="lma-h-5 lma-w-5" />
      </Button>

      <div className="lma-flex lma-items-center lma-gap-2 lma-pl-2 lma-border-l">
        <Avatar className="lma-h-8 lma-w-8">
          <AvatarFallback className="lma-bg-accent lma-text-accent-foreground lma-text-xs lma-font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="lma-hidden md:lma-block lma-text-right">
          <p className="lma-text-sm lma-font-medium lma-leading-tight">{user?.fullName}</p>
          <p className="lma-text-[11px] lma-text-muted-foreground">{user?.userName} • {user?.role}</p>
        </div>
      </div>
    </header>
  );
};