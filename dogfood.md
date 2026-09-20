You are dogfooding this app. Fix bugs as you find them — do not skip steps.

Use Playwright. PASS/FAIL each step. Stop and fix on failure before continuing.

Read these files before writing test code:
- src/data/seed.ts
- docs/plans/00-screenboard.md
- docs/plans/00-storyboard.md
- .claude/rules/ui-guidelines.md

RULES:
- Every step has ONE action and ONE expected result.
- If a step fails, fix the bug in the source code, then re-run that step.
- Navigate via in-app clicks, not page.goto (except for direct-URL tests).
- Reload after every mutation batch to verify persistence.
- Screenshot every failure and every completed phase.
- Fail any step that produces a console.error or an unexpected 4xx/5xx request.
- Label every step VERIFIED / INITIATED / STATIC. "Doesn't crash" is not "works":
  INITIATED and STATIC steps are coverage gaps, listed under "Not verified
  end-to-end" — never counted as passes.

---

## Spec reconciliation (docs vs code — CODE wins on behavior/nav/counts)

| Item | PLAN (docs) | CODE | MATCH? |
|---|---|---|---|
| Routes | `/ /login /demo /demo/notes→/demo /session/:id /notes *` | same (App.tsx) | ✅ |
| `/demo` | local, non-persistent editor + rail | `DemoPage` + `CollaborationProvider local` | ✅ |
| `/notes` | protected; redirects into most-recent note | `ProtectedRoute` → `NotesPage` → `<Navigate>` to `/session/:id` | ✅ |
| `/session/:id` | public, guest-capable | no guard in App.tsx | ✅ |
| Seed notes | 8 | `grep -cE '^\s*title: "' seed.ts` → 8 | ✅ (fixed from 11) |
| Folders / tags | 3 / 4 | 3 / 4 | ✅ |
| OAuth | Google + Apple | `supabase.auth.signInWithOAuth` (DIRECT, not Lovable broker) | ✅ → INITIATED only |
| Orphaned pages | none | all `src/pages/` dirs routed in `App.tsx` | ✅ Matrix G done |

No >30% mismatch. Proceed against CODE.

## Matrices

**A. Routes** — `/` (public) · `/login` (public, redirects authed→`/notes`) ·
`/demo` (public, local) · `/demo/notes`→`/demo` · `/session/:id` (public/guest) ·
`/notes` (protected→session) · `*` (404).

