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
      <div className="min-h-screen flex w-full bg-background">
        <main className="flex-1 overflow-auto">
          <Card className="px-3 py-2">
            <Outlet />
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <AppSidebar
        collapsed={isMobile ? false : collapsed}
        open={isMobile ? sidebarOpen : true}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader onToggleSidebar={() => setSidebarOpen((p) => !p)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Card className="px-3 py-2">
            <Outlet />
          </Card>
        </main>
      </div>
    </div>
  );
};
