import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock token-refresh before importing client
vi.mock("@/shared/lib/token-refresh", () => ({
  tryRenewToken: vi.fn().mockResolvedValue(false),
}));

// Mock token-store before importing client
vi.mock("@/shared/lib/token-store", () => ({
  getAccessToken: vi.fn(),
  hasAccessToken: vi.fn().mockReturnValue(true),
}));

import { api } from "@/shared/api/client";
import { tryRenewToken } from "@/shared/lib/token-refresh";
import { getAccessToken } from "@/shared/lib/token-store";

const mockedTryRenewToken = vi.mocked(tryRenewToken);
const mockedGetAccessToken = vi.mocked(getAccessToken);

describe("api client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
    mockedGetAccessToken.mockReturnValue("my-token");
    mockedTryRenewToken.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("get returns data on 200", async () => {
    const mockData = { id: 1, name: "test" };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 })
    );

    const res = await api.get<{ id: number; name: string }>("/test");
    expect(res.data).toEqual(mockData);
    expect(res.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it("post sends correct body and headers", async () => {
    const body = { name: "test" };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    await api.post("/test", body);
    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain("/test");
    expect(call[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  });

  it("get returns error on non-2xx", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("Not Found", { status: 404, statusText: "Not Found" })
    );

    const res = await api.get("/test");
    expect(res.data).toBeNull();
    expect(res.error).toBe("Not Found");
  });

  it("includes Authorization header when accessToken is available", async () => {
    mockedGetAccessToken.mockReturnValue("my-token");
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );

    await api.get("/test");
    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].headers["Authorization"]).toBe("Bearer my-token");
  });

  it("does not call tryRenewToken proactively before requests", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1 }), { status: 200 })
    );

    await api.get("/test");
    // tryRenewToken should NOT be called for a successful request
    expect(mockedTryRenewToken).not.toHaveBeenCalled();
  });

  it("returns network error on fetch exception", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("offline"));

    const res = await api.get("/test");
    expect(res.data).toBeNull();
    expect(res.error).toBe("offline");
  });

  it("on 401, attempts tryRenewToken and retries once with new token", async () => {
    mockedGetAccessToken
      .mockReturnValueOnce("expired-token")  // first call (original request)
      .mockReturnValueOnce("new-token");       // second call (retry after refresh)

    mockedTryRenewToken.mockResolvedValueOnce(true);

    // First call returns 401
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );
    // Retry call returns success
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1 }), { status: 200 })
    );

    const res = await api.get<{ id: number }>("/test");
    expect(res.data).toEqual({ id: 1 });
    expect(res.error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2); // original + retry
    expect(mockedTryRenewToken).toHaveBeenCalledTimes(1); // reactive only
  });

  it("on 401 when tryRenewToken fails, returns unauthorized error", async () => {
    mockedGetAccessToken.mockReturnValue("expired-token");
    // Renewal failed
    mockedTryRenewToken.mockResolvedValueOnce(false);

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );

    const res = await api.get("/test");
    expect(res.data).toBeNull();
    expect(res.error).toBe("Unauthorized");
    expect(fetch).toHaveBeenCalledTimes(1); // no retry
  });
});