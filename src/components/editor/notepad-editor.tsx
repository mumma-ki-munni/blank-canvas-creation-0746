import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { Extension } from "@tiptap/core";
import { yCursorPlugin } from "@tiptap/y-tiptap";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import Mention from "@tiptap/extension-mention";
import { Plugin } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { uploadNoteImage } from "./upload-image";
import { createMentionSuggestion } from "./mention-suggestion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Toolbar } from "./toolbar";
import { SlashMenu } from "./slash-menu";
import { useCollaboration } from "@/components/collaboration";
import "./editor.css";

/**
 * The note's title is the text of the document's FIRST heading, wherever it
 * sits. With no heading we fall back to the first non-empty line so the note
 * is still recognisable in the list.
 *
 * An empty doc derives an EMPTY title, not the word "Untitled". "Untitled" is
 * what we *show* for a note with no title (`r.title || "Untitled"` in the data
 * provider, and the header below) — storing it would make a blank note look
 * like someone deliberately named it that, and it is what made the two create
 * paths disagree: the workspace wrote "" while the editor wrote "Untitled".
 */
function deriveTitle(editor: Editor): string {
  let heading = "";
  let firstText = "";
  editor.state.doc.descendants((node) => {
    if (heading) return false;
    if (node.type.name === "heading") {
      const text = node.textContent.trim();
      if (text) {
        heading = text;
        return false;
      }
    } else if (!firstText && node.isTextblock) {
      firstText = node.textContent.trim();
    }
    return true;
  });
  return heading || firstText || "";
}

interface NotepadEditorProps {
  notepadId: string;
  onTitleChange?: (title: string) => void;
  onEditorReady?: (editor: Editor) => void;
  onAwarenessReady?: (awareness: import("y-protocols/awareness").Awareness) => void;
  className?: string;
}


