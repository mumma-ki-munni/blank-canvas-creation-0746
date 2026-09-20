import { type ReactNode, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type SidebarState = "hidden" | "narrow" | "wide";

const sidebarWidths: Record<SidebarState, number> = {
  hidden: 0,
  narrow: 170,
  wide: 350,
};

interface SidebarProps {
  state: SidebarState;
  children?: ReactNode;
  className?: string;
}

export function Sidebar({ state, children, className }: SidebarProps) {
  const width = sidebarWidths[state];

  if (state === "hidden" && !children) return null;

  return (
    <div
      className={cn("h-full shrink-0 overflow-hidden", className)}
      style={{
        width,
        transition: "width 200ms cubic-bezier(0.25, 0.1, 0.25, 1)",
      }}
    >
      <div
        className="ml-auto flex h-full flex-col gap-2 overflow-visible"
        style={{ width }}
      >
        {children}
      </div>
    </div>
  );
}

export function useSidebar(initial: SidebarState = "hidden") {
  const [state, setState] = useState<SidebarState>(initial);

  const show = useCallback(
    (mode: "narrow" | "wide" = "narrow") => setState(mode),
    [],
  );
  const hide = useCallback(() => setState("hidden"), []);
  const toggle = useCallback(
    (mode: "narrow" | "wide" = "narrow") =>
      setState((s) => (s === "hidden" ? mode : "hidden")),
    [],
  );

  return { state, show, hide, toggle } as const;
}

export type { SidebarState };
