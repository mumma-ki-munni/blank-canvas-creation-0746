import * as Y from "yjs";
import { supabase } from "@/integrations/supabase/client";

/**
 * Renaming a note means rewriting its FIRST HEADING — not just the `title`
 * column.
 *
 * The note's name is derived from that heading on every editor update, and
 * again whenever the document loads (`notepad-editor.tsx`, deriveTitle + the
 * yDoc "update" sync). So writing `notepads.title` on its own is undone the
 * next time anyone opens the note. Editing the heading is the only rename that
 * survives, and it keeps the list and the document saying the same thing.
 *
 * The edit is a normal Yjs update appended to `notepad_updates`, so anyone with
 * the note open sees it arrive live and it merges like any other keystroke.
 */

/** PostgREST returns bytea as `\x` + hex. */
function fromHex(value: string): Uint8Array {
  const hex = value.replace(/^\\x/, "");
  const pairs = hex.match(/.{2}/g);
  if (!pairs) return new Uint8Array();
  return new Uint8Array(pairs.map((b) => parseInt(b, 16)));
}

function toHex(bytes: Uint8Array): string {
  return `\\x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Load every stored update for a note and replay it into a fresh doc. */
async function loadDoc(notepadId: string): Promise<Y.Doc> {
  const { data, error } = await supabase
    .from("notepad_updates")
    .select("update")
    .eq("notepad_id", notepadId)
    .order("id", { ascending: true });
  if (error) throw error;

  const doc = new Y.Doc();
  doc.transact(() => {
    for (const row of data ?? []) {
      Y.applyUpdate(doc, fromHex(row.update as string));
    }
  });
  return doc;
}

export async function renameNote(
  notepadId: string,
  newTitle: string,
): Promise<void> {
  const title = newTitle.trim();
  const doc = await loadDoc(notepadId);
  const before = Y.encodeStateVector(doc);
  // "default" is the fragment Tiptap's Collaboration extension uses when no
  // `field` is configured — see notepad-editor.tsx.
  const fragment = doc.getXmlFragment("default");

  // First top-level heading, if the note has one.
  let heading: Y.XmlElement | null = null;
  for (let i = 0; i < fragment.length; i++) {
    const node = fragment.get(i);
    if (node instanceof Y.XmlElement && node.nodeName === "heading") {
      heading = node;
      break;
    }
  }

  doc.transact(() => {
    if (heading) {
      heading.delete(0, heading.length);
      heading.insert(0, [new Y.XmlText(title)]);
    } else {
      // No heading yet — give the note one, so the name has somewhere to live.
      const created = new Y.XmlElement("heading");
      created.setAttribute("level", "1");
      created.insert(0, [new Y.XmlText(title)]);
      fragment.insert(0, [created]);
    }
  });

  const update = Y.encodeStateAsUpdate(doc, before);
  const { error: updateError } = await supabase
    .from("notepad_updates")
    .insert({ notepad_id: notepadId, update: toHex(update) });
  if (updateError) throw updateError;

  // Write the column too, so the list renames immediately instead of waiting
  // for someone to open the note and re-derive it.
  const { error: titleError } = await supabase
    .from("notepads")
    .update({ title })
    .eq("id", notepadId);
  if (titleError) throw titleError;
}
