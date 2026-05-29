import { describe, it, expect, vi, beforeEach } from "vitest";
import { useStore } from "../store/useStore";

vi.mock("@/features/layout/api/departments.api", () => ({
  departmentsApi: {
    list: vi.fn(),
  },
}));

vi.mock("@/api/leave-types.api", () => ({
  leaveTypesApi: {
    list: vi.fn(),
  },
}));

vi.mock("@/api/leave-requests.api", () => ({
  leaveRequestsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/api/leave-balances.api", () => ({
  leaveBalancesApi: {
    list: vi.fn(),
  },
}));

vi.mock("@/api/config.api", () => ({
  configApi: {
    get: vi.fn(),
  },
}));

// Re-import mocked modules so we can control them in tests
import { departmentsApi } from "@/features/layout";
import { leaveTypesApi } from "@/api/leave-types.api";
import { leaveRequestsApi } from "@/api/leave-requests.api";
import { leaveBalancesApi } from "@/api/leave-balances.api";
import { configApi } from "@/api/config.api";

describe("useStore", () => {
  beforeEach(() => {
    useStore.setState({
      departments: [],
      leaveTypes: [],
      leaveRequests: [],
      leaveBalances: [],
      approvalConfigs: [],
    });
    vi.clearAllMocks();
  });

  it("loadData populates state", async () => {
    (departmentsApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          donViId: 1,
          maDonVi: "D1",
          tenDonVi: "Dept 1",
          tenVietTat: null,
        },
      ],
      error: null,
    });
    (leaveTypesApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          id: 1,
          name: "Annual",
          code: "AN",
          defaultDays: 12,
          description: null,
          isActive: true,
        },
      ],
      error: null,
    });
    (leaveRequestsApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          id: 1,
          userId: 1,
          leaveTypeId: 1,
          startDate: "2025-01-01",
          endDate: "2025-01-02",
          totalDays: 1,
          reason: null,
          status: "pending",
          approvedBy: null,
          approvedAt: null,
          rejectedReason: null,
          createdAt: "2025-01-01",
          updatedAt: null,
        },
      ],
      error: null,
    });
    (leaveBalancesApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          id: 1,
          userId: 1,
          year: 2025,
          totalDays: 12,
          usedDays: 0,
          remainingDays: 12,
          role: "QLNP.CB.PCM",
        },
      ],
      error: null,
    });
    (configApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          id: 1,
          leaveTypeId: 1,
          approvalLevel: 1,
          approverRole: "manager",
        },
      ],
      error: null,
    });

    await useStore.getState().loadData();

    const state = useStore.getState();
    expect(state.departments).toHaveLength(1);
    expect(state.leaveTypes).toHaveLength(1);
    expect(state.leaveRequests).toHaveLength(1);
    expect(state.leaveBalances).toHaveLength(1);
    expect(state.approvalConfigs).toHaveLength(1);
  });

  it("addLeaveRequest updates leaveRequests array", async () => {
    const newReq = {
      leaveTypeId: 1,
      startDate: "2025-02-01",
      endDate: "2025-02-02",
      totalDays: 1,
      reason: "sick",
    };
    const created = {
      id: 2,
      userId: 1,
      leaveTypeId: 1,
      startDate: "2025-02-01",
      endDate: "2025-02-02",
      totalDays: 1,
      reason: "sick",
      status: "pending",
      approvedBy: null,
      approvedAt: null,
      rejectedReason: null,
      createdAt: "2025-02-01",
      updatedAt: null,
    };
    (leaveRequestsApi.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: created,
      error: null,
    });

    await useStore.getState().addLeaveRequest(newReq);
    const state = useStore.getState();
    expect(state.leaveRequests).toContainEqual(created);
  });

  it("updateLeaveRequest patches existing request", async () => {
    useStore.setState({
      leaveRequests: [
        {
          id: 1,
          userId: 1,
          leaveTypeId: 1,
          startDate: "2025-01-01",
          endDate: "2025-01-02",
          totalDays: 1,
          reason: null,
          status: "pending",
          approvedBy: null,
          approvedAt: null,
          rejectedReason: null,
          createdAt: "2025-01-01",
          updatedAt: null,
        },
      ],
    });
    (leaveRequestsApi.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: undefined,
      error: null,
    });

    await useStore.getState().updateLeaveRequest(1, { reason: "updated reason" });
    const state = useStore.getState();
    expect(state.leaveRequests[0].reason).toBe("updated reason");
  });
});
