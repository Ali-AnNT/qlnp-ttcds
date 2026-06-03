import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage, AuthGuard } from "@/features/auth";
import { AppLayout } from "@/features/layout";
import { DashboardPage } from "@/features/dashboard";
import { LeaveNewPage, LeaveMyPage } from "@/features/leave-requests";
import { ApprovalPage } from "@/features/approval";
import { CalendarPage } from "@/features/calendar";
import { SummaryPage } from "@/features/summary";
import { ReportsPage } from "@/features/reports";
import { ViolationsPage } from "@/features/violations";
import { ConfigPage } from "@/features/config";
import NotFound from "./NotFound";

export function AppRouter() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={<Navigate to="/quan-ly-nghi-phep" replace />}
        />
        <Route
          path="quan-ly-nghi-phep"
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route
            index
            element={<Navigate to="/quan-ly-nghi-phep/tong-quan" replace />}
          />
          <Route path="tong-quan" element={<DashboardPage />} />
          <Route
            path="xin-nghi-phep/tao-đon-xin-nghi-phep"
            element={<LeaveNewPage />}
          />
          <Route
            path="xin-nghi-phep/danh-sach-đon-cua-toi"
            element={<LeaveMyPage />}
          />
          <Route path="phe-duyet-đon" element={<ApprovalPage />} />
          <Route path="theo-doi-lich-nghi-phep" element={<CalendarPage />} />
          <Route
            path="tong-hop-lich-nghi-toan-trung-tam"
            element={<SummaryPage />}
          />
          <Route path="thong-ke-bao-cao" element={<ReportsPage />} />
          <Route
            path="theo-doi-vuot-muc-quy-đinh"
            element={<ViolationsPage />}
          />
          <Route path="config" element={<ConfigPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
