import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { authApi } from "../api/auth.api";
import type { AuthUser } from "../api/types";
import { hasAccessToken, clearTokens } from "@/shared/lib/token-store";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
  retryAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  logout: () => {},
  retryAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    logout: () => {},
    retryAuth: async () => {},
  });

  const logout = useCallback(() => {
    clearTokens();
    window.location.href = "/login";
  }, []);

  const fetchUser = useCallback(async () => {
    const { data, error } = await authApi.me();
    if (!error && data) {
      setState((s) => ({ ...s, user: data, loading: false }));
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  /** Re-check localStorage for a token and attempt to fetch user */
  const retryAuth = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    if (hasAccessToken()) {
      await fetchUser();
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [fetchUser]);

  useEffect(() => {
    // On mount: if a token exists in localStorage, try to fetch user.
    // If no token, skip directly to login screen.
    if (hasAccessToken()) {
      fetchUser();
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Storage event listener: parent site changes token → refetch user
  // Debounce: parent sets keys in sequence, only fetch once
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handler = (e: StorageEvent) => {
      if (
        e.key === "accessToken" ||
        e.key === "accessTokenExp" ||
        e.key === "tokenRenew"
      ) {
        clearTimeout(timer);
        timer = setTimeout(fetchUser, 100);
      }
    };
    window.addEventListener("storage", handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", handler);
    };
  }, [fetchUser]);

  // Keep function references fresh in state
  useEffect(() => {
    setState((s) => ({ ...s, logout, retryAuth }));
  }, [logout, retryAuth]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};