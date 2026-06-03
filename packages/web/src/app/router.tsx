import { createBrowserRouter, redirect } from "react-router";
import { LoginPage } from "@/features/auth";
import { AppLayout } from "@/features/layout";
import { DashboardPage } from "@/features/dashboard";
import { LeaveNewPage, LeaveMyPage } from "@/features/leave-requests";
import { ApprovalPage } from "@/features/approval";
import { CalendarPage } from "@/features/calendar";
import { SummaryPage } from "@/features/summary";
import { ReportsPage } from "@/features/reports";
import { ViolationsPage } from "@/features/violations";
import { ConfigPage } from "@/features/config";
import { authLoader } from "./auth-loader";
import { ROUTES } from "./routes";
import NotFound from "./NotFound";

/**
 * Data-router definition. Note: child paths are RELATIVE to the parent
 * route, not absolute — absolute paths in nested routes would double-up
 * the URL. Use the `ROUTES` constants for navigation (`Link to`, `Navigate to`,
 * `navigate()`, `redirect()`) only.
 */
export const router = createBrowserRouter([
  { path: ROUTES.login, Component: LoginPage },
  {
    path: "/",
    loader: () => {
      throw redirect(ROUTES.layout);
    },
  },
  {
    path: ROUTES.layout,
    loader: authLoader,
    Component: AppLayout,
    children: [
      {
        index: true,
        loader: () => {
          throw redirect(ROUTES.dashboard);
        },
      },
      { path: "tong-quan", Component: DashboardPage },
      { path: "xin-nghi-phep/tao-đon-xin-nghi-phep", Component: LeaveNewPage },
      { path: "xin-nghi-phep/danh-sach-đon-cua-toi", Component: LeaveMyPage },
      { path: "phe-duyet-đon", Component: ApprovalPage },
      { path: "theo-doi-lich-nghi-phep", Component: CalendarPage },
      { path: "tong-hop-lich-nghi-toan-trung-tam", Component: SummaryPage },
      { path: "thong-ke-bao-cao", Component: ReportsPage },
      { path: "theo-doi-vuot-muc-quy-đinh", Component: ViolationsPage },
      { path: "cau-hinh-quy-đinh-nghi-phep", Component: ConfigPage },
    ],
  },
  { path: "*", Component: NotFound },
]);
