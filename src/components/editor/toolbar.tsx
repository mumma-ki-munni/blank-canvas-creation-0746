import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { useState } from "react";
import { Icon } from "@/components/base/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { blockActions } from "./block-actions";

interface ToolbarButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  compact: boolean;
}

// Every icon-only button says its name on hover — the tooltip renders the same
// label the screen reader gets, so adding a button here can never ship a
// nameless icon (an icon alone is a guess; the label is the affordance).
// On touch/compact screens the tooltip is suppressed (hover doesn't exist
// there) but aria-label still carries the accessible name.
function ToolbarButton({ active, onClick, icon, label, compact }: ToolbarButtonProps) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        // height:2.5rem on desktop, compact 2.25rem on small screens
        "flex shrink-0 items-center justify-center rounded-lg",
        compact ? "h-9 w-9" : "h-10 w-10",
        "transition-colors hover:bg-accent",
        active && "bg-accent text-accent-foreground",
      )}
    >
      <Icon name={icon} size={compact ? 16 : 18} />
    </button>
  );

  if (compact) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}


// bold, italic, underline, strikethrough, code, link
// mod+b, mod+i, mod+u, mod+`, mod+shift+x
const markButtons = [
  { mark: "bold",      icon: "format_bold",          label: "Bold (Mod+B)",                toggle: (e: Editor) => e.chain().focus().toggleBold().run() },
  { mark: "italic",    icon: "format_italic",        label: "Italic (Mod+I)",              toggle: (e: Editor) => e.chain().focus().toggleItalic().run() },
  { mark: "underline", icon: "format_underlined",    label: "Underline (Mod+U)",           toggle: (e: Editor) => e.chain().focus().toggleUnderline().run() },
  { mark: "strike",    icon: "format_strikethrough", label: "Strikethrough (Mod+Shift+X)", toggle: (e: Editor) => e.chain().focus().toggleStrike().run() },
  { mark: "highlight", icon: "ink_highlighter",      label: "Highlight",                   toggle: (e: Editor) => e.chain().focus().toggleHighlight().run() },
  { mark: "code",      icon: "code",                 label: "Code (Mod+`)",                toggle: (e: Editor) => e.chain().focus().toggleCode().run() },
  {
    mark: "link",
    icon: "link",
    label: "Link",
    toggle: (e: Editor) => {
      if (e.isActive("link")) {
        e.chain().focus().unsetLink().run();
      } else {
        const url = window.prompt("URL");
        if (url) e.chain().focus().setLink({ href: url }).run();
      }
    },
  },
  {
    mark: "comment",
    icon: "add_comment",
    label: "Comment",
    toggle: (e: Editor) => {
      const { from, to } = e.state.selection;
      if (from === to) return;
      window.dispatchEvent(
        new CustomEvent("notepad:add-comment", {
          detail: { from, to },
        }),
      );
    },
  },
] as const;

interface ToolbarProps {
  editor: Editor;
}

export function Toolbar({ editor }: ToolbarProps) {
  const compact = useIsMobile();
  const [formatOpen, setFormatOpen] = useState(false);

  return (
    <BubbleMenu
      editor={editor}
      // Float clear of the highlighted line instead of sitting on top of it.
      options={{ offset: 10 }}
      // Keep the pill mounted while the "Aa" dropdown holds focus.
      shouldShow={({ editor: e, from, to }) =>
        formatOpen || (from !== to && !e.state.selection.empty)
      }
      className={cn(
        // Floating UI shadow: 1px ring + 8px drop shadow
        "z-[1] flex items-center gap-0.5 rounded-lg",
        // Padding, not a fixed height: the pill breathes around the buttons.
        "bg-background px-1.5 py-1.5",
        // Never clipped by the screen edge: cap to the viewport and scroll
        // horizontally (essential marks come first in markButtons).
        "max-w-[calc(100vw-1.5rem)] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_8px_16px_0_rgba(0,0,0,0.08)]",
      )}
    
    >
      {/* Block type first: turn the selection into a heading, list, quote… */}
      <DropdownMenu open={formatOpen} onOpenChange={setFormatOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Block format"
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg px-2.5 font-medium",
              compact ? "h-9 text-sm" : "h-10 text-[15px]",
              "transition-colors hover:bg-accent",
              formatOpen && "bg-accent text-accent-foreground",
            )}
          >
            Aa
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={6} className="z-50 w-52">
          {blockActions.map((action) => {
            const active = action.isActive(editor);
            return (
              <DropdownMenuItem
                key={action.id}
                onSelect={() => {
                  action.run(editor);
                  editor.commands.focus();
                }}
                className={cn("gap-2", active && "bg-accent")}
              >
                <Icon name={action.icon} size={18} />
                <span className="flex-1">{action.label}</span>
                {active && <Icon name="check" size={16} className="text-muted-foreground" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden="true" />

      <TooltipProvider delayDuration={300}>
        {markButtons.map((btn) => (
          <ToolbarButton
            key={btn.mark}
            active={editor.isActive(btn.mark)}
            onClick={() => btn.toggle(editor)}
            icon={btn.icon}
            label={btn.label}
            compact={compact}
          />
        ))}
      </TooltipProvider>

    </BubbleMenu>
  );
}


