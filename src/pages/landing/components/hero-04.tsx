import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/base/button";
import { PartnerLogoGrid, type Logo } from "./partner-logo-grid";
import { cn } from "@/lib/utils";

/* ── Noise overlay ───────────────────────────────────────────────── */

const noisePattern = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 100 100"><filter id="n"><feTurbulence type="turbulence" baseFrequency="1.4" numOctaves="1" seed="2" stitchTiles="stitch" result="n"/><feComponentTransfer result="g"><feFuncR type="linear" slope="4" intercept="1"/><feFuncG type="linear" slope="4" intercept="1"/><feFuncB type="linear" slope="4" intercept="1"/></feComponentTransfer><feColorMatrix type="saturate" values="0" in="g"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`
)}")`;

/* ── Wallpaper ───────────────────────────────────────────────────── */

export function Wallpaper({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-primary",
        className
      )}
      {...props}
    >
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{ backgroundPosition: "center", backgroundImage: noisePattern }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ── Screenshot ────────────────────────────────────────────────────
 * Wraps demo content in a wallpaper background with directional padding.
 * placement controls which edges get padding — the opposite edge bleeds.
 *
 * "bottom"       → px + pt, content bleeds off bottom
 * "bottom-right" → pt + pl, content bleeds off bottom and right
 * "bottom-left"  → pt + pr, content bleeds off bottom and left
 * "top"          → px + pb, content bleeds off top
 * "top-right"    → pb + pl, content bleeds off top and right
 * "top-left"     → pb + pr, content bleeds off top and left
 */

type Placement = "bottom" | "bottom-left" | "bottom-right" | "top" | "top-left" | "top-right";

const paddingMap: Record<Placement, string> = {
  bottom: "px-[--ss-pad] pt-[--ss-pad]",
  "bottom-left": "pt-[--ss-pad] pr-[--ss-pad]",
  "bottom-right": "pt-[--ss-pad] pl-[--ss-pad]",
  top: "px-[--ss-pad] pb-[--ss-pad]",
  "top-left": "pb-[--ss-pad] pr-[--ss-pad]",
  "top-right": "pb-[--ss-pad] pl-[--ss-pad]",
};

const radiusMap: Record<Placement, string> = {
  bottom: "rounded-t-md",
  "bottom-left": "rounded-tr-md",
  "bottom-right": "rounded-tl-md",
  top: "rounded-b-md",
  "top-left": "rounded-br-md",
  "top-right": "rounded-bl-md",
};

export function Screenshot({
  children,
  placement = "bottom",
  className,
}: {
  children: ReactNode;
  placement?: Placement;
  className?: string;
}) {
  return (
    <Wallpaper
      className={cn("group", className)}
      style={{ "--ss-pad": "min(10%, 4rem)" } as React.CSSProperties}
    >
      <div className={cn("relative", paddingMap[placement])}>
        <div className={cn("overflow-hidden ring-1 ring-black/10", radiusMap[placement])}>
          {children}
        </div>
      </div>
    </Wallpaper>
  );
}

/* ── Browser frame ───────────────────────────────────────────────── */

export function BrowserFrame({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("relative overflow-hidden bg-card", className)}>
      <img
        src="/browser-chrome.svg"
        alt=""
        className="relative z-[1] w-full pointer-events-none"
      />
      <div
        className="absolute z-[2] w-full overflow-hidden bg-card [&>*]:h-full"
        style={{ top: "4.75%", height: "95.25%" }}
      >
        {children}
      </div>
    </figure>
  );
}

/* ── Announcement badge ──────────────────────────────────────────── */

interface AnnouncementBadgeProps {
  text: string;
  href: string;
  cta?: string;
}

function AnnouncementBadge({
  text,
  href,
  cta = "Learn more",
}: AnnouncementBadgeProps) {
  return (
    <a
      href={href}
      className="group inline-flex max-w-full items-center gap-3 overflow-hidden rounded-full bg-muted px-3 py-0.5 text-sm/6 text-foreground transition-colors hover:bg-accent max-sm:flex-col max-sm:rounded-md max-sm:px-3.5 max-sm:py-2"
    >
      <span className="text-pretty sm:truncate">{text}</span>
      <span className="h-3 w-px bg-border max-sm:hidden" />
      <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
        {cta} <ChevronRight className="size-3.5 shrink-0" />
      </span>
    </a>
  );
}

/* ── Hero 04 — centered with demo ──────────────────────────────────
 * Port of TailwindPlus hero-centered-with-demo.
 *
 * The `demo` prop receives the full demo block (typically a <Screenshot>
 * wrapping an image or mockup). The hero does NOT wrap it — the consumer
 * controls the wallpaper color, placement, and responsive variants.
 */

interface Hero04Props {
  heading: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  demo: ReactNode;
  badge?: { text: string; href: string; cta?: string };
  logos?: Logo[];
}

export function Hero04({
  heading,
  subtitle,
  primaryCta,
  secondaryCta,
  demo,
  badge,
  logos,
}: Hero04Props) {
  return (
    <section className="landing py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10 flex flex-col gap-16">
        <div className="flex flex-col items-center gap-32">
          <div className="flex flex-col items-center gap-6">
            {badge && (
              <AnnouncementBadge
                text={badge.text}
                href={badge.href}
                cta={badge.cta}
              />
            )}
            <h1 className="max-w-5xl text-center text-balance display">
              {heading}
            </h1>
            <p className="flex max-w-3xl flex-col gap-4 text-center text-lg/8 text-muted-foreground">
              {subtitle}
            </p>
            <div className="flex items-center gap-4">
              <Button asChild>
                <a href={primaryCta.href}>{primaryCta.label}</a>
              </Button>
              {secondaryCta && (
                <Button variant="outline" asChild>
                  <a href={secondaryCta.href}>{secondaryCta.label}</a>
                </Button>
              )}
            </div>
          </div>
          <div className="w-full">{demo}</div>
        </div>
        {logos && logos.length > 0 && (
          <PartnerLogoGrid logos={logos} />
        )}
      </div>
    </section>
  );
}
