/**
 * Token Refresh Logic — reactive renewal on 401 with dedup lock.
 * Only refreshes when the API rejects a token (401), not proactively
 * based on expiry time. This avoids issues with mismatched epoch formats
 * (seconds vs milliseconds) set by the SSO portal.
 */

import {
  getAccessToken,
  getTokenRenew,
  getDeviceId,
  getDnnTabId,
  getDnnModuleId,
  setTokens,
} from "./token-store";
import { renewTokenViaApi } from "./auth-renew.api";

/** Module-level dedup lock: concurrent callers share one in-flight refresh */
let refreshPromise: Promise<boolean> | null = null;

/** Attempt token renewal via external API. Returns true on success. */
export async function renewToken(): Promise<boolean> {
  const refreshToken = getTokenRenew();
  if (!refreshToken) return false;

  const accessToken = getAccessToken();
  const deviceId = getDeviceId();
  // Both accessToken and deviceId are required by the renew API
  if (!accessToken || !deviceId) return false;

  const tabId = getDnnTabId();
  const moduleId = getDnnModuleId();
  const response = await renewTokenViaApi({ refreshToken, accessToken, deviceId, tabId, moduleId });
  if (response) {
    setTokens(response.accessToken, null, response.tokenRenew);
    return true;
  }

  return false;
}

/**
 * Try to renew the token. Returns true if renewal succeeded (new token available).
 * Returns false if no renew token exists or renewal failed.
 * Deduplicates concurrent calls.
 */
export async function tryRenewToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = renewToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}