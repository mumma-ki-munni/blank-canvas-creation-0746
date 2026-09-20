# Landing polish: logo strip heading, footer legal links, nav CTA

## 1. Social proof heading on the logo strip
In `src/pages/landing/components/logo-wall.tsx`, add a small centered eyebrow heading above the wordmark row (e.g. "Trusted by teams who write together"), styled as muted uppercase small text with spacing below, so the row reads as a demo logo strip. Keep the existing gradient background and logos.

## 2. Remove legal pages links
In `src/pages/landing/components/footer.tsx`, remove the "Privacy" and "Terms" links. Keep the wordmark, "Contact", and the copyright line.

## 3. Nav CTA
In `src/pages/landing/components/hero-editor.tsx`:
- Change the desktop header button label from "Sign in" to "Get started" (mobile menu version matches).
- Keep the unscrolled state as-is (white pill, gradient text).
- On scroll, switch to a gradient background fill with white text (`brand-fill` + `text-white`) instead of the white pill, dropping the border.

Routing stays `/login`. No other copy or styling changes.
