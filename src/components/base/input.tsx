import { Input as ShadcnInput } from "@/components/ui/input";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * the editor text field — wraps shadcn `ui/input` (keeps its focus ring + disabled)
 * and applies the editor chrome sizing, adapted: h-8, text-sm (14px), px-2,
 * transparent bg, muted-foreground placeholder. Pass `leadingIcon` for a Material Symbols
 * glyph inset on the left (size 16, muted-foreground). Compose this, never
 * a raw <input>.
 */
export interface InputProps extends React.ComponentProps<"input"> {
  leadingIcon?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ leadingIcon, className, ...props }, ref) => {
    const field = (
      <ShadcnInput
        ref={ref}
        className={cn(
          "h-8 rounded-md border-input bg-transparent px-2 text-sm placeholder:text-muted-foreground",
          leadingIcon && "pl-8",
          className,
        )}
        {...props}
      />
    );
    if (!leadingIcon) return field;
    return (
      <div className="relative">
        <Icon
          name={leadingIcon}
          size={16}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        {field}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
