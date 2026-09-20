import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as Y from "yjs";
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from "y-protocols/awareness";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCursorColor } from "./cursor-colors";
import "./cursors.css";

interface CollaborationContextValue {
  yDoc: Y.Doc;
  awareness: Awareness;
  isReady: boolean;
  user: { name: string; color: string };
}

const CollaborationContext = createContext<CollaborationContextValue | null>(null);

export function useCollaboration() {
  const ctx = useContext(CollaborationContext);
  if (!ctx) throw new Error("useCollaboration must be inside CollaborationProvider");
  return ctx;
}

interface CollaborationProviderProps {
  notepadId: string;
  userName: string;
  userId: string;
  /**
   * Demo mode. Uses a purely local Y.Doc with no Supabase load/save/realtime —
   * the editor mounts and works fully (slash menu, tables, cursors), but
   * nothing persists and no invites/presence sync. Used by the public /demo.
   */
  local?: boolean;
  children: ReactNode;
}

export function CollaborationProvider({
  notepadId,
  userName,
  userId,
  local = false,
  children,
}: CollaborationProviderProps) {
  const [isReady, setIsReady] = useState(false);

  const yDoc = useMemo(() => new Y.Doc(), [notepadId]);

  // Source: awareness-BQwi4Di3.js — Yjs Awareness with 30s stale timeout
  const awareness = useMemo(() => new Awareness(yDoc), [yDoc]);

  // Source: function u() in with-collaboration-R5BBL3Ju.js
  // Cursor data shape: { name, color, userId }
  const user = useMemo(
    () => ({ name: userName, color: getCursorColor(userId), userId }),
    [userName, userId],
  );

  useEffect(() => {
    // Demo mode — local doc only, no Supabase. Ready immediately.
    if (local) {
      setIsReady(true);
      return () => {
        yDoc.destroy();
      };
    }

    let destroyed = false;
    let cleanupFn: (() => void) | undefined;

    async function init() {
      // Load all existing updates and apply to Y.Doc
      const { data: updates } = await supabase
        .from("notepad_updates")
        .select("update")
        .eq("notepad_id", notepadId)
        .order("id", { ascending: true });

      if (destroyed) return;

      if (updates && updates.length > 0) {
        yDoc.transact(() => {
          for (const row of updates) {
            // PostgREST returns bytea as hex string: \x followed by hex chars
            const hexStr = (row.update as string).replace(/^\\x/, "");
            const binary = new Uint8Array(
              hexStr.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
            );
            Y.applyUpdate(yDoc, binary);
          }
        });
      }

      setIsReady(true);

      // Save local changes to Supabase
      // 200ms throttle — matches source: Qt.remoteIntoLocalThrottleMs
      let pendingUpdates: Uint8Array[] = [];
      let flushTimer: ReturnType<typeof setTimeout> | undefined;

      const flush = () => {
        if (pendingUpdates.length === 0) return;
        const merged = Y.mergeUpdates(pendingUpdates);
        pendingUpdates = [];
        const hex = Array.from(merged).map((b) => b.toString(16).padStart(2, "0")).join("");
        supabase.from("notepad_updates").insert({
          notepad_id: notepadId,
          update: `\\x${hex}`,
        }).then(({ error }) => {
          if (error) {
            console.error("[collab] save error:", error);
            toast.error("Changes couldn't be saved", {
              id: "collab-save-error",
              description: "You may not have permission to edit this note.",
            });
          }
        });
      };

      const onUpdate = (update: Uint8Array, origin: unknown) => {
        if (origin === "remote") return;
        pendingUpdates.push(update);
        clearTimeout(flushTimer);
        flushTimer = setTimeout(flush, 200);
      };
      yDoc.on("update", onUpdate);

      // Subscribe to remote doc updates via Realtime postgres_changes
      const channel = supabase
        .channel(`notepad:${notepadId}`, {
          config: { broadcast: { self: false } },
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notepad_updates",
            filter: `notepad_id=eq.${notepadId}`,
          },
          (payload) => {
            const hexStr = ((payload.new as { update: string }).update).replace(/^\\x/, "");
            const binary = new Uint8Array(
              hexStr.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
            );
            Y.applyUpdate(yDoc, binary, "remote");
          },
        )
        // Awareness sync via broadcast (cursor positions, user info)
        // Source: template y-supabase-provider.ts
        .on("broadcast", { event: "awareness" }, ({ payload }) => {
          if (destroyed) return;
          const update = new Uint8Array(payload.update);
          applyAwarenessUpdate(awareness, update, "remote");
        })
        .subscribe();

      // Broadcast local awareness changes to other tabs
      // Throttled at 200ms to match doc update throttle — so cursor
      // position and content changes arrive together.
      let awarenessFlushTimer: ReturnType<typeof setTimeout> | undefined;
      let pendingAwarenessClients: number[] = [];

      const flushAwareness = () => {
        if (pendingAwarenessClients.length === 0) return;
        const update = encodeAwarenessUpdate(awareness, pendingAwarenessClients);
        pendingAwarenessClients = [];
        channel.send({
          type: "broadcast",
          event: "awareness",
          payload: { update: Array.from(update) },
        });
      };

      const handleAwarenessUpdate = ({ added, updated, removed }: {
        added: number[];
        updated: number[];
        removed: number[];
      }) => {
        if (destroyed) return;
        pendingAwarenessClients.push(...added, ...updated, ...removed);
        clearTimeout(awarenessFlushTimer);
        awarenessFlushTimer = setTimeout(flushAwareness, 200);
      };
      awareness.on("update", handleAwarenessUpdate);

      cleanupFn = () => {
        clearTimeout(flushTimer);
        clearTimeout(awarenessFlushTimer);
        flush();
        flushAwareness();
        yDoc.off("update", onUpdate);
        awareness.off("update", handleAwarenessUpdate);
        supabase.removeChannel(channel);
      };
    }

    init();

    return () => {
      destroyed = true;
      cleanupFn?.();
      yDoc.destroy();
    };
  }, [notepadId, yDoc, local]);

  const value = useMemo(
    () => ({ yDoc, awareness, isReady, user }),
    [yDoc, awareness, isReady, user],
  );

  return (
    <CollaborationContext.Provider value={value}>
      {isReady ? children : null}
    </CollaborationContext.Provider>
  );
}
