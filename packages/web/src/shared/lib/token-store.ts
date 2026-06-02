/**
 * Token Store — single source of truth for auth token localStorage operations.
 * No other module should read/write auth token keys directly.
 */

const ACCESS_TOKEN_KEY = "accessToken";
const ACCESS_TOKEN_EXP_KEY = "accessTokenExp";
const TOKEN_RENEW_KEY = "tokenRenew";
const MACHINE_ID_KEY = "MachineId";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getTokenRenew(): string | null {
  return localStorage.getItem(TOKEN_RENEW_KEY);
}

/** Write auth keys to localStorage. accessTokenExp is kept for portal compat but optional. */
export function setTokens(
  accessToken: string,
  accessTokenExp?: number | null,
  tokenRenew?: string | null
): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (accessTokenExp != null) {
    localStorage.setItem(ACCESS_TOKEN_EXP_KEY, String(accessTokenExp));
  }
  if (tokenRenew != null) {
    localStorage.setItem(TOKEN_RENEW_KEY, tokenRenew);
  }
}

/** Remove all auth keys */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_EXP_KEY);
  localStorage.removeItem(TOKEN_RENEW_KEY);
}

/** Check if an access token exists in storage (no expiry check) */
export function hasAccessToken(): boolean {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
}

/** Read device ID set by parent site (localStorage key "MachineId") */
export function getDeviceId(): string | null {
  return localStorage.getItem(MACHINE_ID_KEY);
}