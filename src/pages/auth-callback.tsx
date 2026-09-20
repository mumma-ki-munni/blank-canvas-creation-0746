import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { consumeAuthReturnTo } from "@/lib/auth-redirect";

/**
 * OAuth return handler. The broker may send us back with either an implicit
 * fragment (`#access_token=…&refresh_token=…`) or an authorization code
 * (`?code=…`). Consume whichever strand is present, hydrate the Supabase
 * session, then land the user inside the app.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const code = new URLSearchParams(url.search).get("code");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(url.href);
          if (error) throw error;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session) {
          navigate(consumeAuthReturnTo() ?? "/notes", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Sign-in failed");
        setTimeout(() => navigate("/login", { replace: true }), 1500);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center text-sm text-muted-foreground">
        {error ? `Sign-in error: ${error}` : "Completing sign-in…"}
      </div>
    </div>
  );
}
