import { create } from "zustand";
import { departmentsApi, type DepartmentDto } from "@/api/departments.api";
import { leaveTypesApi, type LeaveTypeDto } from "@/api/leave-types.api";
import { leaveRequestsApi, type LeaveRequestDto, type CreateLeaveRequestDto } from "@/api/leave-requests.api";
import { leaveBalancesApi, type LeaveBalanceDto } from "@/api/leave-balances.api";
import { configApi, type ConfigDto } from "@/api/config.api";

interface AppState {
  departments: DepartmentDto[];
  leaveTypes: LeaveTypeDto[];
  leaveRequests: LeaveRequestDto[];
  leaveBalances: LeaveBalanceDto[];
  approvalConfigs: ConfigDto[];

  loadData: () => Promise<void>;
  getDepartment: (id: number) => DepartmentDto | undefined;
  getLeaveType: (id: number) => LeaveTypeDto | undefined;

  addLeaveRequest: (req: CreateLeaveRequestDto) => Promise<void>;
  updateLeaveRequest: (id: number, updates: Partial<CreateLeaveRequestDto>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  departments: [],
  leaveTypes: [],
  leaveRequests: [],
  leaveBalances: [],
  approvalConfigs: [],

  loadData: async () => {
    const [deptRes, ltRes, lrRes, lbRes, acRes] = await Promise.all([
      departmentsApi.list(),
      leaveTypesApi.list(),
      leaveRequestsApi.list(),
      leaveBalancesApi.list(),
      configApi.get(),
    ]);

    set({
      departments: deptRes.data || [],
      leaveTypes: (ltRes.data || []).filter((t) => t.isActive),
      leaveRequests: lrRes.data || [],
      leaveBalances: lbRes.data || [],
      approvalConfigs: acRes.data || [],
    });
  },

  getDepartment: (id) => get().departments.find((d) => d.donViId === id),
  getLeaveType: (id) => get().leaveTypes.find((t) => t.id === id),

  addLeaveRequest: async (req) => {
    const { data, error } = await leaveRequestsApi.create(req);
    if (!error && data) {
      set((s) => ({ leaveRequests: [data, ...s.leaveRequests] }));
    }
  },

  updateLeaveRequest: async (id, updates) => {
    const { error } = await leaveRequestsApi.update(id, updates);
    if (!error) {
      set((s) => ({
        leaveRequests: s.leaveRequests.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
      }));
    }
  },
}));
