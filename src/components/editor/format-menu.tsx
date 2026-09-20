import { type Editor } from "@tiptap/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/base/icon";
import { cn } from "@/lib/utils";
import { blockActions, type BlockAction } from "./block-actions";

/**
 * The formatting entry point: ONE button in the header chrome (between the
 * title and Share), which opens the menu — actions live in the menu, not in a
 * bar across the document. The bubble menu (on selection) and the slash menu
 * (on "/") stay as the quick paths; this is the visible door.
 */

type FormatAction = BlockAction;

const blocks = blockActions;

const marks: FormatAction[] = [
  { id: "bold", icon: "format_bold", label: "Bold", isActive: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
  { id: "italic", icon: "format_italic", label: "Italic", isActive: (e) => e.isActive("italic"), run: (e) => e.chain().focus().toggleItalic().run() },
  { id: "underline", icon: "format_underlined", label: "Underline", isActive: (e) => e.isActive("underline"), run: (e) => e.chain().focus().toggleUnderline().run() },
  { id: "strike", icon: "format_strikethrough", label: "Strikethrough", isActive: (e) => e.isActive("strike"), run: (e) => e.chain().focus().toggleStrike().run() },
  { id: "highlight", icon: "ink_highlighter", label: "Highlight", isActive: (e) => e.isActive("highlight"), run: (e) => e.chain().focus().toggleHighlight().run() },
  { id: "code", icon: "code", label: "Code", isActive: (e) => e.isActive("code"), run: (e) => e.chain().focus().toggleCode().run() },
];

function Item({ action, editor }: { action: FormatAction; editor: Editor }) {
  const active = action.isActive(editor);
  return (
    <DropdownMenuItem
      onSelect={() => action.run(editor)}
      className={cn("gap-2", active && "bg-accent")}
    >
      <Icon name={action.icon} size={18} />
      <span className="flex-1">{action.label}</span>
      {active && <Icon name="check" size={16} className="text-muted-foreground" />}
    </DropdownMenuItem>
  );
}

export function FormatMenu({ editor }: { editor: Editor }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Formatting"
          className="flex h-8 items-center rounded-lg px-3 text-sm font-medium hover:bg-accent"
        >
          Aa
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {blocks.map((a) => (
          <Item key={a.id} action={a} editor={editor} />
        ))}
        <DropdownMenuSeparator />
        {marks.map((a) => (
          <Item key={a.id} action={a} editor={editor} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
