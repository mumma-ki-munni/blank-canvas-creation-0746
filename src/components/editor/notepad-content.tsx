import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NotepadContentProps {
  children: ReactNode;
  className?: string;
}

// The doc body starts well down the page: py-64 (= 256px in the default Tailwind
// scale) + inner my-auto centers the content and pushes it below the fold.
//
// Content width: 12-col grid, content in cols 2-11 (~83%).
export function NotepadContent({ children, className }: NotepadContentProps) {
  return (
    <div className={cn("flex flex-1 flex-col py-10 sm:py-64", className)}>
      <div
        className={cn(
          // Vertically centered (inner my-auto). Auto margins
          // collapse when the doc exceeds the viewport, so tall docs top-align.
          "my-auto w-full",
          // Desktop: 12-col grid, content in cols 2-11
          "grid grid-cols-12 px-[1.5rem] gap-x-[1.5rem]",
          // Phone (<600px): 6-col, tighter side padding so lines get width
          "max-[600px]:grid-cols-6 max-[600px]:px-[0.75rem] max-[600px]:gap-x-[0.75rem]",
        )}
      >

        {/* Children render in cols 2-11 (desktop) or 1-6 (phone) */}
        <div
          className={cn(
            "col-start-2 col-span-10",
            "max-[600px]:col-start-1 max-[600px]:col-span-6",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
