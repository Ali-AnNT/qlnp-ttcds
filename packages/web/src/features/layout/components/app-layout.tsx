import { useState } from "react";
import { Outlet } from "react-router";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Card } from "@/shared/ui/card";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const collapsed = !sidebarOpen;

  if (!DEV_MODE) {
    return (
      <div className="lma-min-h-screen lma-flex lma-w-full lma-bg-background">
        <main className="lma-flex-1 lma-overflow-auto">
          <Card className="lma-px-3 lma-py-2">
            <Outlet />
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="lma-min-h-screen lma-flex lma-w-full lma-bg-background">
      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="lma-fixed lma-inset-0 lma-bg-black/50 lma-z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <AppSidebar
        collapsed={isMobile ? false : collapsed}
        open={isMobile ? sidebarOpen : true}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />
      <div className="lma-flex-1 lma-flex lma-flex-col lma-min-w-0">
        <AppHeader onToggleSidebar={() => setSidebarOpen((p) => !p)} />
        <main className="lma-flex-1 !lma-p-4 md:lma-p-6 lma-overflow-auto">
          <Card className="lma-px-3 lma-py-2">
            <Outlet />
          </Card>
        </main>
      </div>
    </div>
  );
};
