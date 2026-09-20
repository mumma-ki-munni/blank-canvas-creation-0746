# Fix: "Failed to create note" that actually succeeds

## What's happening

Creating a note shows an error toast, but after a reload the note is there and works fine.

Cause (confirmed): the note is created in three steps — insert the note, add the creator as owner member, then lock the note down to private. The database now already adds the creator as owner automatically via a trigger on insert. So the app's own "add owner" step hits the uniqueness rule (one membership row per user per note) and throws.

Two consequences:
1. The error is surfaced as "Failed to create note" even though the note exists.
2. Because the error aborts the sequence, the final step never runs and the new note stays flagged as guest-accessible instead of private.

## The fix

In the create-note flow (`src/lib/data-provider.tsx`, `useCreateNote`):
- Stop inserting the owner membership row from the client; the database trigger already does it. (Alternatively tolerate the duplicate — but removing it is cleaner since the trigger is authoritative.)
- Keep the insert, then run the update that turns off guest access so new notes are private by default.
- Keep the existing error toast for genuine failures.

Also verify the same pattern isn't duplicated in `src/pages/session.tsx` (which has a similar create path) and align it.

## Database cleanup

There are currently two identical triggers on `notepads` doing the same owner-insert (`notepads_add_owner` and `trg_add_notepad_owner`). Drop one so the behavior is unambiguous.

## Verification

Sign in, create a note from the sidebar: no error toast, note opens immediately, and the new note is private (guest access off) with exactly one owner membership row.
