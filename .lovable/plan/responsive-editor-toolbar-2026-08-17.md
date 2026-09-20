# Responsive editor toolbar

The selection toolbar (bubble menu above selected text) is currently a fixed row of 8 icon buttons at 40x40px. At ~342px total width it barely fits a 402px phone viewport and gets clipped near the screen edges. Make it adapt to small screens.

## Changes

Only `src/components/editor/toolbar.tsx`:

1. **Compact sizing on small screens** — buttons go from `h-10 w-10` to `h-9 w-9` with a 16px icon below the `sm` breakpoint; full 40px size from `sm` up.
2. **Stay inside the viewport** — the bubble container gets `max-w-[calc(100vw-1.5rem)]` and horizontal scroll (`overflow-x-auto`, hidden scrollbar) so it never gets clipped at the screen edges; BubbleMenu gets a small viewport padding option so it flips/shifts within the screen.
3. **Touch behaviour** — tooltips are hover-only affordances, so on touch/coarse-pointer devices they stay suppressed while `aria-label` continues to carry the accessible name (no change to labels).
4. **Priority order** — most-used marks first (bold, italic, underline, strike, highlight, code, link, comment) so if the row scrolls, the essentials are visible first.

No changes to the editor, Yjs sync, format menu, or slash menu.
