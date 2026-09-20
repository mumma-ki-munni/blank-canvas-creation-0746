// Typing indicator.

interface ChatTypingProps {
  typingUsers: string[];
}

// Gu = 5 (max names before "Several people")
const MAX_NAMES = 5;

export function ChatTyping({ typingUsers }: ChatTypingProps) {
  if (typingUsers.length === 0) return null;

  const text =
    typingUsers.length > MAX_NAMES
      ? "Several people are typing..."
      : `${typingUsers.join(", ")} ${typingUsers.length === 1 ? "is" : "are"} typing...`;

  return (
    // height:16px, padding-left:16px, font-size:12px,
    //            color:foreground/secondary, user-select:none
    <div className="h-4 select-none pl-4 text-xs text-muted-foreground">
      {text}
    </div>
  );
}
