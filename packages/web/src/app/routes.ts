/**
 * Centralized route path constants.
 * Single source of truth — all navigation must reference these,
 * never hardcode string paths in components.
 */
export const ROUTES = {
  login: "/login",
  layout: "/quan-ly-nghi-phep",
  dashboard: "/quan-ly-nghi-phep/tong-quan",
  leaveNew: "/quan-ly-nghi-phep/xin-nghi-phep/tao-đon-xin-nghi-phep",
  leaveMy: "/quan-ly-nghi-phep/xin-nghi-phep/danh-sach-đon-cua-toi",
  approval: "/quan-ly-nghi-phep/phe-duyet-đon",
  calendar: "/quan-ly-nghi-phep/theo-doi-lich-nghi-phep",
  summary: "/quan-ly-nghi-phep/tong-hop-lich-nghi-toan-trung-tam",
  reports: "/quan-ly-nghi-phep/thong-ke-bao-cao",
  violations: "/quan-ly-nghi-phep/theo-doi-vuot-muc-quy-đinh",
  config: "/quan-ly-nghi-phep/cau-hinh-quy-đinh-nghi-phep",
} as const;

/** Type for route path strings — enables autocomplete */
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
