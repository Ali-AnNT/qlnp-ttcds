import { describe, it, expect, vi } from "vitest";
import { leaveTypesApi } from "../api/leave-types.api";
import { api } from "@/shared/api/client";

vi.mock("@/shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("leaveTypesApi", () => {
  const mockType = {
    id: 1,
    name: "Annual",
    code: "AN",
    defaultDays: 12,
    description: null,
    isActive: true,
  };

  it("list calls api.get with /leave-types", async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [mockType],
      error: null,
    });
    const res = await leaveTypesApi.list();
    expect(api.get).toHaveBeenCalledWith("/leave-types");
    expect(res.data).toEqual([mockType]);
  });

  it("get calls api.get with id", async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockType,
      error: null,
    });
    await leaveTypesApi.get(1);
    expect(api.get).toHaveBeenCalledWith("/leave-types/1");
  });

  it("create calls api.post with data", async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockType,
      error: null,
    });
    const payload = {
      name: "Annual",
      code: "AN",
      defaultDays: 12,
      description: null,
      isActive: true,
    };
    await leaveTypesApi.create(payload);
    expect(api.post).toHaveBeenCalledWith("/leave-types", payload);
  });

  it("update calls api.put with id and data", async () => {
    (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockType,
      error: null,
    });
    await leaveTypesApi.update(1, { name: "Updated" });
    expect(api.put).toHaveBeenCalledWith("/leave-types/1", { name: "Updated" });
  });

  it("delete calls api.delete with id", async () => {
    (api.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: undefined,
      error: null,
    });
    await leaveTypesApi.delete(1);
    expect(api.delete).toHaveBeenCalledWith("/leave-types/1");
  });
});
