/**
 * Testimonials — centered heading + 3 bordered cards (8px radius, 1px border,
 * 60px padding): quote at top, then a circle avatar, name, and role.
 *
 * Content is placeholder — swap `TESTIMONIALS` for your own.
 */
const AV = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=120&h=120&fit=crop&crop=faces&q=75`;

const TESTIMONIALS = [
  {
    quote:
      "Every meeting note, spec, and brainstorm lives in Notepad now. It's the shared brain our team was missing.",
    name: "Maya Chen",
    role: "Founder of Northwind",
    avatar: AV("1517841905240-472988babdf9"), // teal bg
  },
  {
    quote:
      "Docs used to mean endless copy-paste and version chaos. With Notepad, we just write — together, live.",
    name: "Elena Torres",
    role: "Head of Product at Contoso",
    avatar: AV("1573496359142-b8d87734a5a2"), // orange bg
  },
  {
    quote:
      "Notepad makes our whole team feel like we're in the same room, even when we're across the world.",
    name: "Priya Nair",
    role: "COO at Globex",
    avatar: AV("1534528741775-53994a69daeb"), // purple bg
  },
];

export function Testimonials() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1380px] px-6 py-20 lg:py-28">
        <h2
          className="mb-14 text-center font-heading font-extrabold text-foreground lg:mb-16"
          style={{ fontSize: "clamp(36px, 5vw, 60px)", lineHeight: 1 }}
        >
          What teams are saying
        </h2>
        <div className="grid gap-10 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-[8px] border border-border bg-white p-9 lg:p-[60px]"
            >
              <p
                className="flex-1 text-lg leading-[2] text-foreground"
                style={{ letterSpacing: "0.2px" }}
              >
                {t.quote}
              </p>
              <img
                src={t.avatar}
                alt={t.name}
                loading="lazy"
                className="mb-3 mt-9 size-[60px] rounded-full object-cover"
              />
              <h4 className="text-[27px] font-semibold leading-tight text-foreground">
                {t.name}
              </h4>
              <p className="text-lg text-muted-foreground">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
