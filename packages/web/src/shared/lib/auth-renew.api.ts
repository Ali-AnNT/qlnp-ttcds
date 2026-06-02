/**
 * Auth Renew API — thin fetch wrapper for the external token renewal endpoint.
 * Matches dxcenter.vietinfo.tech/DesktopModules/MVC/Account/Login/RefreshToken.
 * Separated from business logic so it can be easily mocked in tests.
 */

export interface RenewRequest {
  refreshToken: string;
  accessToken: string;
  deviceId: string;
}

export interface RenewResponse {
  accessToken: string;
  tokenRenew: string;
}

const RENEW_URL = import.meta.env.VITE_AUTH_RENEW_URL;

/** POST refresh token to external auth API. Returns RenewResponse on success, null on failure. */
export async function renewTokenViaApi(
  req: RenewRequest
): Promise<RenewResponse | null> {
  if (!RENEW_URL) {
    return null;
  }

  try {
    const res = await fetch(RENEW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: req.refreshToken,
        accessToken: req.accessToken,
        deviceId: req.deviceId,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    // API returns loginStatus === 1 on success
    if (data?.loginStatus !== 1) return null;
    if (!data?.token || !data?.renewalToken) return null;

    return {
      accessToken: data.token,
      tokenRenew: data.renewalToken,
    };
  } catch {
    return null;
  }
}