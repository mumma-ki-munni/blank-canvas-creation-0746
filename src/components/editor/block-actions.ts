import { type Editor } from "@tiptap/react";

/**
 * Block-level formatting actions, shared by the header "Aa" menu
 * (format-menu.tsx) and the inline selection toolbar (toolbar.tsx) so the two
 * entry points never drift.
 */
export interface BlockAction {
  id: string;
  icon: string;
  label: string;
  isActive: (e: Editor) => boolean;
  run: (e: Editor) => void;
}

export const blockActions: BlockAction[] = [
  { id: "paragraph", icon: "notes", label: "Paragraph", isActive: (e) => e.isActive("paragraph"), run: (e) => e.chain().focus().setParagraph().run() },
  { id: "h1", icon: "format_h1", label: "Heading 1", isActive: (e) => e.isActive("heading", { level: 1 }), run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: "h2", icon: "format_h2", label: "Heading 2", isActive: (e) => e.isActive("heading", { level: 2 }), run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: "h3", icon: "format_h3", label: "Heading 3", isActive: (e) => e.isActive("heading", { level: 3 }), run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: "bullets", icon: "format_list_bulleted", label: "Bullet list", isActive: (e) => e.isActive("bulletList"), run: (e) => e.chain().focus().toggleBulletList().run() },
  { id: "numbers", icon: "format_list_numbered", label: "Numbered list", isActive: (e) => e.isActive("orderedList"), run: (e) => e.chain().focus().toggleOrderedList().run() },
  { id: "quote", icon: "format_quote", label: "Quote", isActive: (e) => e.isActive("blockquote"), run: (e) => e.chain().focus().toggleBlockquote().run() },
  { id: "codeblock", icon: "code_blocks", label: "Code block", isActive: (e) => e.isActive("codeBlock"), run: (e) => e.chain().focus().toggleCodeBlock().run() },
];
