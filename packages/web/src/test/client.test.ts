import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "../api/client";

describe("api client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it("includes Authorization header when jwt is in localStorage", async () => {
    localStorage.setItem("jwt", "my-token");
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );

    await api.get("/test");
    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].headers["Authorization"]).toBe("Bearer my-token");
  });

  it("returns network error on fetch exception", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("offline"));

    const res = await api.get("/test");
    expect(res.data).toBeNull();
    expect(res.error).toBe("offline");
  });
});
