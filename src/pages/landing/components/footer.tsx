import { Link } from "react-router-dom";

/** Minimal footer — wordmark and the copyright line. */
export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-white">
      <div className="mx-auto flex max-w-[1380px] flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <Link to="/" className="text-lg font-bold tracking-tight text-foreground">
          Notepad
        </Link>
        <span className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Notepad
        </span>
      </div>
    </footer>
  );
}
