import { type Editor } from "@tiptap/react";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/base/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadNoteImage } from "./upload-image";

interface SlashCommand {
  id: string;
  label: string;
  icon: string;
  action: (editor: Editor) => void;
}

// Command order:
// heading1.heading2.heading3.heading4.turn-into-paragraph.paragraph.link.
//       bullet-list.numbered-list.check-list.block-quote.separator.code
const commands: SlashCommand[] = [
  { id: "heading1",      label: "Heading 1",     icon: "format_h1",            action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: "heading2",      label: "Heading 2",     icon: "format_h2",            action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: "heading3",      label: "Heading 3",     icon: "format_h3",            action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: "heading4",      label: "Heading 4",     icon: "format_h4",            action: (e) => e.chain().focus().toggleHeading({ level: 4 }).run() },
  { id: "paragraph",     label: "Paragraph",     icon: "notes",                action: (e) => e.chain().focus().setParagraph().run() },
  { id: "link",          label: "Link",           icon: "link",                 action: (e) => {
    const url = window.prompt("URL");
    if (url) e.chain().focus().setLink({ href: url }).run();
  }},
  { id: "bullet-list",   label: "Bullet list",   icon: "format_list_bulleted", action: (e) => e.chain().focus().toggleBulletList().run() },
  { id: "numbered-list", label: "Numbered list", icon: "format_list_numbered", action: (e) => e.chain().focus().toggleOrderedList().run() },
  { id: "check-list",    label: "Task list",     icon: "checklist",            action: (e) => e.chain().focus().toggleTaskList().run() },
  { id: "block-quote",   label: "Quote",         icon: "format_quote",         action: (e) => e.chain().focus().toggleBlockquote().run() },
  { id: "separator",     label: "Divider",       icon: "horizontal_rule",      action: (e) => e.chain().focus().setHorizontalRule().run() },
  { id: "code",          label: "Code block",    icon: "code_blocks",          action: (e) => e.chain().focus().toggleCodeBlock().run() },
  { id: "table",         label: "Table",         icon: "table",                action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { id: "image",         label: "Image",         icon: "image",                action: (e) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const notepadId = window.location.pathname.split("/").pop() || "unknown";
      try {
        const src = await uploadNoteImage(file, notepadId);
        e.chain().focus().setImage({ src }).run();
      } catch (err) { console.error("[image upload]", err); }
    };
    input.click();
  }},
];

interface SlashMenuProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  searchText: string;
  slashPos: number;
}

export function SlashMenu({ editor, isOpen, onClose, position, searchText, slashPos }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = searchText
    ? commands.filter((c) => c.label.toLowerCase().includes(searchText.toLowerCase()))
    : commands;

  const execute = useCallback(
    (cmd: SlashCommand) => {
      // delete the "/query" text, then run the edit fn.
      // slashPos is the authoritative doc position of the "/" (tracked when it
      // was typed), so deleting [slashPos, cursor] removes exactly "/query".
      const to = editor.state.selection.from;
      if (slashPos >= 0 && slashPos < to) {
        editor.chain().focus().deleteRange({ from: slashPos, to }).run();
      }
      cmd.action(editor);
      onClose();
    },
    [editor, slashPos, onClose],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchText]);

  useEffect(() => {
    if (!isOpen) setSelectedIndex(0);
  }, [isOpen]);

  // keyboard handling:
  // ArrowDown/Up, Tab/Enter to select, / or Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Capture phase + stopPropagation so ProseMirror never handles these keys
      // (otherwise Enter splits the paragraph before we can act on the query).
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        const cmd = filtered[selectedIndex % filtered.length];
        if (cmd) execute(cmd);
      } else if (e.key === "Escape" || e.key === "/") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, filtered, selectedIndex, execute, onClose]);

  if (!isOpen || filtered.length === 0) return null;

  const safeIndex = selectedIndex % filtered.length;

  // Render via portal so the menu floats above everything,
  // not inside the editor's overflow:hidden container.
  return createPortal(
    <div
      className="fixed z-50 w-56 overflow-hidden rounded-md bg-background p-1 shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {filtered.map((cmd, i) => (
        <Button
          key={cmd.id}
          variant="ghost"
          className={cn(
            // gap-8 (0.5rem), p-[0.675rem_0.75rem], rounded-6
            "w-full justify-start gap-2 rounded-md px-3 py-2.5 text-sm",
            "hover:bg-muted",
            i === safeIndex && "bg-muted",
          )}
          onClick={() => execute(cmd)}
          onMouseEnter={() => setSelectedIndex(i)}
        >
          <Icon name={cmd.icon} size={18} className="text-muted-foreground" />
          {cmd.label}
        </Button>
      ))}
    </div>,
    document.body,
  );
}
