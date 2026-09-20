import { cn } from "@/lib/utils";
import { useState } from "react";
import { getCursorColor } from "@/components/collaboration/cursor-colors";
import { CommentContent } from "./comment-content";
import { CommentHoverActions } from "./comment-hover-actions";
import type { Comment } from "./use-comments";

// Source: wuein editor-context-provider
// border:1px solid border/default; border-radius:0.75rem;
// padding:1.25rem 0.675rem 0.675rem 1rem; font-size:14px;
// hover: border-color: border/strong

interface CommentMessageProps {
  comment: Comment;
  isResolved?: boolean;
  onReaction: (emoji: string) => void;
  onRemoveReaction: (reactionId: string) => void;
  currentUserId: string;
  className?: string;
}

export function CommentMessage({
  comment,
  isResolved = false,
  onReaction,
  onRemoveReaction,
  currentUserId,
  className,
}: CommentMessageProps) {
  const [hovered, setHovered] = useState(false);
  const color = getCursorColor(comment.user_id);
  const initial = comment.user_name.charAt(0).toUpperCase();
  const time = new Date(comment.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3",
        "overflow-hidden rounded-xl border",
        "p-[1.25rem_0.675rem_0.675rem_1rem]",
        "text-sm transition-all duration-100",
        "hover:border-foreground/10",
        "my-1",
        className,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Source: o9— resolved badge */}
      {isResolved && (
        <div className="absolute inset-x-0 top-0 bg-muted px-1 py-px text-center text-[10px] font-bold text-muted-foreground">
          Resolved
        </div>
      )}

      {/* Hover actions toolbar */}
      {!isResolved && (
        <CommentHoverActions
          visible={hovered}
          onReaction={(emoji) => onReaction(emoji)}
        />
      )}

      {/* Header: avatar + name + time */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white"
          style={{ backgroundColor: color }}
        >
          {initial}
        </div>
        <span className="text-sm font-medium">{comment.user_name}</span>
        {/* Source: kue — font-size:12px; color:foreground/secondary; nowrap */}
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {time}
        </span>
        {comment.edited_at && (
          <span className="pl-1 text-xs text-muted-foreground">(edited)</span>
        )}
      </div>

      {/* read-only tiptap renderer */}
      <CommentContent content={comment.body} />

      {/* Reactions */}
      {comment.reactions.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {(() => {
            const grouped = comment.reactions.reduce(
              (acc, r) => {
                (acc[r.reaction] ??= []).push(r);
                return acc;
              },
              {} as Record<string, typeof comment.reactions>,
            );
            return Object.entries(grouped).map(([emoji, items]) => {
              const mine = items.find((r) => r.user_id === currentUserId);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => mine ? onRemoveReaction(mine.id) : onReaction(emoji)}
                  className={cn(
                    "flex cursor-pointer items-center rounded-md border px-1.5 py-0.5",
                    "transition-colors hover:border-foreground/10",
                    mine && "border-primary/30 bg-primary/5",
                  )}
                >
                  <span className="text-sm">{emoji}</span>
                  <span className="ml-1.5 text-[10px] text-muted-foreground">{items.length}</span>
                </button>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
