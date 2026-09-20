import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/base/icon";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { ChatTyping } from "./chat-typing";
import { ChatThread } from "./chat-thread";
import type { MessageGroup } from "./use-chat";
import type { Json } from "@/integrations/supabase/types";

interface ChatPanelProps {
  title?: string;
  groups: MessageGroup[];
  onSend: (body: Json) => void;
  onClose: () => void;
  showClose?: boolean;
  visible?: boolean;
  typingUsers?: string[];
  onTypingChange?: (text: string) => void;
  // Messages
  currentUserId?: string;
  replyCounts?: Record<string, number>;
  onReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (reactionId: string) => void;
  onThreadOpen?: (messageId: string) => void;
  // Thread
  threadId?: string | null;
  threadGroups?: MessageGroup[];
  threadTypingUsers?: string[];
  onThreadSend?: (body: Json) => void;
  onThreadClose?: () => void;
  onThreadTypingChange?: (text: string) => void;
  className?: string;
}

export function ChatPanel({
  title,
  groups,
  onSend,
  onClose,
  showClose = true,
  visible = true,
  typingUsers = [],
  onTypingChange,
  currentUserId = "",
  replyCounts,
  onReaction,
  onRemoveReaction,
  onThreadOpen,
  threadId,
  threadGroups = [],
  threadTypingUsers = [],
  onThreadSend,
  onThreadClose,
  onThreadTypingChange,
  className,
}: ChatPanelProps) {
  const showHeader = title !== undefined || showClose;
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    // relative, flex-col, overflow, 100%
    <div
      ref={panelRef}
      className={cn(
        "relative flex h-full w-full flex-1 flex-col overflow-x-hidden overflow-y-auto",
        className,
      )}
      role="region"
      aria-label={title}
    >
      {/* padding:16px 16px 24px 12px, flex, space-between */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 pb-6 pt-4 pl-3">
          {title !== undefined ? (
            <span className="text-sm font-bold">{title}</span>
          ) : (
            <span />
          )}
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded hover:bg-accent"
              aria-label="Close"
            >
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
      )}

      {/* message list */}
      <ChatMessages
        groups={groups}
        currentUserId={currentUserId}
        replyCounts={replyCounts}
        onReaction={onReaction}
        onRemoveReaction={onRemoveReaction}
        onThreadOpen={onThreadOpen}
      />

      {/* input area — the editor spacing 1:1px → my-4=4px, mr-16=16px, ml-12=12px */}
      <div className="my-[4px] mr-[16px] ml-[12px] flex flex-col gap-[4px]">
        <ChatInput onSend={onSend} triggerFocus={visible} onChange={onTypingChange} />
        <ChatTyping typingUsers={typingUsers} />
      </div>

      {/* AnimatePresence → Qu → Yu — thread slide-in */}
      <AnimatePresence>
        {threadId && onThreadSend && onThreadClose && (
          <motion.div
            className="absolute inset-0 z-10 pl-6"
            style={{ willChange: "left" }}
            initial={{ left: 350 }}
            animate={{ left: 0 }}
            exit={{ left: 350 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <ChatThread
              groups={threadGroups}
              typingUsers={threadTypingUsers}
              onSend={onThreadSend}
              onClose={onThreadClose}
              onTypingChange={onThreadTypingChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
