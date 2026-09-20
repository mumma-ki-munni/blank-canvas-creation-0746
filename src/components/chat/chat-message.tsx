import { memo, useState, useCallback } from "react";
import { getCursorColor } from "@/components/collaboration/cursor-colors";
import { CommentContent } from "@/components/comments/comment-content";
import { CommentHoverActions } from "@/components/comments/comment-hover-actions";
import { CommentReactions } from "@/components/comments/comment-reactions";
import { ChatReplyCount } from "./chat-reply-count";
import type { ChatMessage } from "./use-chat";
import type { Reaction } from "@/components/comments/use-comments";

interface ChatMessageRowProps {
  message: ChatMessage;
  hideHeader: boolean;
  currentUserId?: string;
  replyCount?: number;
  replyUserIds?: string[];
  onReaction?: (emoji: string) => void;
  onRemoveReaction?: (reactionId: string) => void;
  onThreadOpen?: (messageId: string) => void;
}

// x/u9 renders avatar + name + time + body + reactions + reply count
export const ChatMessageRow = memo(function ChatMessageRow({
  message,
  hideHeader,
  currentUserId = "",
  replyCount = 0,
  replyUserIds = [],
  onReaction,
  onRemoveReaction,
  onThreadOpen,
}: ChatMessageRowProps) {
  const [hovered, setHovered] = useState(false);
  const color = getCursorColor(message.user_id);
  const initial = message.user_name.charAt(0).toUpperCase();
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  const handleReaction = useCallback(
    (emoji: string) => onReaction?.(emoji),
    [onReaction],
  );

  const handleReply = useCallback(() => {
    onThreadOpen?.(message.id);
  }, [onThreadOpen, message.id]);

  const handleRemoveReaction = useCallback(
    (reactionId: string) => onRemoveReaction?.(reactionId),
    [onRemoveReaction],
  );

  const handleReplyCountClick = useCallback(() => {
    onThreadOpen?.(message.id);
  }, [onThreadOpen, message.id]);

  return (
    <div
      className={hideHeader ? "flex gap-2 px-6 py-1" : "flex gap-2 px-6 pt-6 py-1"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Avatar — hidden for consecutive, space preserved */}
      <div className="w-6 shrink-0">
        {!hideHeader && (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {initial}
          </div>
        )}
      </div>

      <div className="relative min-w-0 flex-1">
        {/* fue hover actions — reuse from comments */}
        <CommentHoverActions
          visible={hovered}
          onReaction={handleReaction}
          onReply={onThreadOpen ? handleReply : undefined}
        />

        {!hideHeader && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold">{message.user_name}</span>
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {time}
            </span>
          </div>
        )}

        <CommentContent content={message.body} />

        {/* _ue inline reactions
            ChatReaction and Reaction share id/user_id/reaction fields */}
        {message.reactions.length > 0 && (
          <CommentReactions
            reactions={message.reactions as unknown as Reaction[]}
            currentUserId={currentUserId}
            onAdd={handleReaction}
            onRemove={handleRemoveReaction}
          />
        )}

        {/* pue reply count link */}
        <ChatReplyCount
          replyCount={replyCount}
          replyUserIds={replyUserIds}
          onClick={handleReplyCountClick}
        />
      </div>
    </div>
  );
});
