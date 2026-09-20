import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/base/icon";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

// container, button, and separator classes

const quickReactions = ["👍", "🎉", "✅"] as const;

// reaction button: flex h-30 w-30 cursor-pointer items-center justify-center rounded-4
//            border-none, transparent bg, hover/focus muted
const reactionBtnClass = cn(
  "flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded",
  "border-none bg-background p-1 text-sm",
  "hover:bg-accent focus:bg-accent",
);

interface CommentHoverActionsProps {
  visible: boolean;
  onReaction?: (emoji: string) => void;
  onReply?: () => void;
  onEdit?: () => void;
  className?: string;
}

export function CommentHoverActions({
  visible,
  onReaction,
  onReply,
  onEdit,
  className,
}: CommentHoverActionsProps) {
  // emoji picker popover uses isOpen/onOpenChange state
  const [pickerOpen, setPickerOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleEmojiSelect = useCallback(
    (emoji: { native: string }) => {
      onReaction?.(emoji.native);
      setPickerOpen(false);
    },
    [onReaction],
  );

  const handlePickerOpenChange = useCallback((open: boolean) => {
    setPickerOpen(open);
  }, []);

  if (!onReply && !onReaction) return null;

  return (
    // pointer-events-none absolute top-[-30px] left-8 z-1
    //             flex items-center rounded-4 border border-border-default
    //             bg-surface-default p-4 opacity-0 transition-opacity
    <div
      ref={toolbarRef}
      className={cn(
        "pointer-events-none absolute -top-[30px] left-2 z-[1]",
        "flex items-center rounded border border-border bg-background p-1",
        "opacity-0 transition-opacity",
        (visible || pickerOpen) && "pointer-events-auto opacity-100",
        className,
      )}
      role="toolbar"
      aria-label="Comment actions"
    >
      {onReaction && (
        <>
          {quickReactions.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={(e) => {
                onReaction(emoji);
                e.currentTarget.blur();
              }}
              className={reactionBtnClass}
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}

          {/* Radix Popover wrapping emoji-mart Picker
              style:{border:0}, emojiButtonColors:['#808080'], min-h-424 */}
          <Popover open={pickerOpen} onOpenChange={handlePickerOpenChange}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={reactionBtnClass}
                aria-label="More reactions"
              >
                <Icon name="add_reaction" size={16} className="text-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto border-0 p-0 shadow-lg"
              side="bottom"
              align="start"
              sideOffset={4}
            >
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                emojiButtonColors={["#808080"]}
                set="native"
                theme="light"
                previewPosition="none"
              />
            </PopoverContent>
          </Popover>

          {/* separator between reactions and action buttons */}
          {(onReply || onEdit) && (
            <div className="mx-1 h-4 w-px bg-border" />
          )}
        </>
      )}

      {/* reply uses iconId "chat", not "reply" */}
      {onReply && (
        <button
          type="button"
          onClick={(e) => {
            onReply();
            e.currentTarget.blur();
          }}
          className={reactionBtnClass}
          aria-label="Reply"
        >
          <Icon name="chat" size={16} className="text-foreground" />
        </button>
      )}

      {/* edit button (onOpenEditMode) */}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            onEdit();
            e.currentTarget.blur();
          }}
          className={reactionBtnClass}
          aria-label="Edit"
        >
          <Icon name="edit" size={16} className="text-foreground" />
        </button>
      )}
    </div>
  );
}
