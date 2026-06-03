import { getAccessToken } from "../lib/token-store";
import { tryRenewToken } from "../lib/token-refresh";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8003/api";

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

function extractErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed === "object" && parsed !== null) {
      // Backend Result<T> envelope (camelCase from FastEndpoints)
      if ("success" in parsed) {
        const env = parsed as { success: boolean; message?: string; errors?: string[] };
        const msg = env.message || "Request failed";
        const errs = env.errors?.length ? env.errors.join("; ") : "";
        return errs ? `${msg}: ${errs}` : msg;
      }
      // Fallback: try common error fields
      if ("message" in parsed) return String(parsed.message);
      if ("error" in parsed) return String(parsed.error);
    }
    return body;
  } catch {
    return body || "Request failed";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    // On 401: try to renew token and retry once
    if (res.status === 401) {
      const renewed = await tryRenewToken();
      if (renewed) {
        const newToken = getAccessToken();
        const retryHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string>),
        };
        if (newToken) retryHeaders["Authorization"] = `Bearer ${newToken}`;

        const retryRes = await fetch(`${API_URL}${path}`, {
          ...options,
          headers: retryHeaders,
        });

        if (!retryRes.ok) {
          const errBody = await retryRes.text();
          return { data: null, error: extractErrorMessage(errBody) || `HTTP ${retryRes.status}` };
        }
        const raw = await retryRes.json();
        return unwrapEnvelope<T>(raw);
      }
      // Renewal failed — return unauthorized error
      return { data: null, error: "Unauthorized" };
    }

    if (!res.ok) {
      const errBody = await res.text();
      return { data: null, error: extractErrorMessage(errBody) || `HTTP ${res.status}` };
    }

    const raw = await res.json();
    return unwrapEnvelope<T>(raw);
  } catch (e: unknown) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

/** Unwrap backend Result<T> envelope if present */
function unwrapEnvelope<T>(raw: unknown): ApiResponse<T> {
  if (typeof raw === "object" && raw !== null && "success" in raw) {
    const envelope = raw as { success: boolean; data?: unknown; message?: string; errors?: string[] };
    if (envelope.success) {
      return { data: envelope.data as T, error: null };
    }
    const msg = envelope.message || "Request failed";
    const errs = envelope.errors?.length ? envelope.errors.join("; ") : "";
    return { data: null, error: errs ? `${msg}: ${errs}` : msg };
  }
  return { data: raw as T, error: null };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export type { ApiResponse };
