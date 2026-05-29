const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8003/api";

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

interface ResultEnvelope<T> {
  success: boolean;
  data: T | null;
  message?: string | null;
  errors?: string[] | null;
}

function getJwt(): string | null {
  return localStorage.getItem("jwt");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const jwt = getJwt();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const errBody = await res.text();
      return { data: null, error: errBody || `HTTP ${res.status}` };
    }
    const raw = await res.json();
    // Unwrap Result<T> envelope from backend
    if (typeof raw.success === "boolean") {
      if (raw.success) {
        return { data: raw.data as T, error: null };
      }
      const msg = raw.message || "Request failed";
      const errs = raw.errors?.length ? raw.errors.join("; ") : "";
      return { data: null, error: errs ? `${msg}: ${errs}` : msg };
    }
    return { data: raw as T, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Network error" };
  }
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
