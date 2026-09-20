import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/base/icon";
import { LandingHeader } from "@/components/landing-header";
import { cn } from "@/lib/utils";
import { getCursorColor } from "@/components/collaboration/cursor-colors";
import { NOTE_GROUPS } from "@/data/demo-doc";
import { DEMO_URL } from "@/lib/demo-link";
import "./hero-editor.css";
import { AUTH_CTA } from "@/lib/auth-cta";


/**
 * Landing hero — a bold, oversized headline with a product mockup below.
 * Absolute pixel offsets are rebuilt as responsive flex:
 *   - nav → headline gap ~96–116px  → mt-16/24
 *   - giant headline (mobile 70 → desktop 180, −3% tracking) → clamp()
 *   - subtitle offset right on desktop, stacked on mobile
 *   - product mockup below; email signup on mobile
 * Heading font is a heavy display weight (900). Accent → the pack's brand color
 * via `text-primary` / the shared --cta-grad gradient.
 */
// Left note-list drawer — mirrors components/workspace/NoteDrawer. Sample data
// (NOTE_GROUPS) is shared with the /demo rail, defined in data/demo-doc.ts.

function Avatar({ who, initial }: { who: string; initial: string }) {
  return (
    <span
      className="flex size-7 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-background"
      style={{ background: getCursorColor(who) }}
    >
      {initial}
    </span>
  );
}

function Check({ done }: { done?: boolean }) {
  return done ? (
    <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] bg-primary text-white">
      <Icon name="check" size={13} />
    </span>
  ) : (
    <span className="mt-0.5 size-[18px] shrink-0 rounded-[5px] border-2 border-border" />
  );
}

/**
 * Hero product preview — a real, populated editor screen rendered as static
 * DOM. Built at the editor's true 972×552 canvas (note drawer + header + doc
 * card, mirroring components/layout) and scaled uniformly to the container via
 * ResizeObserver, so it stays crisp and keeps its real aspect ratio at any size.
 */
