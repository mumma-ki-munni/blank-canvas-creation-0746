import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/base/icon";

interface InviteInputProps {
  onInvite: (email: string, role: "editor" | "viewer") => void;
}

export function InviteInput({ onInvite }: InviteInputProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [sent, setSent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = email.trim();
      if (!trimmed || !trimmed.includes("@")) return;
      onInvite(trimmed, role);
      setEmail("");
      setSent(true);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSent(false), 2000);
    },
    [email, role, onInvite],
  );

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-foreground/20"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
          className="rounded-lg border bg-transparent px-2 py-2 text-sm outline-none"
        >
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <button
          type="submit"
          disabled={!email.trim() || !email.includes("@")}
          className={cn(
            "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
            "disabled:opacity-50",
          )}
        >
          Invite
        </button>
      </form>
      {sent && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="check" size={14} />
          Invite sent
        </div>
      )}
    </div>
  );
}
