# Add an "Aa" block-format menu to the selection toolbar

The floating selection toolbar today only offers inline marks (bold, italic, underline, strike, highlight, code, link, comment). Headings and lists are only reachable from the header "Aa" menu or the slash menu. Add the same "Aa" entry point to the inline toolbar so a selection can be turned into a heading, list, quote or code block in place.

## What it looks like

- A new first control in the bubble menu labelled **Aa** (text, same height as the icon buttons), followed by a thin divider, then the existing mark buttons.
- Clicking it opens a small dropdown with block types, matching the slash-menu wording and icons:
  Paragraph · Heading 1 · Heading 2 · Heading 3 · Bullet list · Numbered list · Quote · Code block.
- The block type the selection currently uses is shown as active (highlighted row with a check), same treatment as the header "Aa" menu.
- Choosing an item applies the block type to the selection and closes the dropdown; the selection and the toolbar stay put.

## Technical notes

Files: `src/components/editor/toolbar.tsx` (main), plus a small shared block-action list.

- Extract the block actions (id, icon, label, isActive, run) currently duplicated in `format-menu.tsx` into a shared `block-actions.ts` in `src/components/editor/`, extended with Paragraph, Quote and Code block. `format-menu.tsx` imports the same list so the header menu and the inline menu never drift.
- In `toolbar.tsx`, render a shadcn `DropdownMenu` whose trigger is the "Aa" button, sized to match `ToolbarButton` (`h-9`/`h-10`, `px-2.5`, `rounded-lg`, hover accent).
- Keep the bubble menu visible while the dropdown is open: track open state and pass a `shouldShow` that returns true when the dropdown is open, so Radix taking focus out of the editor doesn't dismiss the toolbar. Restore editor focus after an item runs.
- Dropdown content `align="start"`, `sideOffset` small, and rendered above the toolbar's z-index so it is not clipped by the toolbar's `overflow-x-auto` (portal-rendered by default, so no clipping).
- Mobile: the "Aa" trigger uses the compact height; the dropdown is unaffected by the toolbar's horizontal scroll.

Verification: Playwright at 1280px and 390px — select text, open "Aa", apply Heading 2, confirm the block changes, the toolbar stays open, and no console errors.
