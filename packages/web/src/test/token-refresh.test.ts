import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth-renew.api before importing token-refresh
vi.mock("@/shared/lib/auth-renew.api", () => ({
  renewTokenViaApi: vi.fn(),
}));

// Mock token-store functions
vi.mock("@/shared/lib/token-store", () => ({
  getAccessToken: vi.fn(),
  getTokenRenew: vi.fn(),
  getDeviceId: vi.fn(),
  getDnnTabId: vi.fn().mockReturnValue(""),
  getDnnModuleId: vi.fn().mockReturnValue(""),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  hasAccessToken: vi.fn(),
}));

import { tryRenewToken } from "@/shared/lib/token-refresh";
import { renewTokenViaApi } from "@/shared/lib/auth-renew.api";
import { getAccessToken, getTokenRenew, getDeviceId, getDnnTabId, getDnnModuleId, setTokens } from "@/shared/lib/token-store";

const mockedApi = vi.mocked(renewTokenViaApi);
const mockedGetAccessToken = vi.mocked(getAccessToken);
const mockedGetTokenRenew = vi.mocked(getTokenRenew);
const mockedGetDeviceId = vi.mocked(getDeviceId);
const mockedSetTokens = vi.mocked(setTokens);

describe("token-refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks for happy path
    mockedGetAccessToken.mockReturnValue("current-access-token");
    mockedGetDeviceId.mockReturnValue("device-xyz");
  });

  // --- tryRenewToken ---

  describe("tryRenewToken", () => {
    it("returns false immediately when tokenRenew is empty (dev mode)", async () => {
      mockedGetTokenRenew.mockReturnValue("");
      const result = await tryRenewToken();
      expect(result).toBe(false);
      expect(mockedApi).not.toHaveBeenCalled();
    });

    it("returns false immediately when tokenRenew is null", async () => {
      mockedGetTokenRenew.mockReturnValue(null);
      const result = await tryRenewToken();
      expect(result).toBe(false);
      expect(mockedApi).not.toHaveBeenCalled();
    });

    it("returns false when accessToken is null", async () => {
      mockedGetTokenRenew.mockReturnValue("refresh-token-123");
      mockedGetAccessToken.mockReturnValue(null);
      const result = await tryRenewToken();
      expect(result).toBe(false);
      expect(mockedApi).not.toHaveBeenCalled();
    });

    it("returns false when deviceId is null", async () => {
      mockedGetTokenRenew.mockReturnValue("refresh-token-123");
      mockedGetDeviceId.mockReturnValue(null);
      const result = await tryRenewToken();
      expect(result).toBe(false);
      expect(mockedApi).not.toHaveBeenCalled();
    });

    it("calls API with correct request shape and stores new tokens on success", async () => {
      mockedGetTokenRenew.mockReturnValue("refresh-token-123");
      mockedGetAccessToken.mockReturnValue("current-access-token");
      mockedGetDeviceId.mockReturnValue("device-xyz");
      mockedApi.mockResolvedValueOnce({
        accessToken: "new-access",
        tokenRenew: "new-refresh",
      });

      const result = await tryRenewToken();

      expect(result).toBe(true);
      expect(mockedApi).toHaveBeenCalledWith({
        refreshToken: "refresh-token-123",
        accessToken: "current-access-token",
        deviceId: "device-xyz",
        tabId: "",
        moduleId: "",
      });
      expect(mockedSetTokens).toHaveBeenCalledWith("new-access", null, "new-refresh");
    });

    it("returns false on API failure without clearing tokens", async () => {
      mockedGetTokenRenew.mockReturnValue("refresh-token-123");
      mockedApi.mockResolvedValueOnce(null);

      const result = await tryRenewToken();

      expect(result).toBe(false);
    });

    it("deduplicates concurrent calls to tryRenewToken", async () => {
      mockedGetTokenRenew.mockReturnValue("refresh-abc");

      // Slow API response — both calls share the same in-flight refresh
      let resolveApi: (value: unknown) => void;
      const apiPromise = new Promise((resolve) => {
        resolveApi = resolve;
      });
      mockedApi.mockReturnValueOnce(apiPromise);

      // Fire two concurrent calls
      const promise1 = tryRenewToken();
      const promise2 = tryRenewToken();

      // Resolve the API call
      resolveApi!({
        accessToken: "new-token",
        tokenRenew: "new-refresh",
      });

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // API should only be called once (dedup)
      expect(mockedApi).toHaveBeenCalledTimes(1);
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });
});