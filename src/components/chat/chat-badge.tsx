import { cn } from "@/lib/utils";

interface ChatBadgeProps {
  count: number;
  className?: string;
}

// Unread count badge.
export function ChatBadge({ count, className }: ChatBadgeProps) {
  if (count === 0) return null;

  return (
    // pill: padding:1px 8px, border-radius:1rem, bg:primary (brand)
    // text: tabular-nums, 10px, bold, white
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-px",
        "bg-primary",
        "text-[10px] font-bold tabular-nums text-white",
        className,
      )}
    >
      {count}
    </span>
  );
}