**B. Entities (Supabase, real CRUD on `/notes`/`/session`)** — notepads (note),
folders (3 seed: Personal/Work/Ideas), tags (4 seed: reading/project/draft/reference).
Fresh account starts EMPTY (seed.ts arrays feed the removed SeedDataProvider only —
NOT a fresh user's Supabase rows). Populate target below is FTUX-created, not seed-mirrored.

**C. Landing nav** — Notepad (→`/`) · View demo (→`/demo`) · Sign in (→`/login`).
Editor header — notes toggle · Share · Chat · Sign out.

**D. Controls per screen** — see phases (each gets an input→output test).

**E. Multiple paths** — new note via drawer "New note" vs `/session/new`; View demo
from header, hero, and CTA banner (all →`/demo`).

**F. Public product routes** — `/demo` (local editor, no auth) and `/session/:id`
(guest-capable shared doc). These are the outside-world surfaces → Phase 2b.

**G. Orphaned surface (done)** — the unrouted dirs (`src/pages/app/`,
`course-landing/`, `workspace/`, `demo-notes/`) and `workspace-layout-01/-02/-03`
are deleted. Still open: the `notes`/`folders`/`tags` arrays in `seed.ts`, only
consumed by the unrouted SeedDataProvider path — flag as dead seed.

---

## PHASE 1 — EMPTY APP (smoke + auth + empty states)

1. Navigate to `/` → verify: landing renders, no console errors. [VERIFIED]
2. Verify: hero h1 "Write together, in real time." renders in the red→yellow gradient (`background-clip:text`). [VERIFIED]
3. Verify: every primary CTA background computes to `linear-gradient(45deg, rgb(255,65,55), rgb(253,229,58))` — header "Sign in", hero "View demo", CTA-banner buttons. [VERIFIED]
4. Click header "View demo" → verify: navigates to `/demo`. [VERIFIED]
5. Navigate to `/` → click hero "View demo" → verify: navigates to `/demo`. [VERIFIED]
6. Scroll to CTA banner → verify heading "Ready to write together?" visible. [VERIFIED]
7. Verify: testimonials section heading "What teams are saying" + 3 cards (Maya Chen, Elena Torres, Priya Nair) visible. [VERIFIED]
8. Verify: footer links Privacy / Terms / Contact render (no 404 on internal ones). [VERIFIED]
9. Click header "Sign in" → verify: navigates to `/login`, email + password inputs visible. [VERIFIED]
10. Verify: mode toggle to "Sign up" present (read login-page.tsx for exact control). [VERIFIED]
11. Verify: "Continue with Google" + "Continue with Apple" buttons render. [STATIC]
12. Click "Continue with Google" → verify: navigation to the Supabase OAuth authorize URL begins and responds (not 404/blank). [INITIATED — round-trip not completed]
13. Navigate back to `/login`.
14. Activate Sign up → fill email `test-{timestamp}@example.com`, password `TestPass123!xyz` → click Create account → verify: redirects to `/notes` then into `/session/:id` (fresh empty note). [VERIFIED]
15. Verify (FTUX): the note drawer list is EMPTY (0 notes besides the just-created blank) — no seeded "Weekly Planner"/etc. for this fresh account. FAIL if seed notes appear. [VERIFIED]
16. Screenshot the fresh empty workspace.
17. Click Sign out → verify: redirects per auth code (read `auth-provider`/header). [VERIFIED]
18. Navigate to `/notes` → verify: redirects to `/login` (protected). [VERIFIED]
19. Sign in with the saved credentials → verify: lands in `/session/:id`. [VERIFIED]

## PHASE 2 — POPULATE (FTUX real CRUD)

20. Click into the note title → type "My first note" → verify: drawer row title updates live. [VERIFIED]
21. Type body: a paragraph → verify: text persists in the doc. [VERIFIED]
22. Type `/` → verify: slash menu opens; choose Task list → add 2 items, check 1. [VERIFIED]
23. Reload → verify: title + body + checklist persist (Yjs → Supabase). [VERIFIED]
24. Click drawer "New note" → verify: fresh `/session/:id`; write title "Second note". [VERIFIED]
25. Verify: drawer now lists 2 notes under a recency group. [VERIFIED]
26. On a note row, open ⋯ menu → "Move to folder" → create/assign folder "Work" → verify: assignment persists. [VERIFIED]
27. Open a note row's tag popover → apply tag "project" → verify: tag chip renders on the row. [VERIFIED]
28. On a note row ⋯ → Pin → verify: row moves to the "Pinned" group. [VERIFIED]
29. Reload → verify: folder, tag, pin all persist. [VERIFIED]

## PHASE 2b — PUBLIC PRODUCT ROUTES (unauthenticated)

30. Clear auth (localStorage `sb-*`, cookies); navigate to `/notes` → verify: redirect to `/login` (confirms signed out). [VERIFIED]
31. Navigate to `/demo` → verify: loads WITHOUT auth wall; populated doc "Weekly product sync" renders. [VERIFIED]
32. Verify: demo rail shows Notepad / New note / Search / Pinned "Weekly product sync" / Today / Previous 7 Days groups. [VERIFIED]
33. Click into demo doc body → type " — edited" → verify: text appears in-session. [VERIFIED]
34. Reload `/demo` → verify: edit is GONE (local, non-persistent — this is expected, NOT a bug). [VERIFIED]
35. Verify: demo "Sign in to save" → navigates to `/login`. [VERIFIED]
36. Public shared doc: as a signed-in user, open Share on a note → copy link → read clipboard URL → verify: URL does NOT contain "preview--" and is not auth-gated. [VERIFIED]
37. Sign out → open the copied `/session/:id` URL → verify: doc renders WITHOUT a login wall (guest-capable). [VERIFIED]
38. Navigate to `/session/{bogus-uuid}` → verify: graceful state (access-denied or empty), not a crash/blank. [VERIFIED]

## PHASE 3 — EVERY REMAINING PATH + COLLABORATION

39. Alternative new-note path: navigate to `/session/new` directly → verify: creates a notepad and redirects to its id. [VERIFIED]
40. Editor interaction sweep (sign in first): click Share → verify popover opens with Invite input + member list. [VERIFIED]
41. In Share, enter an email + role → click Invite → verify: invite row appears. [VERIFIED]
42. Click Chat → verify: chat panel slides in; send a message → verify it appears. [VERIFIED]
43. Toggle notes drawer (menu icon) → verify: drawer collapses/expands. [VERIFIED]
44. Collaboration (TWO browser contexts, same `/session/:id`):
    - Type in context A → verify: text appears in B without reload. [VERIFIED]
    - Verify: presence avatars in B reflect A. [VERIFIED]
    - Add a comment in A (select text → comment) → verify: thread appears in B; reply in B → appears in A. [VERIFIED]
    - Reload B → verify: doc edits + comments persist. [VERIFIED]

## PHASE 4 — VERIFY + AUDIT

45. Screenshot each route at 1440px: `/`, `/login`, `/demo`, `/session/:id`, 404. 
46. Verify assets: every `<img>` on `/` (testimonial avatars, mockup) has `naturalWidth > 0`; FAIL any broken src. [VERIFIED]
47. Responsive 375px + 768px on `/`, `/demo`, `/session/:id` → verify: no horizontal overflow. [VERIFIED]
48. Matrix G cleanup — unrouted page dirs and workspace layouts are deleted. Remaining: FAIL + fix or delete the dead `notes/folders/tags` seed arrays (unrouted SeedDataProvider path).
49. 404: navigate to `/nonexistent` → verify: "404 / Page not found" + link to `/`. [VERIFIED]
50. Screenboard comparison: compare each screenshot to `docs/plans/00-screenboard.md` wireframes; report visual drift as "adjudicate", not auto-FAIL.

## Report requirements
- Separate PASS counts from **Not verified end-to-end** (OAuth = INITIATED; "Continue with…" render = STATIC).
- List Matrix G dead-surface items with the action taken (deleted / routed).
- Note: `/demo` non-persistence is expected; do NOT file it as a bug.
