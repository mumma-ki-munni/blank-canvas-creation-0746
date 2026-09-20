/**
 * One-off: create the public "live collab" showcase note.
 * Signs in as the QA account, inserts a guest-access notepad, and seeds its
 * Yjs doc (fragment "default", matching TipTap Collaboration's default).
 */
import * as Y from "yjs";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { prosemirrorJSONToYDoc } from "@tiptap/y-tiptap";

const SUPABASE_URL = "https://ollicmdvyhpfrhszlgxv.supabase.co";
const KEY = process.env.NOTEPAD_ANON_KEY!;
const EMAIL = process.env.QA_EMAIL!;
const PASSWORD = process.env.QA_PASSWORD!;

const content = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Live collab playground" }] },
    { type: "paragraph", content: [{ type: "text", text: "This note is shared with everyone. Open this same link in a second window — or on your phone — and watch edits, cursors and presence sync live." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Try it" }] },
    { type: "bulletList", content: [
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Type anywhere — the other window sees it as you type." }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Select some text and leave a comment." }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Say hello below — this is a public scratchpad." }] }] },
    ] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Hellos" }] },
    { type: "paragraph", content: [{ type: "text", text: "👋 from the Notepad team" }] },
  ],
};

const schema = getSchema([StarterKit]);
const ydoc = prosemirrorJSONToYDoc(schema, content, "default");
const update = Y.encodeStateAsUpdate(ydoc);
const hex = Array.from(update).map((b) => b.toString(16).padStart(2, "0")).join("");

const auth = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
}).then((r) => r.json());
if (!auth.access_token) throw new Error("sign-in failed: " + JSON.stringify(auth).slice(0, 200));
const H = { apikey: KEY, Authorization: `Bearer ${auth.access_token}`, "Content-Type": "application/json" };

const noteId = crypto.randomUUID();
let res = await fetch(`${SUPABASE_URL}/rest/v1/notepads`, {
  method: "POST", headers: { ...H, Prefer: "return=minimal" },
  body: JSON.stringify({ id: noteId, title: "Live collab playground", allow_guest_access: true, folder_id: null }),
});
if (!res.ok) throw new Error("notepad insert failed: " + (await res.text()).slice(0, 300));

res = await fetch(`${SUPABASE_URL}/rest/v1/notepad_updates`, {
  method: "POST", headers: { ...H, Prefer: "return=minimal" },
  body: JSON.stringify({ notepad_id: noteId, update: `\\x${hex}` }),
});
if (!res.ok) throw new Error("doc seed failed: " + (await res.text()).slice(0, 300));

console.log("SHOWCASE_NOTE_ID=" + noteId);
