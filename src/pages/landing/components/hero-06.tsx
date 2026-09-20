import { type ReactNode } from "react";
import { Button } from "@/components/base/button";
import { PartnerLogoGrid, type Logo } from "./partner-logo-grid";

/* ── Hero 06 — left-aligned with demo ────────────────────────────
 * Port of TailwindPlus hero-left-aligned-with-demo.
 *
 * Left-aligned text block + full-width demo below (typically a
 * <Screenshot> wrapping a <BrowserFrame>). Consumer controls
 * the demo wrapping.
 */

interface Hero06Props {
  eyebrow?: string;
  heading: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  demo: ReactNode;
  logos?: Logo[];
}

export function Hero06({
  eyebrow,
  heading,
  subtitle,
  primaryCta,
  secondaryCta,
  demo,
  logos,
}: Hero06Props) {
  return (
    <section className="landing py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10 flex flex-col gap-16">
        <div className="flex flex-col gap-32">
          <div className="flex flex-col items-start gap-6">
            {eyebrow && (
              <p className="text-sm/7 font-semibold text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h1 className="max-w-5xl text-balance display">{heading}</h1>
            <p className="flex max-w-3xl flex-col gap-4 text-lg/8 text-muted-foreground">
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
