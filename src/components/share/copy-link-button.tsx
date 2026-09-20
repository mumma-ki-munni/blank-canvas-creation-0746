import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/base/icon";

interface CopyLinkButtonProps {
  notepadId: string;
  /** Is the note open to anyone with the link? */
  allowGuestAccess: boolean;
  /** False until we've actually read the flag — don't guess in the meantime. */
  guestAccessLoaded: boolean;
}

/**
 * Copy the note's URL, and say plainly who that URL will work for.
 *
 * A new note is private (`allow_guest_access` defaults to false), so a copied
 * link opens nothing for anyone who wasn't invited. This used to copy silently
 * either way, which is the whole "I shared it and they saw nothing" bug: the
 * link was real, the note just wasn't open.
 */
export function CopyLinkButton({
  notepadId,
  allowGuestAccess,
  guestAccessLoaded,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = useCallback(() => {
    // The demo's notes live under /demo/:id, so its link has to point there —
    // a copied link that walks the visitor out of the demo is not a link to
    // what they were looking at. What that link finds after the demo has
    // started over is handled by pages/demo: it says so plainly and offers a
    // seeded note, rather than reporting an error. See
    // docs/design/demo-and-seed.md rules 17 to 19.
    const base = window.location.pathname.toLowerCase().startsWith("/demo")
      ? "/demo"
      : "/session";
    const url = `${window.location.origin}${base}/${notepadId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [notepadId]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2",
          "text-sm font-medium transition-colors",
          "hover:bg-accent",
        )}
      >
        <Icon name={copied ? "check" : "content_copy"} size={16} />
        {copied ? "Copied!" : "Copy link"}
      </button>

      <p
        className={cn(
          "text-center text-xs",
          guestAccessLoaded && !allowGuestAccess
            ? "text-destructive"
            : "text-muted-foreground",
        )}
      >
        {!guestAccessLoaded
          ? "Checking who can open this…"
          : allowGuestAccess
            ? "Anyone with this link can open and edit the note."
            : "This link only works for people you invite. Turn on link sharing above to open it up."}
      </p>
    </div>
  );
}
