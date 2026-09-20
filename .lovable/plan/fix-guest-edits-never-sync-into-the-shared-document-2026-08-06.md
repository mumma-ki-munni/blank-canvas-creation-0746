# Fix: guest edits never sync into the shared document

## What's happening

The "Anyone with the link can edit" toggle only opens up **reading**. Confirmed in the database:

- `notepad_updates` read rule: allowed when the note allows guests **or** the user is a member.
- `notepad_updates` write rule: allowed **only for members** (`is_notepad_member(notepad_id, auth.uid())`).

A signed-out visitor can therefore load the note and type in it locally, but every save of their keystrokes is rejected by the database. The editor swallows this — the failure only appears as a `[collab] save error` in the browser console — so the guest sees their own text while the signed-in editor never receives anything.

The same gap applies to the note metadata: `notepads` can be read by guests but only updated by members, so a guest renaming a note also silently fails.

## The fix

1. **Database migration** — when a note has guest access enabled, guests may also write:
   - `notepad_updates`: allow insert (and the matching update/delete used by compaction) when the note allows guests, in addition to members.
   - `notepads`: allow title/metadata update when the note allows guests, in addition to owners/editors.
   - Guest access stays strictly per-note; notes with the toggle off are unchanged and remain member-only.
2. **Surface failures instead of hiding them** — in the collaboration provider, a rejected save shows a clear "Changes couldn't be saved" toast rather than only a console error, so a permission problem is never silent again.

## Verification

Two Playwright browser contexts against the same note: one signed in, one fully signed-out. Type in the guest context, confirm the text appears in the signed-in context, and confirm no 4xx requests or console errors. Then toggle guest access off and confirm the guest can no longer write.

## Technical notes

- Guest writes are unauthenticated (`anon` role); grants on both tables already include `anon`, so only the RLS policies change.
- Policies will be expressed with the existing `private.notepad_allows_guests(...)` helper, matching the current read policy.
