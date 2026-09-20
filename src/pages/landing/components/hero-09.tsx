import { type ReactNode } from "react";
import { Button } from "@/components/base/button";
import { Wallpaper } from "./hero-04";
import { PartnerLogoGrid, type Logo } from "./partner-logo-grid";

/* ── Hero 09 — with demo on background ───────────────────────────
 * Port of TailwindPlus hero-with-demo-on-background.
 *
 * Full-width wallpaper background with left-aligned text and a demo
 * that overflows to the right edge of the screen. The demo bleeds
 * off the right on desktop and is contained on mobile.
 *
 * Text is white on the dark wallpaper. Subtitle uses white/70.
 */

interface Hero09Props {
  eyebrow?: string;
  heading: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  demo: ReactNode;
  logos?: Logo[];
}

export function Hero09({
  eyebrow,
  heading,
  subtitle,
  primaryCta,
  secondaryCta,
  demo,
  logos,
}: Hero09Props) {
  return (
    <section className="flex flex-col gap-16 px-2 pb-16">
      <Wallpaper className="rounded-lg">
        <div className="-mx-2 sm:px-6 md:px-12 lg:px-0">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-10 flex flex-col gap-16">
            <div className="flex gap-x-10 gap-y-16 max-lg:flex-col sm:gap-y-24">
              <div className="landing flex shrink-0 flex-col items-start gap-6 pt-16 sm:pt-32 lg:basis-[42rem] lg:py-40">
                {eyebrow && (
                  <p className="text-sm/7 font-semibold text-white/70">
                    {eyebrow}
                  </p>
                )}
                <h1 className="max-w-5xl text-balance display text-white">
                  {heading}
                </h1>
                <p className="flex max-w-3xl flex-col gap-4 text-lg/8 text-white/70">
                  {subtitle}
                </p>
                <div className="flex items-center gap-4">
                  <Button asChild>
                    <a href={primaryCta.href}>{primaryCta.label}</a>
                  </Button>
                  {secondaryCta && (
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                      <a href={secondaryCta.href}>{secondaryCta.label}</a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="lg:pt-24">
                <div className="relative h-72 sm:h-[23rem] md:h-[31.25rem] lg:size-full">
                  <div className="absolute inset-y-0 left-0 flex w-screen overflow-hidden *:h-full *:w-auto *:max-w-none max-lg:rounded-t-lg lg:rounded-tl-lg">
                    {demo}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Wallpaper>
      {logos && logos.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
          <PartnerLogoGrid logos={logos} />
        </div>
      )}
    </section>
  );
}
