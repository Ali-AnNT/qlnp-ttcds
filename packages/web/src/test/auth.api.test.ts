import { describe, it, expect, vi } from "vitest";
import { authApi } from "../api/auth.api";
import { api } from "../api/client";

vi.mock("../api/client", () => ({
  api: {
    get: vi.fn(),
  },
}));

describe("authApi", () => {
  it("me calls api.get with /auth/me", async () => {
    const mockUser = {
      userId: 1,
      userName: "u1",
      fullName: "User 1",
      donViId: 2,
      role: "admin",
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockUser,
      error: null,
    });

    const res = await authApi.me();
    expect(api.get).toHaveBeenCalledWith("/auth/me");
    expect(res.data).toEqual(mockUser);
  });
});
