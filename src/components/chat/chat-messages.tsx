import { useEffect, useRef } from "react";
import { Icon } from "@/components/base/icon";
import { ChatMessageRow } from "./chat-message";
import { ChatReactionGroup } from "./chat-reaction-group";
import type { MessageGroup } from "./use-chat";

interface ChatMessagesProps {
  groups: MessageGroup[];
  emptyText?: string;
  currentUserId?: string;
  replyCounts?: Record<string, number>;
  onReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (reactionId: string) => void;
  onThreadOpen?: (messageId: string) => void;
}

export function ChatMessages({
  groups,
  emptyText = "Start a conversation",
  currentUserId = "",
  replyCounts,
  onReaction,
  onRemoveReaction,
  onThreadOpen,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // scroll to bottom on mount (setTimeout 0)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // auto-scroll on new messages, only when within 200px of bottom
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.scrollHeight - el.scrollTop - el.clientHeight <= 200) {
        el.scrollTop = el.scrollHeight;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [groups]);

  return (
    <div className="flex-grow overflow-auto" ref={scrollRef}>
      {/* empty state */}
      {groups.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-sm text-muted-foreground">
          <Icon name="chat_bubble_outline" size={16} />
          <span>{emptyText}</span>
        </div>
      )}

      {/* Vu groups → x messages */}
      {groups.map((group) =>
        group.type === "reaction" ? (
          <ChatReactionGroup
            key={group.id}
            emoji={group.emoji}
            userIds={group.userIds}
          />
        ) : (
          group.messages.map((msg, i) => (
            <ChatMessageRow
              key={msg.id}
              message={msg}
              hideHeader={i > 0}
              currentUserId={currentUserId}
              replyCount={replyCounts?.[msg.id] ?? 0}
              onReaction={onReaction ? (emoji) => onReaction(msg.id, emoji) : undefined}
              onRemoveReaction={onRemoveReaction}
              onThreadOpen={onThreadOpen}
            />
          ))
        ),
      )}
    </div>
  );
}
