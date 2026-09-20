# Landing Sign-in Button Polish

Make the landing page's "Sign in" button consistently white with a brand-gradient text treatment so it stays legible.

## What to change
- File: `src/pages/landing/components/hero-editor.tsx`
- Desktop header `Sign in` Link currently flips on scroll:
  - unscrolled: `bg-white brand-text brand-standard`
  - scrolled: `brand-fill brand-standard text-white`
- Change the scrolled state to match the white-background + gradient-text style (`bg-white` background + `.brand-text`/`.brand-standard` text), so the button is always legible.
- Add a subtle border in the scrolled state (`border border-border`) so the white button does not disappear against the white scrolled header.
- Apply the same white-bg / gradient-text treatment to the mobile menu `Sign in` Link for consistency.
- Preserve all existing sizing, hover, and focus behavior; do not change other footer/header copy or routing.

## Verification
- Run `npm run build` to confirm no TypeScript/Tailwind errors.
- Spot-check the landing page at the top and after a small scroll to confirm the button remains white with gradient text and clearly visible.