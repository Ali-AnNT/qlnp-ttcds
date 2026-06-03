import { describe, it, expect, beforeEach } from "vitest";
import {
  getAccessToken,
  getTokenRenew,
  setTokens,
  clearTokens,
  hasAccessToken,
  getDeviceId,
} from "@/shared/lib/token-store";

describe("token-store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // --- getAccessToken ---

  it("getAccessToken returns null when not set", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("setTokens writes accessToken and getAccessToken reads it back", () => {
    setTokens("abc123", Date.now() + 60_000, "renew-token");
    expect(getAccessToken()).toBe("abc123");
  });

  // --- getTokenRenew ---

  it("getTokenRenew returns null when not set", () => {
    expect(getTokenRenew()).toBeNull();
  });

  it("getTokenRenew returns value after setTokens", () => {
    setTokens("t", Date.now() + 60_000, "renew-xyz");
    expect(getTokenRenew()).toBe("renew-xyz");
  });

  // --- setTokens with all 3 args ---

  it("setTokens writes all 3 keys", () => {
    const exp = Date.now() + 60_000;
    setTokens("access-val", exp, "renew-val");
    expect(localStorage.getItem("accessToken")).toBe("access-val");
    expect(localStorage.getItem("accessTokenExp")).toBe(String(exp));
    expect(localStorage.getItem("tokenRenew")).toBe("renew-val");
  });

  // --- setTokens with optional args (backward compat) ---

  it("setTokens works with only accessToken (no expiry, no renew)", () => {
    setTokens("just-access");
    expect(localStorage.getItem("accessToken")).toBe("just-access");
    expect(localStorage.getItem("accessTokenExp")).toBeNull();
    expect(localStorage.getItem("tokenRenew")).toBeNull();
  });

  it("setTokens works with accessToken + expiry but no renew", () => {
    const exp = Date.now() + 60_000;
    setTokens("access-exp", exp);
    expect(localStorage.getItem("accessToken")).toBe("access-exp");
    expect(localStorage.getItem("accessTokenExp")).toBe(String(exp));
    expect(localStorage.getItem("tokenRenew")).toBeNull();
  });

  // --- clearTokens ---

  it("clearTokens removes all auth keys", () => {
    setTokens("t", Date.now() + 60_000, "r");
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem("accessTokenExp")).toBeNull();
    expect(getTokenRenew()).toBeNull();
  });

  // --- hasAccessToken ---

  it("hasAccessToken returns false when no token", () => {
    expect(hasAccessToken()).toBe(false);
  });

  it("hasAccessToken returns true when token exists", () => {
    setTokens("token-val", Date.now() + 60_000, "r");
    expect(hasAccessToken()).toBe(true);
  });

  it("hasAccessToken returns false after clearTokens", () => {
    setTokens("t", Date.now() + 60_000, "r");
    clearTokens();
    expect(hasAccessToken()).toBe(false);
  });

  // --- getDeviceId ---

  it("getDeviceId returns null when MachineId not set", () => {
    expect(getDeviceId()).toBeNull();
  });

  it("getDeviceId returns value set by parent site", () => {
    localStorage.setItem("MachineId", "device-abc");
    expect(getDeviceId()).toBe("device-abc");
  });

  it("clearTokens does not remove MachineId", () => {
    setTokens("t", Date.now() + 60_000, "r");
    localStorage.setItem("MachineId", "device-xyz");
    clearTokens();
    expect(getDeviceId()).toBe("device-xyz");
    expect(getAccessToken()).toBeNull();
  });
});