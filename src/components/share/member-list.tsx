import { getCursorColor } from "@/components/collaboration/cursor-colors";
import type { NotepadMember, NotepadInvite } from "./use-members";

interface MemberListProps {
  members: NotepadMember[];
  invites: NotepadInvite[];
  currentUserId: string;
  onRemove: (memberId: string) => void;
  onChangeRole: (memberId: string, role: "editor" | "viewer") => void;
}

export function MemberList({
  members,
  invites,
  currentUserId,
  onRemove,
  onChangeRole,
}: MemberListProps) {
  return (
    <div className="space-y-1">
      {members.map((m) => {
        const isOwner = m.role === "owner";
        const isSelf = m.user_id === currentUserId;
        const name =
          m.profile?.display_name ?? m.profile?.email ?? m.user_id.slice(0, 8);
        const email = m.profile?.email ?? "";
        const avatarUrl = m.profile?.avatar_url;
        const color =
          m.profile?.avatar_color ?? getCursorColor(m.user_id);
        const initial = name.charAt(0).toUpperCase();

        return (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: color }}
              >
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {name}
                {isSelf ? " (you)" : ""}
              </div>
              {email && (
                <div className="truncate text-xs text-muted-foreground">
                  {email}
                </div>
              )}
            </div>
            {isOwner ? (
              <span className="text-xs text-muted-foreground">Owner</span>
            ) : (
              <select
                value={m.role}
                onChange={(e) =>
                  onChangeRole(m.id, e.target.value as "editor" | "viewer")
                }
                disabled={isSelf}
                className="rounded border bg-transparent px-1.5 py-0.5 text-xs outline-none"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            )}
            {!isOwner && !isSelf && (
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                aria-label="Remove"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}

      {invites.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 opacity-60"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            ✉
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm">{inv.email}</div>
            <div className="text-xs text-muted-foreground">Pending invite</div>
          </div>
          <span className="text-xs capitalize text-muted-foreground">
            {inv.role}
          </span>
        </div>
      ))}
    </div>
  );
}
