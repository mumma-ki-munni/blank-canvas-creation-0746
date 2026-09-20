// zu + Ru + Fu + Lu

interface ChatReactionGroupProps {
  emoji: string;
  userIds: string[];
  userNameMap?: Record<string, string>;
}

// show up to 2 names, then "and N others"
function formatNames(names: string[], limit: number): string {
  const filtered = names.filter(Boolean);
  const shown = filtered.slice(0, limit);
  const overflow = filtered.slice(limit);
  if (overflow.length <= 1) {
    return [...shown, ...overflow].join(", ");
  }
  return `${shown.join(", ")}, and ${overflow.length} others`;
}

export function ChatReactionGroup({
  emoji,
  userIds,
  userNameMap = {},
}: ChatReactionGroupProps) {
  const names = userIds.map(
    (id) => userNameMap[id] ?? id.slice(0, 8),
  );

  return (
    // Iu wrapper + Fu text styles
    <div className="flex items-center gap-1 px-6 py-1">
      <span className="text-xs font-bold leading-6 text-muted-foreground">
        {formatNames(names, 2)} reacted with
      </span>
      <span className="ml-1.5 inline-flex translate-y-0.5 items-center text-sm text-foreground">
        {emoji}
      </span>
    </div>
  );
}
