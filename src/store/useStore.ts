import { create } from "zustand";
import {
  Employee, LeaveRequest, LeaveConfig, UserRole,
  employees as mockEmployees,
  initialLeaveRequests,
  defaultLeaveConfig,
  mockUsers,
} from "@/lib/leave-data";

interface AuthUser {
  employeeId: string;
  role: UserRole;
  username: string;
}

interface AppState {
  // Auth
  currentUser: AuthUser | null;
  login: (username: string, password: string, role: UserRole) => boolean;
  logout: () => void;

  // Employees
  employees: Employee[];
  getEmployee: (id: string) => Employee | undefined;

  // Leave requests
  leaveRequests: LeaveRequest[];
  addLeaveRequest: (req: Omit<LeaveRequest, "id" | "createdAt" | "updatedAt">) => void;
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void;

  // Config
  leaveConfig: LeaveConfig;
  updateLeaveConfig: (config: Partial<LeaveConfig>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  login: (username, password, role) => {
    const user = mockUsers.find(u => u.username === username && u.password === password && u.role === role);
    if (user) {
      set({ currentUser: { employeeId: user.employeeId, role: user.role, username: user.username } });
      return true;
    }
    return false;
  },
  logout: () => set({ currentUser: null }),

  employees: mockEmployees,
  getEmployee: (id) => get().employees.find(e => e.id === id),

  leaveRequests: initialLeaveRequests,
  addLeaveRequest: (req) => {
    const id = `lr${Date.now()}`;
    const now = new Date().toISOString().split("T")[0];
    set(s => ({ leaveRequests: [{ ...req, id, createdAt: now, updatedAt: now }, ...s.leaveRequests] }));
  },
  updateLeaveRequest: (id, updates) => {
    const now = new Date().toISOString().split("T")[0];
    set(s => ({
      leaveRequests: s.leaveRequests.map(r => r.id === id ? { ...r, ...updates, updatedAt: now } : r),
    }));
  },

  leaveConfig: defaultLeaveConfig,
  updateLeaveConfig: (config) => set(s => ({ leaveConfig: { ...s.leaveConfig, ...config } })),
}));
