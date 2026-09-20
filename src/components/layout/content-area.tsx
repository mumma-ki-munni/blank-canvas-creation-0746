import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContentAreaProps {
  children?: ReactNode;
  sidebar?: ReactNode;
  /** Left-edge panel (Direction B note drawer). Pushes the card, like `sidebar`. */
  leftSidebar?: ReactNode;
  className?: string;
}

export function ContentArea({
  children,
  sidebar,
  leftSidebar,
  className,
}: ContentAreaProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto",
        // n_: padding:'xxsmall' (0.5rem = 8px) around card + sidebar
        "relative flex h-full gap-2 overflow-hidden p-2",
        className,
      )}
    >
      {/* Left sidebar slot (note drawer) */}
      {leftSidebar}

      {/* Main content — scrollable card */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          "rounded-[10px]",
          "border border-border bg-card",
          "shadow-[0_4px_12px_rgba(0,0,0,0.04)]",
        )}
      >
        <div className="flex min-h-full flex-col overflow-auto">
          {children}
        </div>
      </div>

      {/* Sidebar slot */}
      {sidebar}
    </div>
  );
}
