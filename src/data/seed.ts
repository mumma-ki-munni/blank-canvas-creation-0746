// Demo seed data for Notepad — used ONLY on `/demo/*` routes via SeedDataProvider.
// Never written to real user accounts. Seed ids are short display strings
// (`'n1'`, `'f1'`, `'t1'`) — typed as `string`, never sent to Supabase.
//
// Every array carries raw, filterable fields (dates, folder ids, tag arrays,
// flags) so the SeedDataProvider can apply the same lens / search / tag / pin
// logic the Supabase queries apply. Do NOT pre-aggregate.

// ── Typed interfaces (mirror the table schemas) ──────────────────────────────

export interface Folder {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

/** Join row between a note and a tag (mirrors the `note_tags` table). */
export interface NoteTag {
  notepad_id: string;
  tag_id: string;
}

/** A tag as it hangs off a note (id + name for chip rendering). */
export interface SeedTagRef {
  id: string;
  name: string;
}

export interface SeedNote {
  id: string;
  title: string;
  snippet: string;
  folder_id: string | null;
  deleted_at: string | null;
  is_pinned: boolean;
  updated_at: string;
  /** When the note was made — what "Date created" sorts by. */
  created_at: string;
  owner_id: string;
  shared_with_me: boolean;
  owner_name: string | null;
  tags: SeedTagRef[];
  /** Rich-text body prose (HTML) — rendered read-only in the demo note preview. */
  body: string;
}

// Static landing marketing content
export interface FeatureTab {
  id: string;
  label: string;
  description: string;
}

export interface SupportingFeature {
  icon: string;
  label: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

// ── Folders ──────────────────────────────────────────────────────────────────

/**
 * Every date below is worked out from now, never written down.
 *
 * They used to be March 2026 literals, so by August the newest note in a
 * note-taking demo was five months old and the whole thing read as abandoned.
 * See docs/design/demo-and-seed.md rule 14.
 */
function hoursAgo(h: number): string {
  const d = new Date();
  d.setHours(d.getHours() - h, 0, 0, 0);
  return d.toISOString();
}

function daysAgo(days: number, atHour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(atHour, 0, 0, 0);
  return d.toISOString();
}

export const folders: Folder[] = [
  { id: "f1", name: "Personal", owner_id: "demo", created_at: daysAgo(120) },
  { id: "f2", name: "Work", owner_id: "demo", created_at: daysAgo(120) },
  { id: "f3", name: "Ideas", owner_id: "demo", created_at: daysAgo(120) },
];

// ── Tags ─────────────────────────────────────────────────────────────────────

export const tags: Tag[] = [
  // `t_work` was worn by two notes but missing from this list, so "work" showed
  // on the row and was absent from the Tags menu — visible, and impossible to
  // take off. It only surfaced once the row started showing tags at all.
  { id: "t_work", name: "work", owner_id: "demo", created_at: daysAgo(120) },
  { id: "t1", name: "reading", owner_id: "demo", created_at: daysAgo(120) },
  { id: "t2", name: "project", owner_id: "demo", created_at: daysAgo(120) },
  { id: "t3", name: "draft", owner_id: "demo", created_at: daysAgo(120) },
  { id: "t4", name: "reference", owner_id: "demo", created_at: daysAgo(120) },
];

// ── Notes (with body prose) ────────────────────────────────────────────────────

export const notes: SeedNote[] = [
  {
    id: "n1",
    title: "Weekly Planner",
    snippet: "Plan for the week ahead — standup topics, OKR check-in, 1:1 notes",
    folder_id: "f2",
    deleted_at: null,
    is_pinned: true,
    updated_at: hoursAgo(3),
    // Made months ago, still edited today — this is why "Date created" and
    // "Date edited" are two different sorts and not one. A seed where every
    // note was created in the same order it was last touched cannot show that.
    created_at: daysAgo(96),
    owner_id: "demo",
    shared_with_me: false,
    owner_name: null,
    tags: [{ id: "t_work", name: "work" }, { id: "t2", name: "project" }],
    body: `
      <h1>Weekly Planner</h1>
      <p>A short plan for the week: what to say in standup, where the OKRs actually stand, and what to raise in the 1:1. Everything below gets rewritten on Friday, so keep it rough.</p>
      <h2>Standup topics</h2>
      <p>Three things worth a minute each. If something takes longer than that, it belongs in a thread rather than the call.</p>
      <ul>
        <li>Ship workspace lenses PR</li>
        <li>Review design handoff for tag popover</li>
        <li>Unblock Maya on API auth</li>
      </ul>
      <h2>OKR check-in</h2>
      <p>Q1 KR2 at 68% — on track. KR3 lagging; need to schedule async review.</p>
      <p>The gap on KR3 is mostly waiting on data, not engineering. Ask for the numbers on Tuesday so the review has something to look at.</p>
      <h2>1:1 agenda</h2>
      <p>Two topics, both mine this week. Leave room at the end in case there is feedback going the other way.</p>
      <ul>
        <li>Career growth conversation — timeline for senior IC track</li>
        <li>Feedback on the async comms doc</li>
      </ul>
      <p>Follow-up: write up whatever we agree on before end of day, while the wording is still fresh.</p>
    `,

  },
  {
    id: "n2",
    title: "API Integration Notes",
    snippet: "Notes from the backend sync — auth flow, rate limits, error codes",
    folder_id: "f2",
    deleted_at: null,
    is_pinned: false,
    updated_at: hoursAgo(7),
    created_at: daysAgo(21),
    owner_id: "demo",
    shared_with_me: false,
    owner_name: null,
    tags: [{ id: "t2", name: "project" }, { id: "t4", name: "reference" }],
    body: `
      <h1>API Integration Notes</h1>
      <h2>Auth flow</h2>
      <p>The backend uses JWT + refresh token rotation. The access token expires in 15 minutes. On 401, the client should silently refresh using the stored refresh token, then retry the original request.</p>
      <h2>Rate limits</h2>
      <ul data-type="taskList">
        <li data-checked="true">Check if rate-limit headers are returned on 429</li>
        <li data-checked="true">Implement exponential backoff — start at 1 s, max 30 s</li>
        <li data-checked="false">Surface rate-limit errors to the user (toast, not modal)</li>
      </ul>
      <h2>Error codes</h2>
      <p>400 — malformed request body (check field names)<br/>
         403 — missing scope on the token (re-auth needed)<br/>
         503 — upstream timeout, safe to retry</p>
    `,
  },
  {
    id: "n3",
    title: "Book Club — March picks",
    snippet: "Piranesi, The Ministry for the Future, orbital",
    folder_id: "f1",
    deleted_at: null,
    is_pinned: false,
    updated_at: daysAgo(1, 16),
    created_at: daysAgo(9),
    owner_id: "demo",
    shared_with_me: false,
    owner_name: null,
    tags: [{ id: "t1", name: "reading" }],
    body: `
      <h1>Book Club — March picks</h1>
      <p><strong>Piranesi</strong> — Susanna Clarke. A man lives in a house of infinite halls filled with statues and tides. Dreamlike and precise. Recommended for anyone who liked Jonathan Strange.</p>
      <p><strong>The Ministry for the Future</strong> — Kim Stanley Robinson. Near-future climate governance. Dense but essential; read the first 50 pages before judging.</p>
      <p><strong>orbital</strong> — Samantha Harvey. A single day on the ISS, told in prose. Booker winner. Short — finish in an afternoon.</p>
    `,
  },
  {
    id: "n4",
    title: "Draft: Side Project Landing",
    snippet: 'Hero: "Build something people actually use"',
    folder_id: "f3",
    deleted_at: null,
    is_pinned: false,
    updated_at: daysAgo(3, 11),
    created_at: daysAgo(24),
    owner_id: "demo",
    shared_with_me: false,
    owner_name: null,
    tags: [{ id: "t3", name: "draft" }],
    body: `
      <h1>Draft: Side Project Landing</h1>
      <p>First pass at the page. The goal is one clear promise above the fold and a single thing to click — everything else can wait until the second scroll.</p>
      <h2>Hero copy options</h2>
      <p>All three say roughly the same thing; the difference is how much they ask of the reader.</p>
      <ul>
        <li>"Build something people actually use" — direct, challenges the reader</li>
        <li>"Ship your idea. Keep the momentum." — action-oriented</li>
        <li>"From first thought to live product." — journey framing</li>
      </ul>
      <h2>CTA options</h2>
      <p>Leaning towards the first one. "Try it free" invites a tyre-kick, and "See how it works" sends people to a page instead of the product.</p>
      <ul>
        <li>Start building →</li>
        <li>Try it free</li>
        <li>See how it works</li>
      </ul>
      <h2>Colour palette notes</h2>
      <p>Neutral base with a single accent — amber or sage. Avoid blue (too SaaS-generic). Typography: Geist or Inter.</p>
      <p>Test the accent against the screenshot before committing; the product UI is already warm, and two warm tones fighting each other looks like a mistake rather than a choice.</p>
    `,

  },
  {
    id: "n5",
    title: "Research: Async Communication",
    snippet: "Shared with you · Maya R. owns this note",
    folder_id: null,
    deleted_at: null,
    is_pinned: false,
    updated_at: daysAgo(5, 17),
    created_at: daysAgo(26),
    owner_id: "demo-maya",
    shared_with_me: true,
    owner_name: "Maya R.",
    tags: [{ id: "t4", name: "reference" }],
    body: `
      <h1>Research: Async Communication</h1>
      <p>Async-first teams spend less time in scheduled meetings and more time in deep work. The research is consistent: async norms correlate with higher individual output and lower reported burnout, with the trade-off of slower consensus on ambiguous decisions.</p>
      <h2>Key references</h2>
      <p>Perlow et al. — "Reducing the Cost of Coordination" (HBR, 2017)<br/>
         GitLab Remote Work Report 2023 — Section 4: Communication Norms<br/>
         Basecamp — "It Doesn't Have to Be Crazy at Work" (Chapter 11)<br/>
         Cal Newport — "Deep Work" (Part II, Rule 1)</p>
    `,
  },
  {
    id: "n6",
    title: "Colour Theory Notes",
    snippet: "Primary, secondary, analogous schemes and the 60-30-10 rule",
    folder_id: "f1",
    deleted_at: null,
    is_pinned: false,
    updated_at: daysAgo(9, 10),
    created_at: daysAgo(30),
    owner_id: "demo",
    shared_with_me: false,
    owner_name: null,
    tags: [{ id: "t1", name: "reading" }],
    body: `
      <h1>Colour Theory Notes</h1>
      <p><strong>Primary colours</strong>: red, yellow, blue (pigment). Cannot be mixed from others.</p>
      <p><strong>Secondary colours</strong>: orange, green, violet — each mixed from two primaries.</p>
      <p><strong>Analogous schemes</strong>: three colours adjacent on the wheel. Low contrast, high harmony. Good for calm interfaces.</p>
      <h2>60-30-10 rule</h2>
      <p>60% dominant colour (walls, large surfaces), 30% secondary (furniture, textiles), 10% accent (art, accessories). Translates directly to UI: 60% background, 30% text/surface, 10% primary/action colour.</p>
    `,
  },
  {
    id: "n7",
    title: "Ideas Dump",
    snippet: "Coffee-shop music app, photo journaling, local-first sync",
    folder_id: "f3",
    deleted_at: null,
    is_pinned: false,
    updated_at: daysAgo(16, 20),
    created_at: daysAgo(18),
    owner_id: "demo",
    shared_with_me: false,
    owner_name: null,
    tags: [{ id: "t3", name: "draft" }],
    body: `
      <h1>Ideas Dump</h1>
      <ul>
        <li><strong>Coffee-shop music app</strong> — curated ambient playlists that match the time of day and your work mode. No skipping, no algorithm, just vibes.</li>
        <li><strong>Photo journaling</strong> — one photo per day, forced. No editing, no captions. After a year: a timelapse of your life.</li>
        <li><strong>Local-first sync</strong> — a notes app that stores everything in SQLite on device, syncs peer-to-peer when on the same network. No server, no SLA, no billing.</li>
        <li><strong>Meeting cost clock</strong> — a timer that shows real-time salary spend for the people in the room. Summons brevity.</li>
        <li><strong>Weekly letter</strong> — email yourself a summary of everything you captured that week. Digest format, auto-generated from your notes.</li>
      </ul>
    `,
  },
  {
    id: "n8",
    title: "Old Meeting Notes",
    snippet: "Notes from the Feb sync — alignment on roadmap priorities",
    folder_id: "f2",
    deleted_at: daysAgo(4, 8),
    is_pinned: false,
    updated_at: daysAgo(34, 17),
    created_at: daysAgo(55),
    owner_id: "demo",
    shared_with_me: false,
    owner_name: null,
    tags: [],
    body: `
      <h1>Old Meeting Notes</h1>
      <p>February roadmap sync. Attendees: full product team (7).</p>
      <h2>Decisions</h2>
      <ul>
        <li>Defer native mobile to Q3 — focus web product through Q2</li>
        <li>Prioritise workspace lenses over smart folders in v1</li>
        <li>Guest link stays on by default until security review in April</li>
      </ul>
      <h2>Action items</h2>
      <ul data-type="taskList">
        <li data-checked="true">Tom: write up the async comms research note</li>
        <li data-checked="true">Maya: share the API auth doc with the team</li>
        <li data-checked="false">Priya: schedule the Q2 planning session</li>
      </ul>
    `,
  },
  {
    id: "n9",
    title: "Q2 Roadmap Draft",
    snippet: "Themes, bets and the one thing we will not do this quarter",
    folder_id: "f2",
    deleted_at: null,
    is_pinned: true,
    updated_at: hoursAgo(11),
    created_at: daysAgo(14),
    owner_id: "demo",
    shared_with_me: false,
    owner_name: null,
    tags: [{ id: "t_work", name: "work" }, { id: "t2", name: "project" }],
    body: `
      <h1>Q2 Roadmap Draft</h1>
      <h2>Themes</h2>
      <ul>
        <li>Make sharing feel instant — guest links, presence, comments</li>
        <li>Make a crowded workspace calm — folders, tags, gallery view</li>
      </ul>
      <h2>Not doing</h2>
      <p>No native mobile app this quarter. Responsive web only.</p>
    `,
  },
  {
    id: "n10",
    title: "Grocery + Weekend",
    snippet: "Oat milk, sourdough, tomatoes — and the Saturday plan",
    folder_id: "f1",
    deleted_at: null,
    is_pinned: false,
    updated_at: hoursAgo(20),
    created_at: daysAgo(2),
    owner_id: "demo",
    shared_with_me: false,
    owner_name: null,
    tags: [],
    body: `
      <h1>Grocery + Weekend</h1>
      <ul data-type="taskList">
        <li data-checked="true">Oat milk</li>
        <li data-checked="true">Sourdough</li>
        <li data-checked="false">Tomatoes, basil, olive oil</li>
        <li data-checked="false">Coffee beans — the medium roast</li>
      </ul>
      <h2>Saturday</h2>
      <p>Farmers market at 9, long walk after lunch, dinner with Sam at 7.</p>
    `,
  },
  {
    id: "n11",
    title: "Interview Notes — Design Lead",
    snippet: "Shared with you · Priya S. owns this note",
    folder_id: null,
    deleted_at: null,
    is_pinned: false,
    updated_at: daysAgo(2, 14),
    created_at: daysAgo(12),
    owner_id: "demo-priya",
    shared_with_me: true,
    owner_name: "Priya S.",
    tags: [{ id: "t4", name: "reference" }],
    body: `
      <h1>Interview Notes — Design Lead</h1>
      <p>Strong systems thinker. Walked through a design-token migration end to end and could name the trade-offs without prompting.</p>
      <h2>Signals</h2>
      <ul>
        <li>Writes clearly — brought a written spec, not just screens</li>
        <li>Comfortable with ambiguity; asked about constraints first</li>
      </ul>
      <p><strong>Recommendation:</strong> advance to the team round.</p>
    `,
  },
  {
    id: "n12",
    title: "Trip Plan — Lisbon",
    snippet: "Five days, one neighbourhood a day, no rushing",
    folder_id: "f1",
    deleted_at: null,
    is_pinned: false,
    updated_at: daysAgo(6, 19),
    created_at: daysAgo(40),
    owner_id: "demo",
    shared_with_me: false,
    owner_name: null,
    tags: [{ id: "t1", name: "reading" }],
    body: `
      <h1>Trip Plan — Lisbon</h1>
      <p>Day 1 — Alfama, sunset at Miradouro das Portas do Sol.<br/>
         Day 2 — Belém, pastéis and the tower.<br/>
         Day 3 — Príncipe Real, bookshops and a long lunch.<br/>
         Day 4 — Day trip to Sintra, early train.<br/>
         Day 5 — Nothing planned. On purpose.</p>
    `,
  },
  {
    id: "n13",
    title: "Onboarding Copy Review",
    snippet: "Cut the welcome modal, teach in place instead",
    folder_id: "f3",
    deleted_at: null,
    is_pinned: false,
    updated_at: daysAgo(11, 13),
    created_at: daysAgo(29),
    owner_id: "demo",
    shared_with_me: false,
    owner_name: null,
    tags: [{ id: "t3", name: "draft" }],
    body: `
      <h1>Onboarding Copy Review</h1>
      <p>The welcome modal explains four things before the user has done any of them. Nobody reads it, and it delays the first keystroke.</p>
      <h2>Proposal</h2>
      <ul>
        <li>Open straight into a blank note with a real cursor</li>
        <li>Teach sharing at the moment the share button is first hovered</li>
        <li>Keep one line of placeholder text and nothing else</li>
      </ul>
    `,
  },
  {
    id: "n14",
    title: "Reading List — Systems",
    snippet: "Thinking in Systems, Seeing Like a State, Notes on Notes",
    folder_id: "f1",
    deleted_at: null,
    is_pinned: false,
    updated_at: daysAgo(19, 8),
    created_at: daysAgo(60),
    owner_id: "demo",
    shared_with_me: false,
    owner_name: null,
    tags: [{ id: "t1", name: "reading" }, { id: "t4", name: "reference" }],
    body: `
      <h1>Reading List — Systems</h1>
      <p><strong>Thinking in Systems</strong> — Donella Meadows. Stocks, flows, and where to intervene. Short, re-readable.</p>
      <p><strong>Seeing Like a State</strong> — James C. Scott. What legibility costs. Long, worth it.</p>
      <p><strong>Notes on Notes</strong> — collected essays on personal knowledge systems. Skim the middle.</p>
    `,
  },
  {
    id: "n15",
    title: "Scratch — API renaming",
    snippet: "Old draft, kept for the naming table",
    folder_id: "f3",
    deleted_at: daysAgo(9, 8),
    is_pinned: false,
    updated_at: daysAgo(41, 12),
    created_at: daysAgo(70),
    owner_id: "demo",
    shared_with_me: false,
    owner_name: null,
    tags: [],
    body: `
      <h1>Scratch — API renaming</h1>
      <p><code>notepad</code> → <code>note</code> everywhere in the public API. Internal tables keep the old name so migrations stay boring.</p>
    `,
  },
];

// note_tags join data (mirrors the tags arrays on each note above).
// 't_work' is a demo-only inline tag on n1 (not in the master `tags` list).
export const note_tags: NoteTag[] = [
  { notepad_id: "n1", tag_id: "t_work" },
  { notepad_id: "n1", tag_id: "t2" },
  { notepad_id: "n2", tag_id: "t2" },
  { notepad_id: "n2", tag_id: "t4" },
  { notepad_id: "n3", tag_id: "t1" },
  { notepad_id: "n4", tag_id: "t3" },
  { notepad_id: "n5", tag_id: "t4" },
  { notepad_id: "n6", tag_id: "t1" },
  { notepad_id: "n7", tag_id: "t3" },
];

// ── Static landing content ─────────────────────────────────────────────────────

export const featureTabs: FeatureTab[] = [
  { id: "note-list", label: "Note list", description: "See all your notes at a glance — pinned, organised, searchable." },
  { id: "editor", label: "Editor", description: "Rich text with headings, bold, checklists, and real-time cursors." },
  { id: "sharing", label: "Sharing", description: "Invite by email as editor or viewer, or share a guest link." },
  { id: "organize", label: "Organize", description: "Folders, tags, and a pin keep even a crowded workspace calm." },
];

export const supportingFeatures: SupportingFeature[] = [
  { icon: "Pin", label: "Pin to the top" },
  { icon: "Tag", label: "Tag from the list" },
  { icon: "Search", label: "Full-text search" },
  { icon: "Trash2", label: "Recover deleted notes" },
  { icon: "Share2", label: "Share with a link" },
  { icon: "Users", label: "Invite as editor or viewer" },
];

export const testimonials: Testimonial[] = [
  { quote: "Finally a notes app that lets me collaborate without switching to a doc tool.", name: "Maya R.", role: "Product designer" },
  { quote: "Handed a draft to my editor in 10 seconds flat — she just clicked the link.", name: "Tom K.", role: "Freelance writer" },
  { quote: "Tags and folders keep 200+ notes manageable.", name: "Priya S.", role: "Research lead" },
];

export const footerLinks: FooterLinkGroup[] = [
  { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Demo", href: "/demo/notes" }] },
  { title: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }] },
  { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] },
];
