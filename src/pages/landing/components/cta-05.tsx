import { Button } from "@/components/base/button";

/* ── CTA 05 — simple centered ───────────────────────────────────
 * Port of TailwindPlus call-to-action-simple-centered.
 *
 * Centered h2 + optional subtitle + CTA buttons.
 * Uses subheading size (2rem → 3rem on sm+).
 */

interface Cta05Props {
  heading: string;
  subtitle?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export function Cta05({
  heading,
  subtitle,
  primaryCta,
  secondaryCta,
}: Cta05Props) {
  return (
    <section className="landing py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10 flex flex-col items-center gap-10">
        <div className="flex flex-col gap-6">
          <h2 className="max-w-4xl text-center text-pretty">{heading}</h2>
          {subtitle && (
            <p className="flex max-w-3xl flex-col gap-4 text-center text-pretty text-base/7 text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
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
    </section>
  );
}
