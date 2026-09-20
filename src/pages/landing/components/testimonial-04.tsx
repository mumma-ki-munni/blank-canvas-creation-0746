import { type ReactNode } from "react";

/* ── Testimonial 04 — large centered quote ───────────────────────
 * Port of TailwindPlus testimonial-with-large-quote.
 *
 * Big centered blockquote with smart quotes, avatar, name, byline.
 * Subheading-sized text (2rem → 3rem on sm+).
 */

interface Testimonial04Props {
  quote: string;
  avatar: ReactNode;
  name: string;
  byline: string;
}

export function Testimonial04({
  quote,
  avatar,
  name,
  byline,
}: Testimonial04Props) {
  return (
    <section className="landing py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <figure className="text-foreground">
          <blockquote className="mx-auto max-w-[60rem] text-center font-heading text-[2rem]/[3rem] tracking-tight text-pretty sm:text-5xl/[4rem]">
            <p>&ldquo;{quote}&rdquo;</p>
          </blockquote>
          <figcaption className="mt-16 flex flex-col items-center">
            <div className="flex size-12 overflow-hidden rounded-full outline -outline-offset-1 outline-black/5 *:size-full *:object-cover">
              {avatar}
            </div>
            <p className="mt-4 text-center text-sm/6 font-semibold">{name}</p>
            <p className="text-center text-sm/6 text-muted-foreground">{byline}</p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
