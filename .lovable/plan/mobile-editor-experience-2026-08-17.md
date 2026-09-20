# Mobile editor experience

On a phone the editor currently renders the desktop layout unchanged: the 240px note list and the document sit side by side, leaving the doc ~150px wide (one word per line), the header wraps into a lopsided two-row block, the document starts ~256px below the top, and the floating controls overlap the account row. Fix the layout for small screens.

## Changes

### 1. Note list becomes an overlay drawer (`src/pages/session.tsx`)
- Below the `md` breakpoint the note list is not a column in the flex row; it is a fixed, full-height overlay panel (max ~85vw) with a dimmed backdrop, opened by the existing header menu button and closed by tapping the backdrop, pressing Escape, or opening a note.
- Default closed on mobile (the persisted "open" preference only applies from `md` up), so the editor gets the full width on load.

### 2. Header fits one row (`src/components/layout/header-bar.tsx`, `src/pages/session.tsx`)
- Drop the `max-[600px]:flex-col` stacking that creates the two-row header; keep a single row with the title truncating.
- On mobile, "Share" and "Comments" become icon-only buttons (labelled with `aria-label`, unread badge kept); presence avatars cap to 2 + overflow count; format menu and note-options stay as icons.

### 3. Comments panel as a sheet on mobile (`src/components/layout/sidebar.tsx` usage in session)
- Instead of stealing 350px from a 390px screen, the comments panel renders as a full-width overlay sheet above the document, with its existing close control.
- The comment thread popover is capped to the viewport width so it can't overflow.

### 4. Document breathing room (`src/components/editor/notepad-content.tsx`)
- `py-64` becomes a mobile-appropriate top/bottom padding (about `py-10`) so the note content is visible immediately instead of below a screen of blank space; desktop spacing unchanged.
- Slightly tighter horizontal padding on the card so text lines get more width.

### 5. Floating bottom controls (`src/components/layout/bottom-controls.tsx`)
- Add safe-area bottom inset and reduced margin so the floating control pill never sits on top of the drawer footer/account row.

No changes to the Yjs document model, sync, or any backend policy — this is layout and presentation only.

## Verification
Playwright at 390x844 and 768x1024: open a note, check the doc card width, header on one row, drawer opens/closes as an overlay, comments sheet opens full width, no console errors.
