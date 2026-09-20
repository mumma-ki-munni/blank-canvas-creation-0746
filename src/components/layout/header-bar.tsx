import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/base/icon";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderBarProps {
  title?: ReactNode;
  centerContent?: ReactNode;
  rightContent?: ReactNode;
  onClickBack?: () => void;
  backButtonTooltip?: string;
  hideBackButton?: boolean;
  /** Leading button glyph. the editor's default is the back chevron; pass "menu" to
   *  use the left slot as a sidebar toggle (Direction B note drawer). */
  leadingIcon?: string;
  className?: string;
}

export function HeaderBar({
  title,
  centerContent,
  rightContent,
  onClickBack,
  backButtonTooltip = "Exit",
  hideBackButton = false,
  leadingIcon = "chevron_left",
  className,
}: HeaderBarProps) {
  return (
    <div
      className={cn(
        // g_: pointer-events:all; overflow:hidden.
        // (Dropped the editor's padding-bottom:1rem — sits flush per request.)
        "pointer-events-auto",
        "overflow-hidden",
        // g_: direction:column (Flex base) — stacks header + card nav
        "flex flex-col",
        // g_: background: linear-gradient(180deg, muted 0% ... transparent 100%)
        // canvas surround (muted), not pure white
        "bg-gradient-to-b from-muted from-25% to-transparent",
        className,
      )}
    >
      <div
        className={cn(
          // y: justify-content:space-between; color:foreground/primary;
          "flex items-center justify-between gap-1",
          // y: paddingLeft/Right:4 (0.25rem). Tightened vertical padding (py-3 → py-2).
          "px-1 py-2",
          "text-foreground",
          // y: p { white-space: nowrap }
          "[&_p]:whitespace-nowrap",
        )}

      >
        {/* Left — 33% */}
        <div className="flex min-w-0 shrink items-center justify-start gap-2 sm:basis-1/3">
          {!hideBackButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClickBack}
                    aria-label={backButtonTooltip}
                    // variant:'transparent' = no bg, no border
                    // _: z-index:1; border-radius:8px; height:2.5rem;
                    className="z-[1] h-8 shrink-0 rounded-lg bg-transparent hover:bg-transparent"
                  >
                    {/* iconId:'chevron--left--small'; "menu" turns
                        the left slot into the note-drawer toggle */}
                    <Icon name={leadingIcon} size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{backButtonTooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {title && (
            <span className="min-w-0 max-w-[18ch] translate-y-px truncate px-2 text-sm font-medium">
              {title}
            </span>
          )}
        </div>

        {/* Center — flex-1 */}
        {centerContent && (
          <div className="flex flex-1 items-center justify-center">
            {centerContent}
          </div>
        )}

        {/* Right — 33% */}
        <div className="flex shrink-0 items-center justify-end gap-2 sm:basis-1/3">
          {rightContent}
        </div>

      </div>
    </div>
  );
}
