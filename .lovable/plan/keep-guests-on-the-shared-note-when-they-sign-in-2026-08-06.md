# Keep guests on the shared note when they sign in

## The problem

A guest opens a shared link, signs in, and lands in `/notes` — their own empty workspace. Two things go wrong:

1. **The return path is lost.** Sign-in always navigates to `/notes`, and the OAuth round-trip through `/auth/callback` keeps no memory of where the user came from.
2. **They never get access.** Signing in does not add them to the note. The notes list is built from `notepad_members` rows only, so a note they were reading as a guest is invisible in their workspace — and once signed in they are no longer "a guest with a link" in the UI either.

## The fix

**1. Remember where they came from**
- When a guest triggers sign-in from a shared note, store the note path (e.g. `/session/<id>`) so it survives both email/password sign-in and the OAuth redirect through `/auth/callback`.
- After a successful sign-in, return them to that note instead of `/notes`. With nothing stored, `/notes` stays the default.

**2. Join the note on sign-in**
- When a signed-in user opens a note that has open link sharing on and they are not already a member, add them as a member with the `editor` role.
- The note then appears permanently in their sidebar/notes list, so they can find it again later even without the link.
- A new database rule allows exactly this self-join: a user may add only themselves, only with the `editor` role, and only on notes where open link sharing is enabled. Everything else stays owner/editor-managed as today.

**3. Make signing in visible from a shared note**
- Guests viewing a shared note get a clear "Sign in to save this note to your workspace" affordance in the note header, which routes through the return-path flow above.

## Behaviour after the change

```text
guest opens /session/abc  ->  reads/edits as guest
guest clicks "Sign in"    ->  /login (remembers /session/abc)
signs in (email or SSO)   ->  back to /session/abc
                          ->  auto-joined as editor
                          ->  note now listed in their workspace forever
```

If the owner later turns open sharing off, existing members keep their access; new visitors do not get auto-joined.

## Technical notes

- Return path stored in `sessionStorage` (survives the OAuth full-page redirect) plus router `location.state` for the in-app path; consumed and cleared in `login-page.tsx` and `auth-callback.tsx`.
- Migration adds an INSERT policy on `notepad_members`: `user_id = auth.uid() AND role = 'editor' AND private.notepad_allows_guests(notepad_id)`.
- Auto-join runs in the session route once the auth user is known, as an idempotent insert ignoring duplicate-key conflicts, followed by invalidating the notes query.
- Verified end to end with two browser contexts: guest reads the shared note, signs in, lands back on the note, and the note appears in their notes list.
