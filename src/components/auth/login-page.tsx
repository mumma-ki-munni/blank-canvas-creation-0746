import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "./auth-provider";
import { SocialAuthButtons } from "@/components/base/social-auth-buttons";
import { LandingHeader } from "@/components/landing-header";
import { consumeAuthReturnTo, setAuthReturnTo } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

/**
 * Two steps, and the first one has no fields.
 *
 * Step 1 is the chooser: a heading and three buttons on the brand gradient,
 * nothing else. Someone arriving has one decision to make — which door — and a
 * form makes them read the screen before they can act.
 *
 * Step 2 is the email form, and it replaces the column in place (`?step=email`,
 * so the browser's own Back button walks back to the chooser). See
 * docs/design/auth-screen.md.
 */

const FIELD = cn(
  "h-11 w-full rounded-lg border border-white/25 bg-white px-3 text-sm text-foreground",
  "outline-none placeholder:text-muted-foreground focus:border-white",
);

export function LoginPage() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // A guest sent here from a shared note carries the note path in router state;
  // mirror it into sessionStorage so it also survives the OAuth redirect.
  useEffect(() => {
    const from = (location.state as { from?: string } | null)?.from;
    if (from && from !== "/session/new") setAuthReturnTo(from);
  }, [location.state]);

  useEffect(() => {
    // Return to the note the user came from, otherwise land in the workspace.
    if (user) navigate(consumeAuthReturnTo() ?? "/notes", { replace: true });
  }, [user, navigate]);

  // The step lives in the URL, so Back is the browser's job, not ours.
  const [searchParams, setSearchParams] = useSearchParams();
  const onEmailStep = searchParams.get("step") === "email";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password, name || undefined);

    if (result.error) {
      setError(result.error.message);
    }
    setSubmitting(false);
  }, [mode, email, password, name, signIn, signUp]);

  const handleToggleMode = useCallback(() => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(null);
  }, []);

  const handleOpenEmail = useCallback(() => {
    setError(null);
    setSearchParams({ step: "email" });
  }, [setSearchParams]);

  const handleBackToChoices = useCallback(() => {
    setError(null);
    setSearchParams({});
  }, [setSearchParams]);

  return (
    <div className="brand-fill relative min-h-screen">
      <LandingHeader />
      <div className="flex min-h-screen items-center justify-center px-6 py-[70px]">
        {/* The heading gets a wider box than the buttons so it can hold two
            lines; the controls stay at one button width. */}
        <div className="flex w-full max-w-[340px] flex-col items-center">
          {onEmailStep ? (
            <>
              <h1 className="text-center text-[28px] font-semibold leading-[1.25] tracking-[-0.02em] text-white">
                {mode === "signin" ? "What’s your email?" : "Create your account"}
              </h1>
              <p className="mb-8 mt-2 text-center text-sm leading-[1.4] text-white/80">
                {mode === "signin"
                  ? "The one you signed up with."
                  : "We only use it to sign you in."}
              </p>

              <form onSubmit={handleSubmit} className="flex w-full max-w-[280px] flex-col gap-3">
                {mode === "signup" && (
                  <input
                    type="text"
                    placeholder="Display name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={FIELD}
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                  className={FIELD}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className={FIELD}
                />

                {error && <p className="text-center text-sm text-white">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "mt-1 flex h-11 w-full items-center justify-center rounded-lg bg-white",
                    // Solid brand text, NOT the .brand-pill gradient clip: that
                    // gradient starts at white, so on a white pill the label
                    // fades out. Same reason the header CTA reads faint.
                    "text-[15px] font-semibold text-primary",
                    "transition-opacity hover:opacity-90 disabled:opacity-60",
                  )}
                >
                  {submitting ? "…" : mode === "signin" ? "Continue" : "Create account"}
                </button>
              </form>

              <button
                type="button"
                onClick={handleBackToChoices}
                className="mt-6 w-full max-w-[280px] text-center text-sm text-white/80 transition-colors hover:text-white"
              >
                Back
              </button>
            </>
          ) : (
            <>
              {/* Two lines, held by explicit breaks — a third line pushes the
                  buttons off centre and reads as a paragraph, not a welcome. */}
              <h1 className="mb-14 text-center text-[28px] font-semibold leading-[1.25] tracking-[-0.02em] text-white">
                {mode === "signin" ? (
                  <>
                    Say hello to Notepad,
                    <br />
                    your shared workspace
                  </>
                ) : (
                  <>
                    Start writing together
                    <br />
                    on one shared page
                  </>
                )}
              </h1>

              <div className="w-full max-w-[280px]">
                {/* The ONE brand-compliant SSO button set. Do not restyle or rebuild
                    inline — see docs/design/auth-screen.md. */}
                <SocialAuthButtons mode={mode} />

                {/* Email is the quietest door on purpose — but it is still a
                    button, so it gets a shape. Bare text on the gradient read as
                    a stray label. The outline is the one the header already uses
                    for "View demo", so the three tiers are: solid white, solid
                    black, outline. */}
                <button
                  type="button"
                  onClick={handleOpenEmail}
                  className="mt-3 flex h-11 w-full items-center justify-center rounded-lg border border-white/40 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
                >
                  {mode === "signin" ? "Continue with Email" : "Sign up with Email"}
                </button>

                <p className="mt-10 text-center text-sm text-white/80">
                  {mode === "signin" ? "No account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={handleToggleMode}
                    className="cursor-pointer font-medium text-white underline"
                  >
                    {mode === "signin" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
