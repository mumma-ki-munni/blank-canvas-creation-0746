import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BottomControlsProps {
  children?: ReactNode;
  className?: string;
}

export function BottomControls({ children, className }: BottomControlsProps) {
  return (
    <div
      className={cn(
        "pointer-events-none",
        "fixed inset-x-0 bottom-0",
        "flex w-full flex-col items-center justify-center",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-auto",
          "z-[1] m-8 flex items-center justify-center",
          "max-sm:mx-2 max-sm:mb-[max(0.5rem,env(safe-area-inset-bottom))] max-sm:mt-2",
        )}
      >

        {children}
      </div>
    </div>
  );
}
