import { useSyncExternalStore } from "react";

/**
 * Who the visitor is inside the demo.
 *
 * The demo has no account, so `useAuth()` has no profile to offer — which left
 * Settings › Account showing an empty name box and a Save button that saved
 * nothing. A control that reports success and changes nothing is the thing the
 * demo rule exists to stop, so the demo gets an identity of its own instead.
 *
 * A tiny store rather than React state, because two components far apart need
 * the same answer: the account menu at the foot of the note drawer, and the
 * Settings dialog. It resets on reload like everything else here.
 */
export interface DemoIdentity {
  name: string;
  avatarUrl: string | null;
}

let identity: DemoIdentity = { name: "You", avatarUrl: null };
const listeners = new Set<() => void>();

export function setDemoIdentity(next: Partial<DemoIdentity>): void {
  identity = { ...identity, ...next };
  for (const l of listeners) l();
}

export function useDemoIdentity(): DemoIdentity {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => identity,
    () => identity,
  );
}
