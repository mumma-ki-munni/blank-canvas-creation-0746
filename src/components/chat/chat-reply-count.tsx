import { memo } from "react";
import { cn } from "@/lib/utils";
import { getCursorColor } from "@/components/collaboration/cursor-colors";

interface ChatReplyCountProps {
  replyCount: number;
  replyUserIds: string[];
  onClick: () => void;
}

// "↳ N replies" link with avatar dots
export const ChatReplyCount = memo(function ChatReplyCount({
  replyCount,
  replyUserIds,
  onClick,
}: ChatReplyCountProps) {
  if (replyCount === 0) return null;

  const shown = replyUserIds.slice(0, 5);

  return (
    // mt-8(8px) flex cursor-pointer gap-4(4px) rounded-4(4px)
    //             text-foreground-secondary hover:text-foreground-primary
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mt-2 flex cursor-pointer items-center gap-1 rounded",
        "border border-transparent text-muted-foreground",
        "transition-colors duration-100 hover:text-foreground",
        "before:mr-1 before:text-border before:content-['↳']",
      )}
    >
      {/* Avatar dots */}
      {shown.length > 0 && (
        <div className="flex -space-x-1">
          {shown.map((userId) => (
            <div
              key={userId}
              className="h-4 w-4 rounded-full border-2 border-background"
              style={{ backgroundColor: getCursorColor(userId) }}
            />
          ))}
        </div>
      )}
      {/* F size:micro bold color:currentColor */}
      <span className="text-[10px] font-bold">
        {replyCount} {replyCount === 1 ? "reply" : "replies"}
      </span>
    </button>
  );
});
