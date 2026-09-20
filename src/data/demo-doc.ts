/**
 * Starter document for the public demo (`/demo`). Seeded once into the demo's
 * local Y.Doc (CollaborationProvider `local` mode — no Supabase, no persistence)
 * so logged-out visitors land on a populated doc they can freely edit. Mirrors
 * the hero mockup so preview and demo match.
 *
 * Shape is TipTap JSON — applied via `editor.commands.setContent(DEMO_DOC)`.
 */
export const DEMO_DOC = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Weekly product sync" }] },
    { type: "paragraph", content: [{ type: "text", text: "July 18 · Mira, Theo, Elena" }] },

    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Agenda" }] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Ship status for the editor beta" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Collaboration bugs from last week" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Q3 roadmap priorities" }] }] },
      ],
    },

    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Decisions" }] },
    {
      type: "taskList",
      content: [
        { type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Move real-time cursors out of beta" }] }] },
        { type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Cut the standalone mobile app" }] }] },
        { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Revisit pricing tiers next sync" }] }] },
      ],
    },

    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Try it" }] },
    { type: "paragraph", content: [{ type: "text", text: "This is a live editor — click in and start typing. Select text for formatting, or press Enter to add your own notes." }] },
  ],
};

/**
 * Sample note list for the demo rail + the hero mockup drawer. Mirrors the
 * NoteDrawer shape: a Pinned group and recency buckets of note cards
 * (title + snippet + date; the open note is the active/filled row).
 */
export const NOTE_GROUPS = [
  {
    label: "Pinned",
    notes: [
      { title: "Weekly product sync", snippet: "Agenda, decisions, next steps…", date: "9:24", active: true, pinned: true },
    ],
  },
  {
    label: "Today",
    notes: [
      { title: "Launch checklist", snippet: "Ship blockers and their owners…", date: "8:02" },
      { title: "Design review", snippet: "Notes from the Figma walkthrough…", date: "7:41" },
    ],
  },
  {
    label: "Previous 7 Days",
    notes: [
      { title: "1:1 with Elena", snippet: "Career goals and Q3 focus…", date: "Mon" },
      { title: "Roadmap — Q3", snippet: "Themes and bets for the quarter…", date: "Jul 12" },
    ],
  },
];
