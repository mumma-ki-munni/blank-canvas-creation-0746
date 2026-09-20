import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { createRoot, type Root } from "react-dom/client";
import { useEffect, useImperativeHandle, useState, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface MentionItem {
  id: string;
  label: string;
  email?: string | null;
}

async function fetchMembers(notepadId: string, query: string): Promise<MentionItem[]> {
  // Local demo / non-uuid id (e.g. "demo"): no members row, and a non-uuid id
  // would 400 the query. Return empty — suggestions degrade gracefully.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(notepadId)) return [];
  // Members of this notepad + join profiles for display name.
  const { data } = await supabase
    .from("notepad_members")
    .select("user_id, profiles:profiles!user_id(id, display_name, email)")
    .eq("notepad_id", notepadId);
  const rows =
    (data ?? [])
      .map((m: { profiles: { id: string; display_name: string | null; email: string } | null }) =>
        m.profiles
          ? { id: m.profiles.id, label: m.profiles.display_name || m.profiles.email, email: m.profiles.email }
          : null,
      )
      .filter(Boolean) as MentionItem[];
  const q = query.toLowerCase();
  return q ? rows.filter((r) => r.label.toLowerCase().includes(q)) : rows;
}

interface ListProps {
  items: MentionItem[];
  command: (item: { id: string; label: string }) => void;
}

const MentionList = forwardRef<{ onKeyDown: (p: { event: KeyboardEvent }) => boolean }, ListProps>(
  ({ items, command }, ref) => {
    const [idx, setIdx] = useState(0);
    useEffect(() => setIdx(0), [items]);
    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowDown") {
          setIdx((i) => (i + 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === "ArrowUp") {
          setIdx((i) => (i - 1 + items.length) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === "Enter") {
          const item = items[idx];
          if (item) command({ id: item.id, label: item.label });
          return true;
        }
        return false;
      },
    }));
    if (!items.length) {
      return (
        <div className="w-56 rounded-md border bg-background p-2 text-xs text-muted-foreground shadow-lg">
          No members
        </div>
      );
    }
    return (
      <div className="w-56 overflow-hidden rounded-md border bg-background p-1 text-sm shadow-lg">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            onClick={() => command({ id: it.id, label: it.label })}
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left",
              i === idx ? "bg-accent" : "hover:bg-accent",
            )}
          >
            <span className="truncate">{it.label}</span>
          </button>
        ))}
      </div>
    );
  },
);
MentionList.displayName = "MentionList";

export function createMentionSuggestion(notepadId: string): Omit<SuggestionOptions<MentionItem>, "editor"> {
  return {
    char: "@",
    items: ({ query }) => fetchMembers(notepadId, query),
    render: () => {
      let container: HTMLDivElement | null = null;
      let root: Root | null = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rendererRef: any = null;

      const position = (rect: DOMRect | null) => {
        if (!container || !rect) return;
        container.style.top = `${rect.bottom + 6}px`;
        container.style.left = `${rect.left}px`;
      };

      return {
        onStart: (props) => {
          container = document.createElement("div");
          container.style.position = "fixed";
          container.style.zIndex = "50";
          document.body.appendChild(container);
          root = createRoot(container);
          rendererRef = new ReactRenderer(MentionList, {
            props: { items: props.items, command: props.command },
            editor: props.editor,
          });
          root.render(rendererRef.element);
          position(props.clientRect?.() ?? null);
        },
        onUpdate: (props) => {
          rendererRef?.updateProps({ items: props.items, command: props.command });
          position(props.clientRect?.() ?? null);
        },
        onKeyDown: (props) => {
          if (props.event.key === "Escape") {
            root?.unmount();
            container?.remove();
            return true;
          }
          return rendererRef?.ref?.onKeyDown?.(props) ?? false;
        },
        onExit: () => {
          root?.unmount();
          container?.remove();
          root = null;
          container = null;
          rendererRef = null;
        },
      };
    },
  };
}
