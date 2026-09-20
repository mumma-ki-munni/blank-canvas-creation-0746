import { type ReactNode } from "react";

/* ── Features 05 — three column with demos ───────────────────────
 * Port of TailwindPlus features-three-column-with-demos.
 *
 * Section header + 3-column grid of demo cards. Each card has a
 * demo area (Screenshot/image) on top, title + description below.
 * Cards use a muted background with 2px padding (inset border feel).
 */

interface FeatureCardProps {
  demo: ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ demo, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-lg bg-muted p-2">
      <div className="relative overflow-hidden rounded-sm">
        {demo}
      </div>
      <div className="p-6 sm:p-10 lg:p-6">
        <h3 className="text-base/8 font-medium text-foreground">{title}</h3>
        <p className="mt-2 text-sm/7 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface Features05Props {
  eyebrow?: string;
  heading: string;
  subtitle?: string;
  cta?: ReactNode;
  features: FeatureCardProps[];
}

export function Features05({
  eyebrow,
  heading,
  subtitle,
  cta,
  features,
}: Features05Props) {
  return (
    <section className="landing py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10 flex flex-col gap-10 sm:gap-16">
        <div className="flex max-w-2xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            {eyebrow && (
              <p className="text-sm/7 font-semibold text-muted-foreground">{eyebrow}</p>
            )}
            <h2 className="text-pretty">{heading}</h2>
          </div>
          {subtitle && (
            <p className="text-pretty text-base/7 text-muted-foreground">{subtitle}</p>
          )}
          {cta}
        </div>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
