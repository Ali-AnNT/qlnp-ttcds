import { NavLink, useLocation } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { UserRole } from "@/lib/leave-data";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, CheckSquare, CalendarDays,
  BarChart3, PieChart, AlertTriangle, Settings, ChevronDown,
  LogOut, X,
} from "lucide-react";
import { useState } from "react";

interface MenuItem {
  label: string;
  path?: string;
  icon: React.ElementType;
  roles: UserRole[];
  children?: { label: string; path: string }[];
}

const menuItems: MenuItem[] = [
  { label: "Tổng quan", path: "/", icon: LayoutDashboard, roles: ["CB.PCM", "LD.PCM", "GD.PGD", "QTHT"] },
  {
    label: "Đơn xin nghỉ phép", icon: FileText, roles: ["CB.PCM", "LD.PCM"],
    children: [
      { label: "Tạo đơn mới", path: "/leave/new" },
      { label: "Danh sách đơn của tôi", path: "/leave/my" },
    ],
  },
  { label: "Phê duyệt đơn", path: "/approval", icon: CheckSquare, roles: ["LD.PCM", "GD.PGD"] },
  { label: "Theo dõi lịch nghỉ phép", path: "/calendar", icon: CalendarDays, roles: ["CB.PCM", "LD.PCM", "GD.PGD", "QTHT"] },
  { label: "Tổng hợp lịch nghỉ", path: "/summary", icon: PieChart, roles: ["GD.PGD"] },
  { label: "Thống kê báo cáo", path: "/reports", icon: BarChart3, roles: ["GD.PGD"] },
  { label: "Vượt mức quy định", path: "/violations", icon: AlertTriangle, roles: ["GD.PGD"] },
  { label: "Cấu hình quy định", path: "/config", icon: Settings, roles: ["QTHT"] },
];

interface Props {
  collapsed: boolean;
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export const AppSidebar = ({ collapsed, open, onClose, isMobile }: Props) => {
  const currentUser = useStore(s => s.currentUser);
  const logout = useStore(s => s.logout);
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Đơn xin nghỉ phép"]);

  const role = currentUser?.role;
  const visibleItems = menuItems.filter(m => role && m.roles.includes(role));

  const toggleExpand = (label: string) => {
    setExpandedItems(p => p.includes(label) ? p.filter(l => l !== label) : [...p, label]);
  };

  const sidebarWidth = collapsed ? "w-16" : "w-60";

  if (isMobile && !open) return null;

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground flex flex-col shrink-0 transition-all duration-200 h-screen sticky top-0 z-40 border-r border-sidebar-border",
        isMobile ? "fixed left-0 top-0 w-60" : sidebarWidth
      )}
    >
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border gap-2">
        <CalendarDays className="h-6 w-6 text-accent shrink-0" />
        {!collapsed && <span className="font-bold text-sm truncate">QUẢN LÝ NGHỈ PHÉP</span>}
        {isMobile && (
          <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-sidebar-accent">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isExpanded = expandedItems.includes(item.label);
          const isChildActive = item.children?.some(c => location.pathname === c.path);

          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sidebar-accent transition-colors",
                    isChildActive && "bg-sidebar-accent"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
                    </>
                  )}
                </button>
                {!collapsed && isExpanded && (
                  <div className="ml-4 border-l border-sidebar-border">
                    {item.children.map(child => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={isMobile ? onClose : undefined}
                        className={({ isActive }) => cn(
                          "block pl-6 pr-4 py-2 text-[13px] hover:bg-sidebar-accent transition-colors",
                          isActive ? "bg-accent text-accent-foreground font-medium" : "text-primary-foreground/80"
                        )}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path!}
              end={item.path === "/"}
              onClick={isMobile ? onClose : undefined}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sidebar-accent transition-colors",
                isActive ? "bg-accent text-accent-foreground font-medium" : ""
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sidebar-accent rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};
