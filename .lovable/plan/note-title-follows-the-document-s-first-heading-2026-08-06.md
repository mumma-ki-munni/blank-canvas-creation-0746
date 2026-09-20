# Note title follows the document's first heading

Today the title only updates in one narrow case: while you are typing and the *very first* block of the document happens to be a heading. If the heading sits below an intro paragraph, if you open an existing note without editing it, or if you delete the heading, the stored title drifts out of sync with the document.

## Behaviour after the change

- The note title is always the text of the **first heading anywhere in the document** (H1–H4), not just the first block.
- If the document has no heading, the title falls back to the first non-empty line of text; if the document is empty, it stays "Untitled".
- The title syncs on document load as well as while editing, so opening an existing note corrects a stale title.
- Header bar and the notes list show the same derived title.
- Writes to the database are debounced (~600 ms after typing stops) and skipped when the title is unchanged, so a single keystroke does not fire a request per character.
- Guests without write access never trigger a title write (the update simply no-ops as it does today).

## Technical notes

- `src/components/editor/notepad-editor.tsx`: replace the "first node is a heading" check with a small `deriveTitle(doc)` helper that walks top-level nodes, returns the first heading's text content, otherwise the first non-empty text block, otherwise `"Untitled"`. Call it from `onUpdate` and once from `onCreate` / the editor-ready effect (after Yjs has synced the initial content) via the existing `onTitleChange` callback.
- `src/pages/session.tsx`: keep `handleTitleChange` as the single writer, but store the last-persisted title in a ref, skip the Supabase update when it matches, debounce it with a timeout ref cleared on unmount, and invalidate/patch the `["notes"]` query cache so the sidebar list reflects the new title without a refetch.
- No schema or RLS change; `notepads.title` remains the source of truth for lists and search.