function ProductMockup() {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;
    const fit = (w: number) => {
      canvas.style.transform = `scale(${w / 972})`;
    };
    fit(frame.clientWidth);
    const ro = new ResizeObserver((entries) => fit(entries[0].contentRect.width));
    ro.observe(frame);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative w-full overflow-hidden rounded-xl bg-background"
      style={{ aspectRatio: "972 / 552", boxShadow: "0 0 80px rgba(0,0,0,0.14)" }}
    >
      <div
        ref={canvasRef}
        className="absolute left-0 top-0 flex origin-top-left overflow-hidden"
        style={{ width: 972, height: 552 }}
      >
        {/* ── Note drawer (mirrors components/workspace/NoteDrawer) ── */}
        <aside className="flex h-full w-[240px] shrink-0 flex-col bg-muted">
          {/* Title band — 48px, matches the editor header height */}
          <div className="flex h-12 shrink-0 items-center px-3">
            <span className="text-sm font-semibold text-foreground">Notepad</span>
          </div>
          {/* Controls — New note + Search */}
          <div className="flex flex-col gap-0.5 px-1 pb-2">
            <div className="flex h-8 items-center gap-2 rounded-lg px-2 text-[13px] font-medium text-foreground">
              <Icon name="add" size={16} />
              New note
            </div>
            <div className="flex h-8 items-center gap-2 rounded-lg px-2 text-[13px] text-muted-foreground">
              <Icon name="search" size={16} />
              Search…
            </div>
          </div>
          {/* List — Pinned group + recency buckets */}
          <div className="flex-1 space-y-3 overflow-hidden px-1">
            {NOTE_GROUPS.map((g) => (
              <section key={g.label}>
                <h3 className="px-2 py-1 font-heading text-[11px] font-semibold text-muted-foreground">
                  {g.label}
                </h3>
                <div className="space-y-1">
                  {g.notes.map((n) => (
                    <div
                      key={n.title}
                      className={
                        "relative rounded-lg px-2 py-2 " + (n.active ? "bg-primary" : "")
                      }
                    >
                      <div className="flex items-center gap-1.5 pr-10">
                        {n.pinned && (
                          <Icon
                            name="pin--filled"
                            size={13}
                            className={n.active ? "text-white" : "text-muted-foreground"}
                          />
                        )}
                        <h4
                          className={
                            "truncate font-heading text-[13px] font-medium " +
                            (n.active ? "text-white" : "text-foreground")
                          }
                        >
                          {n.title}
                        </h4>
                      </div>
                      <p
                        className={
                          "mt-0.5 truncate text-[12px] " +
                          (n.active ? "text-white/80" : "text-muted-foreground")
                        }
                      >
                        {n.snippet}
                      </p>
                      <span
                        className={
                          "absolute right-2 top-1/2 -translate-y-1/2 text-[11px] tabular-nums " +
                          (n.active ? "text-white/70" : "text-muted-foreground")
                        }
                      >
                        {n.date}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
          {/* Footer — account row */}
          <div className="flex items-center gap-2 border-t border-border px-3 py-2">
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white"
              style={{ background: getCursorColor("maya") }}
            >
              M
            </span>
            <span className="flex-1 truncate text-[12px] text-muted-foreground">maya@northwind.com</span>
            <Icon name="overflow-menu--horizontal" size={16} className="text-muted-foreground" />
          </div>
        </aside>

        {/* ── Editor pane ── */}
        <div className="flex min-w-0 flex-1 flex-col bg-muted">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2 text-foreground">
              <Icon name="menu" size={18} />
              <span className="text-[13px] font-medium text-foreground">Weekly product sync</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <Avatar who="mira" initial="M" />
                <Avatar who="theo" initial="T" />
                <Avatar who="elena" initial="E" />
              </div>
              <span className="rounded-lg px-2.5 py-1 text-[13px] font-medium text-foreground">Share</span>
              <span className="rounded-lg px-2.5 py-1 text-[13px] font-medium text-foreground">Comments</span>
            </div>
          </div>

          {/* doc card */}
          <div className="flex-1 p-2 pt-0">
            <div className="h-full overflow-hidden rounded-[10px] border border-border bg-card shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
              <div className="mx-auto max-w-[540px] px-12 py-10">
                <h1 className="font-heading text-[27px] font-bold leading-tight tracking-tight text-foreground">
                  Weekly product sync
                </h1>
                <p className="mt-1.5 text-[13px] text-muted-foreground">July 18 · Mira, Theo, Elena</p>

                <h2 className="mt-7 text-[15px] font-semibold text-foreground">Agenda</h2>
                <ul className="mt-2.5 space-y-2 text-[15px] leading-snug text-foreground">
                  <li className="flex gap-2.5">
                    <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                    {/* highlight mark — showcases the highlight feature */}
                    <span>Ship status for the <mark className="rounded bg-[#fde53a]/80 px-0.5 text-foreground">editor beta</mark></span>
                  </li>
                  <li className="flex gap-2.5"><span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />Collaboration bugs from last week</li>
                  <li className="flex gap-2.5"><span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />Q3 roadmap priorities</li>
                </ul>

                {/* inserted image — showcases image support */}
                <div
                  className="mt-3.5 aspect-[16/7] overflow-hidden rounded-lg border border-border"
                  style={{ background: "linear-gradient(120deg,#bfdbfe,#c4b5fd 55%,#fbcfe8)" }}
                />

                <h2 className="mt-6 text-[15px] font-semibold text-foreground">Decisions</h2>
                <ul className="mt-2.5 space-y-2.5 text-[15px] leading-snug text-foreground">
                  <li className="flex gap-2.5"><Check done />Move real-time cursors out of beta</li>
                  <li className="flex gap-2.5"><Check done />Cut the standalone mobile app</li>
                  <li className="relative flex gap-2.5">
                    <Check />
                    Revisit pricing tiers next sync
                    {/* live collaborator cursor */}
                    <span className="absolute -right-2 top-0 flex items-center">
                      <span className="h-5 w-0.5" style={{ background: getCursorColor("mira") }} />
                      <span
                        className="ml-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                        style={{ background: getCursorColor("mira") }}
                      >
                        Mira
                      </span>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroEditor() {
  return (
    <section className="relative min-h-screen" style={{ background: "var(--cta-grad)" }}>
      <LandingHeader />

      {/* ── Content (cleared below the fixed 70px header) ── */}
      <div className="mx-auto max-w-[1380px] px-6 pb-24 pt-[70px]">
        {/* ── Headline + subtitle (centered, live: headline above subtitle) ── */}
        <div className="mt-16 flex flex-col items-center gap-8 text-center lg:mt-28 lg:gap-12">
          <h1
            data-spec="h1"
            className="lp-hero-h1 whitespace-pre font-heading text-white"
            style={{
              fontWeight: 800, // heavy display weight
              lineHeight: 0.95, // live: 194.18/204.4
              letterSpacing: "normal", // live: normal (Figma redesign had −3%)
            }}
          >
            Note-taking app
          </h1>
          <p
            data-spec="subtitle"
            className="max-w-[683px] text-lg leading-relaxed text-white/90 sm:text-[28px] sm:leading-[1.75]"
          >
            Real-time collaborative notes workspace
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={DEMO_URL}
              className="brand-pill brand-standard flex h-12 items-center justify-center rounded-lg px-7 text-base font-semibold hover:opacity-90"
            >
              <span>{AUTH_CTA.demo}</span>
            </Link>
            {/* Seeded workspace tour — no sign-in, no database. */}
            <Link
              to="/demo"
              className="flex h-12 items-center justify-center rounded-lg border border-white/50 px-7 text-base font-semibold text-white hover:bg-white/10"
            >
              Try demo
            </Link>
          </div>
        </div>

        {/* ── Product mockup (full container width, matches the header) ──── */}
        <div className="mt-14 lg:mt-24">
          <ProductMockup />
        </div>
      </div>
    </section>
  );
}
