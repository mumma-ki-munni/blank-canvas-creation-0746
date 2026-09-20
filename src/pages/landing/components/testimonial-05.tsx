import { type ReactNode } from "react";

/* ── Testimonial 05 — two column with large photo ────────────────
 * Port of TailwindPlus testimonial-two-column-with-large-photo.
 *
 * Left: quote + attribution. Right: large photo.
 * Both inside a muted card with 2px padding (inset border feel).
 */

interface Testimonial05Props {
  quote: string;
  photo: ReactNode;
  name: string;
  byline: string;
}

export function Testimonial05({
  quote,
  photo,
  name,
  byline,
}: Testimonial05Props) {
  return (
    <section className="py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <figure className="grid grid-cols-1 gap-x-2 rounded-xl bg-muted p-2 lg:grid-cols-2">
          <div className="flex flex-col items-start justify-between gap-10 p-6 text-foreground sm:p-10">
            <blockquote className="relative flex flex-col gap-4 text-2xl/9 text-pretty">
              <p>
                <span className="absolute -translate-x-full">&ldquo;</span>
                {quote}&rdquo;
              </p>
            </blockquote>
            <figcaption className="text-sm/7">
              <p className="font-semibold">{name}</p>
              <p className="text-muted-foreground">{byline}</p>
            </figcaption>
          </div>
          <div className="flex overflow-hidden rounded-sm outline -outline-offset-1 outline-black/5 *:object-cover">
            {photo}
          </div>
        </figure>
      </div>
    </section>
  );
}
