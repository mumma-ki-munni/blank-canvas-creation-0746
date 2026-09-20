import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { cn } from "@/lib/utils";
import { getCursorColor } from "@/components/collaboration/cursor-colors";

export interface MentionUser {
  id: string;
  name: string;
}

interface ChatMentionListProps {
  items: MentionUser[];
  command: (attrs: { id: string; label: string }) => void;
}

export const ChatMentionList = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  ChatMentionListProps
>(function ChatMentionList({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  const select = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) command({ id: item.id, label: item.name });
    },
    [items, command],
  );

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          select(selectedIndex);
          return true;
        }
        return false;
      },
    }),
    [items.length, select, selectedIndex],
  );

  return (
    // bg:white, border-radius:6px, shadow, border:grey[5],
    //             min-width:250px, max-height:220px, overflow-y:scroll
    <div
      className={cn(
        "min-w-[250px] max-h-[220px] overflow-y-scroll rounded-md",
        "border border-border bg-background",
        "shadow-[0_16px_24px_rgba(0,0,0,0.08)]",
      )}
    >
      {items.length > 0 ? (
        items.map((item, i) => (
          // f9: block, full-width, hover:bg-grey[2], selected:bg-grey[2]
          <button
            key={item.id}
            type="button"
            onClick={() => select(i)}
            className={cn(
              "block w-full text-left",
              "transition-colors duration-100",
              i === selectedIndex ? "bg-accent" : "bg-transparent",
              "hover:bg-accent",
            )}
          >
            {/* d9: padding:0.75rem 0, margin:0 1rem, border-bottom */}
            <div
              className={cn(
                "mx-4 flex items-center gap-2 border-b border-border py-3",
                i === items.length - 1 && "border-b-0",
              )}
            >
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: getCursorColor(item.id) }}
              >
                {item.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold">{item.name}</span>
            </div>
          </button>
        ))
      ) : (
        <div className="mx-4 py-3 text-center text-sm text-muted-foreground">
          No result
        </div>
      )}
    </div>
  );
});
