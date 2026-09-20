import { Button } from "@/components/base/button";

/* ── CTA 06 — simple left-aligned ───────────────────────────────
 * Port of TailwindPlus call-to-action-simple.
 *
 * Left-aligned h2 with optional eyebrow + subtitle + CTA buttons.
 */

interface Cta06Props {
  eyebrow?: string;
  heading: string;
  subtitle?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export function Cta06({
  eyebrow,
  heading,
  subtitle,
  primaryCta,
  secondaryCta,
}: Cta06Props) {
  return (
    <section className="landing py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10 flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <div className="flex max-w-4xl flex-col gap-2">
            {eyebrow && (
              <p className="text-sm/7 font-semibold text-muted-foreground">{eyebrow}</p>
            )}
            <h2 className="text-pretty">{heading}</h2>
          </div>
          {subtitle && (
            <p className="flex max-w-3xl flex-col gap-4 text-pretty text-base/7 text-muted-foreground">
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
