import { useState, useEffect, useRef, useCallback } from "react";
import type { Awareness } from "y-protocols/awareness";

// typing state is a field on Yjs Awareness (same as cursors).
// Mu dispatches qe({partialLocalAwarenessState: {isWritingTo: 'root'}})
// which sets a field on awareness, synced via Ably alongside cursor data.
// We do the same — setLocalStateField on the existing awareness.

export function useChatTyping(awareness: Awareness | null) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for awareness changes — extract typing users
  useEffect(() => {
    if (!awareness) return;

    const onChange = () => {
      const states = awareness.getStates();
      const typing: string[] = [];
      states.forEach((state, clientId) => {
        if (
          clientId !== awareness.clientID &&
          state.isWritingTo &&
          state.user?.name
        ) {
          typing.push(state.user.name);
        }
      });
      setTypingUsers(typing);
    };

    // Use "update" not "change" — "change" only fires when values differ
    // (deep equality), "update" fires on every applyAwarenessUpdate including
    // when the same isWritingTo value is re-broadcast
    awareness.on("update", onChange);
    return () => awareness.off("update", onChange);
  }, [awareness]);

  // Broadcast typing state — 2 second debounce (bundle: 2e3)
  const broadcastTyping = useCallback(
    (text: string) => {
      if (!awareness) return;
      if (timerRef.current !== null) clearTimeout(timerRef.current);

      if (text === "") {
        awareness.setLocalStateField("isWritingTo", null);
        return;
      }

      awareness.setLocalStateField("isWritingTo", "root");

      timerRef.current = setTimeout(() => {
        awareness.setLocalStateField("isWritingTo", null);
      }, 2000);
    },
    [awareness],
  );

  return { typingUsers, broadcastTyping };
}
