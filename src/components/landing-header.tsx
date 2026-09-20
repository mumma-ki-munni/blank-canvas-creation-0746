import { Link, useLocation } from "react-router-dom";
import { DEMO_URL } from "@/lib/demo-link";
import { useState, useCallback, useEffect } from "react";
import { Icon } from "@/components/base/icon";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { Sheet, SheetClose, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AUTH_CTA } from "@/lib/auth-cta";

/**
 * Shared marketing navigation — rendered on the landing page and on auth
 * surfaces so the brand chrome stays consistent across entry points.
 */
export function LandingHeader() {
  /**
   * On the auth screen, drop the auth CTA.
   *
   * "Get started" points AT this screen, so rendering it here is a button to
   * the page you are already on — docs/design/auth-and-navigation.md §5 names
   * that one, and the auth-screen rule checks for it (check 12).
   *
   * The wordmark and the demo link stay: the way BACK to the marketing page and
   * the way to look around are both still useful from here. This is the whole
   * reason the header is shared rather than hidden on auth.
   */
  const { pathname } = useLocation();
  const onAuth = pathname.toLowerCase().startsWith("/login");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[12] h-[70px] transition-all duration-300",
        scrolled
          ? "bg-white shadow-[0_0_1.8rem_rgba(0,0,0,0.08)]"
          : "bg-transparent shadow-[0_0_1.8rem_transparent]",
      )}
    >
      <nav className="mx-auto flex h-full max-w-[1380px] items-center justify-between px-6">
        <Link
          to="/"
          className={cn(
            // One line, always: the name truncates rather than wrapping the bar.
            "min-w-0 flex-1 truncate text-lg font-bold tracking-tight",
            scrolled ? "text-foreground" : "text-white",
          )}
        >
          Notepad
        </Link>
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            to={DEMO_URL}
            className={cn(
              "flex h-9 items-center rounded-lg border px-4 text-sm font-semibold transition-colors",
              scrolled
                ? "brand-text brand-lite border-border"
                : "border-white/40 text-white hover:bg-white/10",
            )}
          >
            {AUTH_CTA.demo}
          </Link>
          {!onAuth && (
            <Link
              to="/login"
              data-spec="cta-primary"
              className={cn(
                "flex h-9 items-center rounded-lg px-4 text-sm font-semibold transition-colors",
                scrolled
                  ? "brand-fill text-white hover:opacity-90"
                  : "brand-pill brand-standard hover:opacity-90",
              )}
            >
              <span>{AUTH_CTA.enter}</span>
            </Link>
          )}
        </div>
        <MobileMenu onAuth={onAuth} scrolled={scrolled} />
      </nav>
    </header>
  );
}

/** The measured motion (docs/design/mobile-menu.md). Inline style, not a
 *  Tailwind class: inline always wins, and Tailwind silently drops ambiguous
 *  ease-[cubic-bezier(...)] classes. */
const SHEET_MOTION = {
  animationDuration: "320ms",
  animationTimingFunction: "cubic-bezier(0.4, 0, 0.6, 1)",
} as const;
const ICON_MOTION = {
  animationDuration: "200ms",
  animationTimingFunction: "cubic-bezier(0.4, 0, 0.6, 1)",
} as const;

/**
 * ☰ → full-height sheet sliding in from the right, leaving a 64px finger strip
 * of light scrim that closes it (as do ✕, the scrim anywhere, and Esc).
 * Scale per docs/design/mobile-menu.md: 54px full-bleed rows, -3px margin,
 * 48px inset inside the row, 28px/600/32 type, 320ms cubic-bezier(0.4,0,0.6,1).
 *
 * Built on the vendored Sheet primitive (Radix dialog): the portal renders the
 * sheet at the body root, so no ancestor filter/transform/sticky can re-anchor
 * it; Esc, scrim-close, scroll lock, and the focus trap come from Radix.
 * The morph is two halves of one visual button: ☰ lives in the bar and spins
 * out on open; ✕ lives INSIDE the portal (Radix blocks clicks outside the open
 * dialog) positioned exactly over the trigger's spot, and spins in.
 */
function MobileMenu({ onAuth, scrolled }: { onAuth: boolean; scrolled: boolean }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="sm:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        {/* The ☰ half of the morphing trigger — in the bar's icon spot. */}
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open menu"
            className={cn(
              "relative -mr-2 flex h-11 w-11 items-center justify-center",
              scrolled ? "text-foreground" : "text-white",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "grid place-items-center transition-all [transition-duration:200ms] [transition-timing-function:cubic-bezier(0.4,0,0.6,1)] motion-reduce:transition-none",
                open ? "-rotate-180 opacity-0" : "rotate-0 opacity-100",
              )}
            >
              <Icon name="menu" size={24} />
            </span>
          </button>
        </SheetTrigger>

        <SheetPortal>
          {/* Scrim — light, full viewport. Radix closes on click. */}
          <SheetOverlay
            className="z-[55] bg-white/50 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none"
            style={SHEET_MOTION}
          />

          {/* The sheet wears the hero (the --cta-grad the bar sits on), so
              the open menu reads as the bar unfolding —
              docs/design/mobile-menu.md rule 5a. */}
          <SheetPrimitive.Content
            aria-describedby={undefined}
            className={cn(
              "group fixed inset-y-0 right-0 z-[55] flex w-[calc(100%-64px)] flex-col text-white shadow-xl outline-none",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right motion-reduce:animate-none",
            )}
            style={{ ...SHEET_MOTION, background: "var(--cta-grad)" }}
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>

            {/* The ✕ half of the morph — fixed over the bar trigger's spot. */}
            <SheetClose
              aria-label="Close menu"
              className="fixed right-2 top-0 flex h-11 w-11 items-center justify-center text-white outline-none"
            >
              <span
                aria-hidden
                className={cn(
                  "grid place-items-center motion-reduce:animate-none",
                  "group-data-[state=open]:animate-in group-data-[state=open]:[--tw-enter-rotate:180deg] group-data-[state=open]:[--tw-enter-opacity:0]",
                  "group-data-[state=closed]:animate-out group-data-[state=closed]:[--tw-exit-rotate:180deg] group-data-[state=closed]:[--tw-exit-opacity:0]",
                )}
                style={ICON_MOTION}
              >
                <Icon name="close" size={24} />
              </span>
            </SheetClose>

            {/* Top zone: 2× the header bar, the ✕ floats in its first half. */}
            <div className="h-[140px] shrink-0" />

            {/* Routes — where you can go. The row is the box: full-bleed, tappable
                edge to edge, inset carried as padding inside it. */}
            <div className="flex flex-col space-y-[-3px]">
              <Link
                to="/"
                onClick={close}
                className="flex h-[54px] w-full items-center justify-end px-12 text-[28px] font-semibold leading-8 tracking-tight"
              >
                Home
              </Link>
            </div>

            {/* Actions — the doors. Fluid pills, pinned to the bottom. */}
            <div className="mt-auto flex flex-col gap-3 px-12 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <Link
                to={DEMO_URL}
                onClick={close}
                className="flex h-11 items-center justify-center rounded-lg border border-white/40 text-base font-semibold text-white"
              >
                {AUTH_CTA.demo}
              </Link>
              {!onAuth && (
                <Link
                  to="/login"
                  onClick={close}
                  className="brand-pill brand-standard flex h-11 items-center justify-center rounded-lg text-base font-semibold"
                >
                  {AUTH_CTA.enter}
                </Link>
              )}
            </div>
          </SheetPrimitive.Content>
        </SheetPortal>
      </Sheet>
    </div>
  );
}
