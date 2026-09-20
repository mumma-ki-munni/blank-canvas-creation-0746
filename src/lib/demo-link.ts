/**
 * The one demo door.
 *
 * The demo is a real note with guest access on — the product itself, shared
 * the way Fathom shares its live dashboard. Open it in two windows and
 * presence, cursors, comments and edits sync live, because nothing about it
 * is a demo except who is looking.
 *
 * Every "View demo" surface imports this constant; a surface that hard-codes
 * the path is a surface that can drift. If the note is ever deleted, recreate
 * it with scripts/seed-collab-note.mts and update the id here.
 */
export const DEMO_URL = "/session/5ae9d5ee-97e8-495b-bb57-57f0b734184d";
