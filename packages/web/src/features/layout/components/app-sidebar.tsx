import { useAuth } from "@/features/auth";
import { type UserRole, AppRoles } from "@/features/shared-reference-data";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  PieChart,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { ROUTES } from "@/app/routes";

interface MenuItem {
  label: string;
  path?: string;
  icon: React.ElementType;
  roles: UserRole[];
  children?: { label: string; path: string }[];
}

const { Staff, Leader, Director, Admin } = AppRoles;

const menuItems: MenuItem[] = [
  {
    label: "Tổng quan",
    path: ROUTES.dashboard,
    icon: LayoutDashboard,
    roles: [Staff, Leader, Director, Admin],
  },
  {
    label: "Đơn xin nghỉ phép",
    icon: FileText,
    roles: [Staff, Leader],
    children: [
      { label: "Tạo đơn mới", path: ROUTES.leaveNew },
      { label: "Danh sách đơn của tôi", path: ROUTES.leaveMy },
    ],
  },
  {
    label: "Phê duyệt đơn",
    path: ROUTES.approval,
    icon: CheckSquare,
    roles: [Leader, Director],
  },
  {
    label: "Theo dõi lịch nghỉ phép",
    path: ROUTES.calendar,
    icon: CalendarDays,
    roles: [Staff, Leader, Director, Admin],
  },
  {
    label: "Tổng hợp lịch nghỉ",
    path: ROUTES.summary,
    icon: PieChart,
    roles: [Director],
  },
  {
    label: "Thống kê báo cáo",
    path: ROUTES.reports,
    icon: BarChart3,
    roles: [Director],
  },
  {
    label: "Vượt mức quy định",
    path: ROUTES.violations,
    icon: AlertTriangle,
    roles: [Director],
  },
  {
    label: "Cấu hình quy định",
    path: ROUTES.config,
    icon: Settings,
    roles: [Admin],
  },
];

interface Props {
  collapsed: boolean;
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export const AppSidebar = ({ collapsed, open, onClose, isMobile }: Props) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "Đơn xin nghỉ phép",
  ]);

  const role = user?.role as UserRole | undefined;
  const visibleItems = menuItems.filter((m) => role && m.roles.includes(role));

  const toggleExpand = (label: string) => {
    setExpandedItems((p) =>
      p.includes(label) ? p.filter((l) => l !== label) : [...p, label],
    );
  };

  const sidebarWidth = collapsed ? "lma-w-16" : "lma-w-60";

  if (isMobile && !open) return null;

  return (
    <aside
      className={cn(
        "lma-bg-sidebar lma-text-sidebar-foreground lma-flex lma-flex-col lma-shrink-0 lma-transition-all lma-duration-200 lma-h-screen lma-sticky lma-top-0 lma-z-40 lma-border-r lma-border-sidebar-border",
        isMobile ? "lma-fixed lma-left-0 lma-top-0 lma-w-60" : sidebarWidth,
      )}
    >
      <div className="lma-h-14 lma-flex lma-items-center lma-px-4 lma-border-b lma-border-sidebar-border lma-gap-2">
        <CalendarDays className="lma-h-6 lma-w-6 lma-text-accent lma-shrink-0" />
        {!collapsed && (
          <span className="lma-font-bold lma-text-sm truncate">QUẢN LÝ NGHỈ PHÉP</span>
        )}
        {isMobile && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lma-ml-auto lma-h-7 lma-w-7"
          >
            <X className="lma-h-4 lma-w-4" />
          </Button>
        )}
      </div>

      <nav className="lma-flex-1 lma-py-2 lma-overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isExpanded = expandedItems.includes(item.label);
          const isChildActive = item.children?.some(
            (c) => location.pathname === c.path,
          );

          if (item.children) {
            return (
              <div key={item.label}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleExpand(item.label)}
                  className={cn(
                    "lma-w-full lma-h-auto lma-justify-start lma-gap-3 lma-px-4 lma-py-2.5 lma-text-sm lma-font-normal lma-rounded-none hover:lma-bg-sidebar-accent lma-transition-colors",
                    isChildActive && "lma-bg-sidebar-accent",
                  )}
                >
                  <Icon className="lma-h-4 lma-w-4 lma-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="lma-flex-1 lma-text-left truncate">
                        {item.label}
                      </span>
                      <ChevronDown
                        className={cn(
                          "lma-h-3 lma-w-3 lma-transition-transform",
                          isExpanded && "lma-rotate-180",
                        )}
                      />
                    </>
                  )}
                </Button>
                {!collapsed && isExpanded && (
                  <div className="lma-ml-4 lma-border-l lma-border-sidebar-border">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={isMobile ? onClose : undefined}
                        className={({ isActive }) =>
                          cn(
                            "lma-block lma-pl-6 lma-pr-4 lma-py-2 lma-text-[13px] hover:lma-bg-sidebar-accent lma-transition-colors",
                            isActive
                              ? "lma-bg-accent lma-text-accent-foreground lma-font-medium"
                              : "lma-text-sidebar-foreground",
                          )
                        }
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
              end
              onClick={isMobile ? onClose : undefined}
              className={({ isActive }) =>
                cn(
                  "lma-flex lma-items-center lma-gap-3 lma-px-4 lma-py-2.5 lma-text-sm hover:lma-bg-sidebar-accent lma-transition-colors",
                  isActive
                    ? "lma-bg-accent lma-text-accent-foreground lma-font-medium"
                    : "",
                )
              }
            >
              <Icon className="lma-h-4 lma-w-4 lma-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="lma-border-t lma-border-sidebar-border !lma-p-2">
        <Button
          type="button"
          variant="ghost"
          onClick={logout}
          className="lma-w-full lma-h-auto lma-justify-start lma-gap-3 lma-px-4 lma-py-2.5 lma-text-sm lma-font-normal hover:lma-bg-sidebar-accent lma-rounded-md lma-transition-colors"
        >
          <LogOut className="lma-h-4 lma-w-4 lma-shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </Button>
      </div>
    </aside>
  );
};
