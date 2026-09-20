# Fix invisible CTA buttons on the orange gradient sections

## What's wrong

On the homepage, the "Sign in" button in the header (over the hero) and the "Sign in" button in the "Ready to write together?" band look like they have no button at all — orange text on orange, effectively invisible. The hero's "View demo" pill has the same underlying issue.

Cause (confirmed in the CSS): those buttons combine a white background with the `.brand-text` gradient-text class. `.brand-text` sets `background-clip: text`, which clips the element's *entire* background — including the white fill — down to the letter shapes. So the white pill is erased and only gradient-colored glyphs remain, sitting on the gradient background.

## The fix

Add a proper "white pill + gradient text" treatment in `src/base.css` so the intended inverted style actually renders: paint two background layers on the button — the brand gradient clipped to the text, and a solid white layer clipped normally behind it. The white pill stays, the label keeps its gradient fill.

Apply that treatment to the affected homepage CTAs:
- Header "Sign in" (both hero state and scrolled state, plus the mobile menu version)
- Hero "View demo" pill
- "Ready to write together?" band "Sign in"

The outline-style "View demo" buttons that are white-border/white-text on gradient stay as they are — they are already legible.

## Technical notes

- New class in `src/base.css` next to the existing `.brand-*` mechanics, e.g. `.brand-pill`: `background-image: var(--brand-grad, var(--cta-grad)), linear-gradient(#fff,#fff); background-clip: text, border-box;` with transparent text fill.
- Swap `bg-white brand-text brand-standard` for `brand-pill brand-standard` on the buttons listed above in `src/pages/landing/components/hero-editor.tsx` and `src/pages/landing/components/cta-signup.tsx`.
- Verify with a screenshot of the hero and CTA band, then `npm run build`.
