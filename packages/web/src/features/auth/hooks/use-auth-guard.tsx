import { Navigate } from "react-router-dom";
import { useAuth } from "./use-auth";

/** Redirects unauthenticated users to /login. Shows loading state while auth resolves. */
export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};