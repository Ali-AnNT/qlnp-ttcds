import { useLocation, Link } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { employees, departments, roleLabels } from "@/lib/leave-data";
import { Menu, Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const breadcrumbMap: Record<string, string> = {
  "/": "Tổng quan",
  "/leave/new": "Tạo đơn mới",
  "/leave/my": "Danh sách đơn của tôi",
  "/approval": "Phê duyệt đơn",
  "/calendar": "Theo dõi lịch nghỉ phép",
  "/summary": "Tổng hợp lịch nghỉ",
  "/reports": "Thống kê báo cáo",
  "/violations": "Vượt mức quy định",
  "/config": "Cấu hình quy định",
};

export const AppHeader = ({ onToggleSidebar }: { onToggleSidebar: () => void }) => {
  const currentUser = useStore(s => s.currentUser);
  const location = useLocation();
  const emp = employees.find(e => e.id === currentUser?.employeeId);
  const dept = departments.find(d => d.id === emp?.departmentId);
  const crumb = breadcrumbMap[location.pathname] || "Trang";

  return (
    <header className="h-14 bg-card border-b flex items-center px-4 gap-3 sticky top-0 z-20">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="shrink-0">
        <Menu className="h-5 w-5" />
      </Button>

      <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-1 min-w-0">
        <Link to="/" className="hover:text-foreground">Trang chủ</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate">{crumb}</span>
      </nav>

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">3</span>
      </Button>

      <div className="flex items-center gap-2 pl-2 border-l">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
            {emp?.name.split(" ").slice(-1)[0]?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium leading-tight">{emp?.name}</p>
          <p className="text-[11px] text-muted-foreground">{dept?.name} • {currentUser?.role}</p>
        </div>
      </div>
    </header>
  );
};
