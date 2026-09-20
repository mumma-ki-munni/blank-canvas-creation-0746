/**
 * The words on every button that leads to the auth screen.
 *
 * The auth screen is one door, so the app must not describe it several ways on
 * the way in. This file is the one place those words live; every surface imports
 * from here. A page that hard-codes the label is a page that can drift.
 *
 * There are two jobs, and the job is decided by what the person loses by not
 * clicking — never by where the button sits:
 *
 *   ENTER    a visitor on a marketing surface (header, hero, bottom band)
 *   SAVE     a guest already inside the product (demo bar, shared note bar)
 *
 * See docs/design/auth-screen.md §5.
 */

export const AUTH_CTA = {
  /** Marketing surfaces. Aimed at new people; returning people are fine, because
   *  the screen it opens is the same one door for both. */
  enter: "Get started",
  /** Guests already looking at their own work. Says what signing in preserves —
   *  "Get started" would be a lie, they have already started. */
  save: "Sign in to save",
  /** The secondary that sits beside `enter`, wherever `enter` appears. */
  demo: "View demo",
} as const;
