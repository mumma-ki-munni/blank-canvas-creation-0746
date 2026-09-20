import type * as React from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Color-variant wrapper around shadcn's Badge. Badges are metadata, never
 * actions — always subtle tinted backgrounds, never solid fills (solid =
 * buttons only). Import from here, never from `components/ui/badge` directly.
 */
export type BadgeColor = "gray" | "blue" | "amber" | "red" | "green" | "purple";

const colorStyles: Record<BadgeColor, string> = {
  gray: "bg-muted text-foreground border-transparent",
  blue: "bg-blue-50 text-blue-700 border-transparent dark:bg-blue-950 dark:text-blue-300",
  amber:
    "bg-amber-50 text-amber-700 border-transparent dark:bg-amber-950 dark:text-amber-300",
  red: "bg-red-50 text-red-700 border-transparent dark:bg-red-950 dark:text-red-300",
  green:
    "bg-green-50 text-green-700 border-transparent dark:bg-green-950 dark:text-green-300",
  purple:
    "bg-purple-50 text-purple-700 border-transparent dark:bg-purple-950 dark:text-purple-300",
};

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: BadgeColor;
}

function Badge({ color = "gray", className, ...props }: BadgeProps) {
  return (
    <ShadcnBadge
      variant="outline"
      className={cn("font-medium", colorStyles[color], className)}
      {...props}
    />
  );
}

export { Badge };
