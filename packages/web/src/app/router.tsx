import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LoginPage, AuthGuard } from "@/features/auth";
import { AppLayout } from "@/features/layout";
import { DashboardPage } from "@/features/dashboard";
import { LeaveNewPage, LeaveMyPage } from "@/features/leave-requests";
import { ApprovalPage } from "@/features/approval";
import { CalendarPage } from "@/features/calendar";
import SummaryPage from "@/pages/SummaryPage";
import ReportsPage from "@/pages/ReportsPage";
import ViolationsPage from "@/pages/ViolationsPage";
import ConfigPage from "@/pages/ConfigPage";
import NotFound from "@/pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
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
  );
}