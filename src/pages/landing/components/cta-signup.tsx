import { Link } from "react-router-dom";
import { DEMO_URL } from "@/lib/demo-link";
import { AUTH_CTA } from "@/lib/auth-cta";

/**
 * CTA — full-width brand-gradient band: a centered white heading and the same
 * two CTAs the header uses (View demo + Get started). Every marketing surface
 * says "Get started" for the auth door — see docs/design/auth-screen.md.
 */
export function CtaSignup() {
  return (
    <section className="brand-fill brand-plus w-full text-white">
      <div className="mx-auto flex max-w-[800px] flex-col items-center px-6 py-20 text-center lg:py-24">
        <h2
          className="mb-8 font-heading font-extrabold text-white"
          style={{ fontSize: "clamp(34px, 5vw, 60px)", lineHeight: 1.05 }}
        >
          Ready to write together?
        </h2>
        {/* Vertical on mobile: side-by-side CTAs squeeze at phone width.
            Stacked, each keeps a 44px tap height. */}
        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:justify-center">
          <Link
            to={DEMO_URL}
            className="flex h-11 w-full max-w-[320px] items-center justify-center whitespace-nowrap rounded-lg border border-white/50 px-5 text-sm font-semibold text-white hover:bg-white/10 sm:h-10 sm:w-auto"
          >
            {AUTH_CTA.demo}
          </Link>
          <Link
            to="/login"
            className="brand-pill brand-standard flex h-11 w-full max-w-[320px] items-center justify-center whitespace-nowrap rounded-lg px-5 text-sm font-semibold hover:opacity-90 sm:h-10 sm:w-auto"
          >
            <span>{AUTH_CTA.enter}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
