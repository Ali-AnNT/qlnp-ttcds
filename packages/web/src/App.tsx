import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import AppLayout from "./pages/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import LeaveNewPage from "./pages/LeaveNewPage";
import LeaveMyPage from "./pages/LeaveMyPage";
import ApprovalPage from "./pages/ApprovalPage";
import CalendarPage from "./pages/CalendarPage";
import SummaryPage from "./pages/SummaryPage";
import ReportsPage from "./pages/ReportsPage";
import ViolationsPage from "./pages/ViolationsPage";
import ConfigPage from "./pages/ConfigPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AuthGuard><AppLayout /></AuthGuard>}>
              <Route index element={<DashboardPage />} />
              <Route path="leave/new" element={<LeaveNewPage />} />
              <Route path="leave/my" element={<LeaveMyPage />} />
              <Route path="approval" element={<ApprovalPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="summary" element={<SummaryPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="violations" element={<ViolationsPage />} />
              <Route path="config" element={<ConfigPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
