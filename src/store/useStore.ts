import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { UserRole, Department, Employee, LeaveType, LeaveRequest } from "@/lib/leave-data";

interface AuthUser {
  employeeId: string;
  role: UserRole;
  username: string;
  fullName: string;
  departmentName: string;
  departmentId: string;
  position: string;
}

interface AppState {
  currentUser: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;

  departments: Department[];
  employees: Employee[];
  leaveTypes: LeaveType[];
  leaveRequests: LeaveRequest[];

  loadData: () => Promise<void>;
  getEmployee: (id: string) => Employee | undefined;
  getDepartment: (id: string) => Department | undefined;
  getLeaveType: (id: string) => LeaveType | undefined;

  addLeaveRequest: (req: Omit<LeaveRequest, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,

  login: async (username, password) => {
    const { data, error } = await supabase.rpc("verify_login", {
      p_username: username,
      p_password: password,
    });
    if (error || !data || (data as any[]).length === 0) return false;
    const user = (data as any[])[0];

    // Find employee to get department_id
    const { data: empData } = await supabase
      .from("employees")
      .select("department_id")
      .eq("id", user.employee_id)
      .single();

    set({
      currentUser: {
        employeeId: user.employee_id,
        role: user.emp_role,
        username: user.emp_username,
        fullName: user.emp_full_name,
        departmentName: user.department_name || "",
        departmentId: empData?.department_id || "",
        position: user.emp_position || "",
      },
    });
    await get().loadData();
    return true;
  },

  logout: () => set({ currentUser: null }),

  departments: [],
  employees: [],
  leaveTypes: [],
  leaveRequests: [],

  loadData: async () => {
    const currentUser = get().currentUser;
    const role = currentUser?.role;

    const [deptRes, empRes, ltRes] = await Promise.all([
      supabase.from("departments").select("*"),
      supabase.from("employees").select("id, username, full_name, department_id, job_title, role, phone, email, is_active"),
      supabase.from("leave_types").select("*").eq("is_active", true),
    ]);

    // Load leave requests based on role
    let lrQuery = supabase.from("leave_requests").select("*").order("created_at", { ascending: false });

    if (role === "CB.PCM" && currentUser) {
      // CB.PCM: only own requests
      lrQuery = lrQuery.eq("employee_id", currentUser.employeeId);
    } else if (role === "LD.PCM" && currentUser) {
      // LD.PCM: requests from their department
      const deptEmployees = (empRes.data || []).filter(
        (e: any) => e.department_id === currentUser.departmentId
      );
      const deptEmployeeIds = deptEmployees.map((e: any) => e.id);
      if (deptEmployeeIds.length > 0) {
        lrQuery = lrQuery.in("employee_id", deptEmployeeIds);
      }
    }
    // GD.PGD and QTHT: load all (no filter)

    const lrRes = await lrQuery;

    set({
      departments: (deptRes.data || []) as Department[],
      employees: (empRes.data || []) as Employee[],
      leaveTypes: (ltRes.data || []) as LeaveType[],
      leaveRequests: (lrRes.data || []) as LeaveRequest[],
    });
  },

  getEmployee: (id) => get().employees.find((e) => e.id === id),
  getDepartment: (id) => get().departments.find((d) => d.id === id),
  getLeaveType: (id) => get().leaveTypes.find((t) => t.id === id),

  addLeaveRequest: async (req) => {
    const { data, error } = await supabase.from("leave_requests").insert(req as any).select().single();
    if (!error && data) {
      set((s) => ({ leaveRequests: [data as LeaveRequest, ...s.leaveRequests] }));
    }
  },

  updateLeaveRequest: async (id, updates) => {
    const { error } = await supabase.from("leave_requests").update(updates as any).eq("id", id);
    if (!error) {
      set((s) => ({
        leaveRequests: s.leaveRequests.map((r) =>
          r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
        ),
      }));
    }
  },
}));
