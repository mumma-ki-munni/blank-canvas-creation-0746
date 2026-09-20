import { type ReactNode } from "react";

/* ── Features 06 — two column with demos ─────────────────────────
 * Port of TailwindPlus features-two-column-with-demos.
 *
 * Section header + 2-column grid of demo cards. Each card has a
 * demo area on top, title + description + optional CTA link below.
 */

interface FeatureCardProps {
  demo: ReactNode;
  title: string;
  description: string;
  cta?: ReactNode;
}

function FeatureCard({ demo, title, description, cta }: FeatureCardProps) {
  return (
    <div className="rounded-lg bg-muted p-2">
      <div className="relative overflow-hidden rounded-sm">
        {demo}
      </div>
      <div className="flex flex-col gap-4 p-6 sm:p-10 lg:p-6">
        <div>
          <h3 className="text-base/8 font-medium text-foreground">{title}</h3>
          <p className="mt-2 text-sm/7 text-muted-foreground">{description}</p>
        </div>
        {cta}
      </div>
    </div>
  );
}

interface Features06Props {
  eyebrow?: string;
  heading: string;
  subtitle?: string;
  features: FeatureCardProps[];
}

export function Features06({
  eyebrow,
  heading,
  subtitle,
  features,
}: Features06Props) {
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
        </div>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
