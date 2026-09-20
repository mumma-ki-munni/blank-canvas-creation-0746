import { type ReactNode } from "react";

/* ── Features 08 — with large demo ───────────────────────────────
 * Port of TailwindPlus features-with-large-demo.
 *
 * Section header + large demo area on top + 3-column grid of
 * icon + title + description feature items below.
 */

interface FeatureItemProps {
  icon?: ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex flex-col gap-2 text-sm/7">
      <div className="flex items-center gap-3 text-foreground">
        {icon && <div className="size-[0.8125rem]">{icon}</div>}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

interface Features08Props {
  eyebrow?: string;
  heading: string;
  subtitle?: string;
  demo: ReactNode;
  features: FeatureItemProps[];
}

export function Features08({
  eyebrow,
  heading,
  subtitle,
  demo,
  features,
}: Features08Props) {
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
        <div className="flex flex-col gap-14">
          <div className="w-full">{demo}</div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FeatureItem key={i} {...f} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
