import { type ReactNode } from "react";
import { Button } from "@/components/base/button";

/* ── Hero 10 — full primary background with demo ─────────────────
 * Inspired by Framer's prototyping page hero.
 *
 * Full-width primary background, white text. Two-column on desktop
 * (text left + demo right), stacks on mobile with demo below.
 * Clean solid color — no wallpaper noise.
 */

interface Hero10Props {
  heading: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  demo: ReactNode;
}

export function Hero10({
  heading,
  subtitle,
  primaryCta,
  secondaryCta,
  demo,
}: Hero10Props) {
  return (
    <section className="bg-primary">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="flex gap-16 max-lg:flex-col lg:items-center">
          <div className="landing flex flex-1 flex-col items-start gap-6 pt-16 sm:pt-24 lg:py-32">
            <h1 className="max-w-5xl text-balance display text-primary-foreground">
              {heading}
            </h1>
            <p className="max-w-xl text-lg/8 text-white/70">
              {subtitle}
            </p>
            <div className="flex items-center gap-4">
              <Button variant="secondary" asChild>
                <a href={primaryCta.href}>{primaryCta.label}</a>
              </Button>
              {secondaryCta && (
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <a href={secondaryCta.href}>{secondaryCta.label}</a>
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-1 justify-center pb-0 lg:py-16">
            {demo}
          </div>
        </div>
      </div>
    </section>
  );
}
