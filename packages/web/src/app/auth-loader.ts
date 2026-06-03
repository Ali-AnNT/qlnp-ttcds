import { redirect } from "react-router";
import { hasAccessToken } from "@/shared/lib/token-store";
import { ROUTES } from "./routes";

/**
 * Data-router guard for protected routes. Synchronously checks the access
 * token in localStorage; if missing, throws a redirect to /login.
 *
 * `hasAccessToken()` does not validate JWT — the AuthProvider still calls
 * `authApi.me()` to verify the token with the API. If that call fails,
 * the provider clears tokens and reloads to /login.
 */
export function authLoader() {
  if (!hasAccessToken()) {
    throw redirect(ROUTES.login);
  }
  return null;
}
