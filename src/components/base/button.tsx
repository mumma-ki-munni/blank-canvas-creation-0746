import {
  Button as ShadcnButton,
  type ButtonProps as ShadcnButtonProps,
} from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * Button — wraps shadcn `ui/button` (keeps its variants, focus ring,
 * disabled + asChild) and adds compact chrome sizing. Compose this, never a
 * raw <button>.
 *
 *  - default (no chrome size) → pill CTA, rounded-full h-9 (the landing treatment)
 *  - size="icon-sm"           → h-7 square chrome icon button
 *  - size="control"           → h-8 rounded-lg row action, e.g. "New note"
 *
 * Use variant="ghost" for chrome icon buttons (hover → secondary) and
 * variant="secondary" for an active/selected row (bg secondary).
 */
type ChromeSize = "icon-sm" | "control";

const chromeSizes: Record<ChromeSize, string> = {
  "icon-sm": "size-7 rounded-md p-0",
  control: "h-8 rounded-lg px-3",
};

export interface ButtonProps extends Omit<ShadcnButtonProps, "size"> {
  size?: ShadcnButtonProps["size"] | ChromeSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, ...props }, ref) => {
    const isChrome = typeof size === "string" && size in chromeSizes;
    return (
      <ShadcnButton
        ref={ref}
        size={isChrome ? undefined : (size as ShadcnButtonProps["size"])}
        className={cn(
          // Pill CTA is the default (preserves the landing); compact chrome
          // sizes opt out of the pill.
          !isChrome && "h-9 rounded-full",
          isChrome && chromeSizes[size as ChromeSize],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
