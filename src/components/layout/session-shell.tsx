import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SessionShellProps {
  children: ReactNode;
  className?: string;
}

export function SessionShell({ children, className }: SessionShellProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0",
        "z-[1]",
        "h-dvh w-full",
        "grid grid-rows-[auto_1fr_auto] grid-cols-1",
        className,
      )}
    >
      {children}
    </div>
  );
}