export function NotepadEditor({
  notepadId,
  onTitleChange,
  onEditorReady,
  onAwarenessReady,
  className,
}: NotepadEditorProps) {
  const { yDoc, awareness, user } = useCollaboration();

  // Set cursor user info + editorId on awareness
  // Source: function u() + filterAwarenessStates in with-collaboration-R5BBL3Ju.js
  useEffect(() => {
    awareness.setLocalStateField("user", user);
    awareness.setLocalStateField("editorId", notepadId);
  }, [awareness, user, notepadId]);

  const [slashMenu, setSlashMenu] = useState<{
    isOpen: boolean;
    position: { top: number; left: number };
    searchText: string;
    slashPos: number;
  }>({ isOpen: false, position: { top: 0, left: 0 }, searchText: "", slashPos: 0 });
  const slashRef = useRef(slashMenu);
  slashRef.current = slashMenu;

  const editor = useEditor({
    extensions: [
      // StarterKit v3 includes: Bold, Italic, Strike, Code, Underline, Link,
      // Heading, Paragraph, BulletList, OrderedList, ListItem, Blockquote,
      // CodeBlock, HorizontalRule, Document, Text, UndoRedo
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false },
        // Disable history — Yjs has its own undo manager
        undoRedo: false,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      // Tables — the editor supports them (Slate table/row/cell). Styled in
      // editor.css (border-collapse + border/default cells + muted header).
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: "notepad-image" } }),
      Highlight.configure({ multicolor: true }),
      Mention.configure({
        HTMLAttributes: { class: "mention" },
        suggestion: createMentionSuggestion(notepadId),
      }),
      // Handle image drop + paste — upload to Supabase Storage, insert with URL.
      Extension.create({
        name: "imageUploadHandler",
        addProseMirrorPlugins() {
          const insertImage = (view: import("@tiptap/pm/view").EditorView, file: File, coords?: { pos: number }) => {
            uploadNoteImage(file, notepadId)
              .then((src) => {
                const { schema } = view.state;
                const node = schema.nodes.image?.create({ src });
                if (!node) return;
                const tr = coords
                  ? view.state.tr.insert(coords.pos, node)
                  : view.state.tr.replaceSelectionWith(node);
                view.dispatch(tr);
              })
              .catch((e) => console.error("[image upload]", e));
          };
          return [
            new Plugin({
              props: {
                handleDOMEvents: {
                  drop: (view, event) => {
                    const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
                      f.type.startsWith("image/"),
                    );
                    if (!files.length) return false;
                    event.preventDefault();
                    const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
                    files.forEach((f) => insertImage(view, f, pos != null ? { pos } : undefined));
                    return true;
                  },
                  paste: (view, event) => {
                    const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
                      f.type.startsWith("image/"),
                    );
                    if (!files.length) return false;
                    event.preventDefault();
                    files.forEach((f) => insertImage(view, f));
                    return true;
                  },
                },
              },
            }),
          ];
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing — type / for formatting",
      }),
      // Yjs collaboration — replaces direct JSON save
      Collaboration.configure({
        document: yDoc,
      }),
      // Collaborative cursors via yCursorPlugin (y-prosemirror)
      // cursor DOM
      // Using raw plugin instead of @tiptap/extension-collaboration-cursor
      // which has a version mismatch with Tiptap v3
      Extension.create({
        name: "collaborationCursor",
        addProseMirrorPlugins() {
          return [
            yCursorPlugin(awareness, {
              cursorBuilder: (cursorUser: Record<string, string>) => {
                const cursor = document.createElement("span");
                cursor.classList.add("collaboration-cursor__caret");
                cursor.setAttribute("style", `--cursor-color: ${cursorUser.color}`);
                const label = document.createElement("div");
                label.classList.add("collaboration-cursor__label");
                label.textContent = cursorUser.name ?? "";
                cursor.appendChild(label);
                return cursor;
              },
            }),
          ];
        },
      }),
    ],
    // No content prop — Yjs provides content via Collaboration extension
    onUpdate: ({ editor }) => {
      // Title extraction — the document's first heading names the note.
      queueMicrotask(() => onTitleChange?.(deriveTitle(editor)));


      // Slash menu detection in onUpdate (runs in React lifecycle)
      const { from } = editor.state.selection;
      const charBefore = from > 1 ? editor.state.doc.textBetween(from - 1, from) : "";

      if (charBefore === "/" && !slashRef.current.isOpen) {
        const twoBefore = from > 2 ? editor.state.doc.textBetween(from - 2, from - 1) : "";
        if (from === 2 || twoBefore === " " || twoBefore === "") {
          const coords = editor.view.coordsAtPos(from);
          setSlashMenu({
            isOpen: true,
            position: { top: coords.bottom + 8, left: coords.left },
            searchText: "",
            slashPos: from - 1,
          });
        }
      } else if (slashRef.current.isOpen) {
        const slashPos = slashRef.current.slashPos;
        const slashChar = editor.state.doc.textBetween(
          slashPos,
          Math.min(slashPos + 1, editor.state.doc.content.size),
        );
        if (slashChar !== "/" || from < slashPos + 1) {
          setSlashMenu((prev) => ({ ...prev, isOpen: false }));
        } else {
          const text = from > slashPos + 1
            ? editor.state.doc.textBetween(slashPos + 1, from, "")
            : "";
          setSlashMenu((prev) => ({ ...prev, searchText: text }));
        }
      }
    },
    editorProps: {
      attributes: {
        class: "outline-none min-h-full",
      },
    },
  });

  // Expose editor instance to parent
  useEffect(() => {
    if (editor) onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  // Sync the title once the Yjs document has loaded/changed remotely, so
  // opening an existing note corrects a stale stored title without editing.
  useEffect(() => {
    if (!editor) return;
    const sync = () => onTitleChange?.(deriveTitle(editor));
    sync();
    yDoc.on("update", sync);
    return () => {
      yDoc.off("update", sync);
    };
  }, [editor, yDoc, onTitleChange]);


  // Expose awareness to parent for typing indicator
  useEffect(() => {
    onAwarenessReady?.(awareness);
  }, [awareness, onAwarenessReady]);

  return (
    <div className={cn("notepad-editor", className)}>
      {editor && <Toolbar editor={editor} />}
      {editor && (
        <SlashMenu
          editor={editor}
          isOpen={slashMenu.isOpen}
          onClose={() => setSlashMenu((s) => ({ ...s, isOpen: false }))}
          position={slashMenu.position}
          searchText={slashMenu.searchText}
          slashPos={slashMenu.slashPos}
        />
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
