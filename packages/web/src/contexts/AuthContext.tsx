import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { authApi, type AuthUser } from "@/api/auth.api";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  isEmbed: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true, isEmbed: false });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, isEmbed: false });

  const fetchUser = useCallback(async () => {
    const { data, error } = await authApi.me();
    if (!error && data) {
      setState({ user: data, loading: false, isEmbed: window.self !== window.top });
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    const isEmbed = window.self !== window.top;
    if (isEmbed) {
      setState((s) => ({ ...s, isEmbed: true }));
    }

    const handler = (event: MessageEvent) => {
      if (event.data?.type === "auth" && event.data?.token) {
        localStorage.setItem("jwt", event.data.token);
        fetchUser();
      }
    };
    window.addEventListener("message", handler);
    fetchUser();
    return () => window.removeEventListener("message", handler);
  }, [fetchUser]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};
