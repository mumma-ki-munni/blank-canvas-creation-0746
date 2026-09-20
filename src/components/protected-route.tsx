import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth";

/**
 * Gates authenticated app routes. Redirects unauthenticated users to `/login`
 * (this template's auth screen) and preserves the attempted location in
 * `state.from` so the login page can send them back after signing in.
 *
 * NOTE: `/session/:id` is intentionally NOT wrapped by this — the editor is a
 * public, guest-capable route. Only `/notes` (and future app routes) are gated.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While the initial session hydrates, hold with a static skeleton — never
  // flash the login page for an already-authenticated user.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-3 p-8" aria-hidden>
          <div className="h-4 w-3/4 rounded bg-accent" />
          <div className="h-4 w-1/2 rounded bg-accent" />
          <div className="h-4 w-2/3 rounded bg-accent" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
