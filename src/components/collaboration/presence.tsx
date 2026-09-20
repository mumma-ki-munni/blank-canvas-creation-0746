import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCursorColor } from "./cursor-colors";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string | null;
}

export function usePresence(notepadId: string, currentUser: { id: string; name: string; avatarUrl?: string | null }) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`presence:${notepadId}`, {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ name: string; id: string; avatarUrl?: string | null }>();
        const seen = new Set<string>();
        const online: User[] = [];
        for (const u of Object.values(state).flat()) {
          if (seen.has(u.id)) continue;
          seen.add(u.id);
          online.push({
            id: u.id,
            name: u.name,
            color: getCursorColor(u.id),
            avatarUrl: u.avatarUrl ?? null,
          });
        }
        setUsers(online);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: currentUser.id,
            name: currentUser.name,
            avatarUrl: currentUser.avatarUrl ?? null,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notepadId, currentUser.id, currentUser.name, currentUser.avatarUrl]);

  return users;
}

interface PresenceAvatarsProps {
  users: User[];
  /** How many faces to show before collapsing into a "+n" chip. */
  max?: number;
  className?: string;
}

export function PresenceAvatars({ users, max = 5, className }: PresenceAvatarsProps) {
  if (users.length === 0) return null;

  return (
    <div className={cn("flex items-center -space-x-1.5", className)}>
      {users.slice(0, max).map((u) => (
        u.avatarUrl ? (
          <img
            key={u.id}
            src={u.avatarUrl}
            alt={u.name}
            title={u.name}
            className="h-6 w-6 rounded-full border-2 border-background object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            key={u.id}
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background text-[10px] font-medium text-white"
            style={{ backgroundColor: u.color }}
            title={u.name}
          >
            {u.name.charAt(0).toUpperCase()}
          </div>
        )
      ))}
      {users.length > max && (
        <div className="flex h-6 items-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          +{users.length - max}
        </div>
      )}
    </div>
  );
}
