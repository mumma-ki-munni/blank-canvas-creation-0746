import { HeroEditor } from "./components/hero-editor";
import { Testimonials } from "./components/testimonials";
import { CtaSignup } from "./components/cta-signup";
import { Footer } from "./components/footer";

/**
 * Landing page — marketing hero + logo wall + testimonials + CTA, built section
 * by section. (Prior showcase components remain in ./components but are unused.)
 *
 * Brand accent = the pack's CTA color (primary), set in style-pack.css. The
 * landing's CTAs use the shared --cta-grad gradient; solid brand fills use
 * text-/bg-primary.
 */
export default function Landing() {
  return (
    <div>
      <HeroEditor />
      <Testimonials />
      <CtaSignup />
      <Footer />
    </div>
  );
}
