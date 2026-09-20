import { type ReactNode } from "react";

/* ── Testimonial 06 — three column grid ──────────────────────────
 * Port of TailwindPlus testimonials-three-column-grid.
 *
 * Section header (eyebrow + headline + subtitle) with a grid of
 * testimonial cards below. Each card has a quote, avatar, name, byline.
 */

interface TestimonialCardProps {
  quote: string;
  avatar: ReactNode;
  name: string;
  byline: string;
}

function TestimonialCard({ quote, avatar, name, byline }: TestimonialCardProps) {
  return (
    <figure className="flex flex-col justify-between gap-10 rounded-md bg-muted p-6 text-sm/7 text-foreground">
      <blockquote className="relative flex flex-col gap-4">
        <p>
          <span className="absolute -translate-x-full">&ldquo;</span>
          {quote}&rdquo;
        </p>
      </blockquote>
      <figcaption className="flex items-center gap-4">
        <div className="flex size-12 overflow-hidden rounded-full outline -outline-offset-1 outline-black/5 *:size-full *:object-cover">
          {avatar}
        </div>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-muted-foreground">{byline}</p>
        </div>
      </figcaption>
    </figure>
  );
}

interface Testimonial06Props {
  eyebrow?: string;
  heading: string;
  subtitle?: string;
  testimonials: TestimonialCardProps[];
}

export function Testimonial06({
  eyebrow,
  heading,
  subtitle,
  testimonials,
}: Testimonial06Props) {
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
