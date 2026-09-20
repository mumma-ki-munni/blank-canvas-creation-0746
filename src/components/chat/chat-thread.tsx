import { cn } from "@/lib/utils";
import { Icon } from "@/components/base/icon";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { ChatTyping } from "./chat-typing";
import type { MessageGroup } from "./use-chat";
import type { Json } from "@/integrations/supabase/types";

interface ChatThreadProps {
  groups: MessageGroup[];
  typingUsers: string[];
  onSend: (body: Json) => void;
  onClose: () => void;
  onTypingChange?: (text: string) => void;
}

export function ChatThread({
  groups,
  typingUsers,
  onSend,
  onClose,
  onTypingChange,
}: ChatThreadProps) {
  return (
    // relative, h-full, bg:elevated, border-left, shadow, flex-col
    <div
      className={cn(
        "relative flex h-full flex-1 flex-col overflow-y-auto",
        "border-l bg-popover text-popover-foreground",
        "shadow-[0_8px_16px_rgba(0,0,0,0.08)]",
        "pl-3",
      )}
    >
      {/* padding:1rem 1rem 0.5rem 4px, flex, font-weight:500 */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2 pl-1 text-sm font-medium">
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded hover:bg-accent"
          aria-label="Back"
        >
          <Icon name="chevron_left" size={18} />
        </button>
        <span>Thread</span>
      </div>

      <ChatMessages groups={groups} emptyText="No replies yet" />

      {/* mx-16 my-4 gap-4 (1px → 16px 4px 4px) */}
      <div className="mx-[16px] my-[4px] flex flex-col gap-[4px]">
        <ChatInput
          onSend={onSend}
          placeholder="Reply in thread..."
          onChange={onTypingChange}
        />
        <ChatTyping typingUsers={typingUsers} />
      </div>
    </div>
  );
}
