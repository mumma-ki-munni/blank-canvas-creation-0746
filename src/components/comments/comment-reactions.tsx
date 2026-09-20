import { cn } from "@/lib/utils";
import type { Reaction } from "./use-comments";

// _ue → mue/hue/gue
// mue: flex-wrap, gap:4px, margin-top:4px
// hue: padding:2px 5px, border:1px solid surface/soft, border-radius:6px
//      own reaction: bg surface/soft, border surface/strong
//      hover: border-color border/strong, bg border/default
// gue: font-size:10px, margin-left:6px, color:foreground/secondary
//      only rendered when count > 1

interface CommentReactionsProps {
  reactions: Reaction[];
  currentUserId: string;
  onAdd: (emoji: string) => void;
  onRemove: (reactionId: string) => void;
  className?: string;
}

export function CommentReactions({
  reactions,
  currentUserId,
  onAdd,
  onRemove,
  className,
}: CommentReactionsProps) {
  const grouped = reactions.reduce(
    (acc, r) => {
      (acc[r.reaction] ??= []).push(r);
      return acc;
    },
    {} as Record<string, Reaction[]>,
  );

  if (Object.keys(grouped).length === 0) return null;

  return (
    // flex, flex-wrap, gap:4px, margin-top:4px
    <div className={cn("mt-1 flex flex-wrap gap-1", className)}>
      {Object.entries(grouped).map(([emoji, items]) => {
        const myReaction = items.find((r) => r.user_id === currentUserId);
        const isActive = myReaction !== undefined;

        return (
          // padding:2px 5px, border-radius:6px
          <button
            key={emoji}
            type="button"
            onClick={() => {
              if (isActive && myReaction) {
                onRemove(myReaction.id);
              } else {
                onAdd(emoji);
              }
            }}
            className={cn(
              "flex cursor-pointer items-center rounded-md border px-[5px] py-[2px]",
              "transition-colors",
              "hover:border-border hover:bg-border",
              isActive
                ? "bg-accent border-border"
                : "bg-transparent border-accent",
            )}
          >
            <span className="text-sm">{emoji}</span>
            {/* only shown when count > 1 */}
            {items.length > 1 && (
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                {items.length}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
