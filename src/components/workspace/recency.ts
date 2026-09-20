import type { WorkspaceNote } from "@/lib/data-provider";

/**
 * Recency buckets — the notes-app grouping (Today / Yesterday / Previous 7
 * Days / Previous 30 Days / <month> / <year>). This is NOT part of the base editor
 * (the editor groups only pinned-vs-rest); it's our addition for the notes template.
 *
 * Notes are assumed pre-sorted by `updated_at` descending, so buckets emerge in
 * natural order (newest first) as we encounter them.
 */
const DAY = 86_400_000;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface RecencyGroup {
  key: string;
  label: string;
  notes: WorkspaceNote[];
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function groupByRecency(
  notes: WorkspaceNote[],
  now: number = Date.now(),
): RecencyGroup[] {
  const today0 = startOfDay(now);
  const thisYear = new Date(now).getFullYear();
  const order: string[] = [];
  const groups = new Map<string, RecencyGroup>();

  const add = (key: string, label: string, note: WorkspaceNote) => {
    let g = groups.get(key);
    if (!g) {
      g = { key, label, notes: [] };
      groups.set(key, g);
      order.push(key);
    }
    g.notes.push(note);
  };

  for (const note of notes) {
    const ts = new Date(note.updated_at).getTime();
    const daysAgo = Math.round((today0 - startOfDay(ts)) / DAY);
    if (daysAgo <= 0) add("today", "Today", note);
    else if (daysAgo === 1) add("yesterday", "Yesterday", note);
    else if (daysAgo <= 7) add("prev7", "Previous 7 Days", note);
    else if (daysAgo <= 30) add("prev30", "Previous 30 Days", note);
    else {
      const d = new Date(ts);
      if (d.getFullYear() === thisYear) {
        add(`m-${d.getMonth()}`, MONTHS[d.getMonth()], note);
      } else {
        add(`y-${d.getFullYear()}`, String(d.getFullYear()), note);
      }
    }
  }

  return order.map((k) => groups.get(k)!);
}
