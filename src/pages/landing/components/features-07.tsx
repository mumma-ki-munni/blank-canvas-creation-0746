import { type ReactNode } from "react";

/* ── Features 07 — stacked alternating with demos ────────────────
 * Port of TailwindPlus features-stacked-alternating-with-demos.
 *
 * Section header + vertically stacked feature rows. Each row is a
 * 2-column card (text left + demo right), alternating sides via
 * CSS grid flow (even rows flip). Large text size (xl → 2xl).
 */

interface FeatureRowProps {
  demo: ReactNode;
  title: string;
  description: string;
  cta?: ReactNode;
}

function FeatureRow({ demo, title, description, cta }: FeatureRowProps) {
  return (
    <div className="group grid grid-flow-dense grid-cols-1 gap-2 rounded-lg bg-muted p-2 lg:grid-cols-2">
      <div className="flex flex-col justify-between gap-6 p-6 sm:gap-10 sm:p-10 lg:p-6 lg:group-even:col-start-2">
        <div className="text-xl/8 sm:text-2xl/9">
          <h3 className="text-foreground">{title}</h3>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
        {cta}
      </div>
      <div className="relative overflow-hidden rounded-sm lg:group-even:col-start-1">
        {demo}
      </div>
    </div>
  );
}

interface Features07Props {
  eyebrow?: string;
  heading: string;
  subtitle?: string;
  features: FeatureRowProps[];
}

export function Features07({
  eyebrow,
  heading,
  subtitle,
  features,
}: Features07Props) {
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
        <div className="grid grid-cols-1 gap-6">
          {features.map((f, i) => (
            <FeatureRow key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
