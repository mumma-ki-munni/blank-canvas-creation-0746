# Selection toolbar: breathing room + gap above the text

The floating format menu currently sits tight against the selected line and its icons touch the top and bottom edges of the pill. Two small changes fix both.

## Changes

1. **Vertical padding inside the pill** — replace the fixed height (`h-11` / `h-12`) plus `p-1` with symmetric padding (`px-1.5 py-1.5`) so the pill grows around the buttons instead of clamping them. Buttons keep their current sizes, so the pill ends up slightly taller with even space above and below the icons.

2. **Gap above the selection** — pass a floating-UI offset to the BubbleMenu so it hovers a few pixels clear of the highlighted text instead of overlapping the line above it.

## Technical detail

Single file: `src/components/editor/toolbar.tsx`.

- Container class list: drop `compact ? "h-11" : "h-12"`, change `p-1` to `px-1.5 py-1.5`.
- Add `options={{ offset: 10 }}` (Tiptap v3 BubbleMenu floating options) to keep the menu clear of the selection.

No behavior, state, or editor logic changes. Verified afterwards at phone and desktop widths with a screenshot of the menu over a selection.
