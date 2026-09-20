import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useMemo } from "react";

export interface NotepadMember {
  id: string;
  notepad_id: string;
  user_id: string;
  role: "owner" | "editor" | "viewer";
  created_at: string;
  profile?: {
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    avatar_color: string;
  };
}

export interface NotepadInvite {
  id: string;
  notepad_id: string;
  email: string;
  role: "editor" | "viewer";
  invited_by: string | null;
  accepted_at: string | null;
  created_at: string;
}

export function useMembers(notepadId: string) {
  const qc = useQueryClient();
  const key = useMemo(() => ["members", notepadId], [notepadId]);
  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: key }),
    [qc, key],
  );

  // Load members with profiles
  const { data: members = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notepad_members")
        .select("*, profiles(*)")
        .eq("notepad_id", notepadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((m: Record<string, unknown>) => ({
        ...m,
        profile: (m as { profiles?: unknown }).profiles ?? undefined,
      })) as NotepadMember[];
    },
  });

  // Load pending invites
  const { data: invites = [] } = useQuery({
    queryKey: ["invites", notepadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notepad_invites")
        .select("*")
        .eq("notepad_id", notepadId)
        .is("accepted_at", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as NotepadInvite[];
    },
  });

  // Load guest access flag. `enabled` keeps it off the wire for the transient
  // "new" id, which is not a uuid and would only ever error.
  const { data: notepad } = useQuery({
    queryKey: ["notepad-access", notepadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notepads")
        .select("allow_guest_access")
        .eq("id", notepadId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: notepadId !== "new",
  });

  // Have we actually read the flag yet? Every consumer needs this, because
  // "not loaded" and "loaded, sharing off" must not look the same: the old
  // code defaulted to `true` while loading, so a brand-new (private) note
  // showed the share switch already ON and offered a link that nobody could
  // open. Default to `false` — claim a note is private until we know it isn't.
  const guestAccessLoaded = notepad !== undefined;
  const allowGuestAccess = notepad?.allow_guest_access ?? false;

  // Add member directly (by user_id)
  const addMember = useMutation({
    mutationFn: async (args: { userId: string; role: "editor" | "viewer" }) => {
      const { error } = await supabase.from("notepad_members").insert({
        notepad_id: notepadId,
        user_id: args.userId,
        role: args.role,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Invite by email (via edge function: adds existing users directly, otherwise sends magic-link invite)
  const invite = useMutation({
    mutationFn: async (args: { email: string; role: "editor" | "viewer"; invitedBy: string }) => {
      const { error } = await supabase.functions.invoke("send-invite", {
        body: { email: args.email, role: args.role, notepadId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["invites", notepadId] });
    },
  });


  // Remove member
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("notepad_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Change role
  const changeRole = useMutation({
    mutationFn: async (args: { memberId: string; role: "editor" | "viewer" }) => {
      const { error } = await supabase
        .from("notepad_members")
        .update({ role: args.role })
        .eq("id", args.memberId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Set guest access. Takes the TARGET value explicitly rather than flipping
  // whatever is currently in state: deriving `!allowGuestAccess` meant that
  // before the flag had loaded the first click wrote `false` onto an already
  // private note — a silent no-op that looked like a broken switch.
  const setGuestAccess = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await supabase
        .from("notepads")
        .update({ allow_guest_access: next })
        .eq("id", notepadId);
      if (error) throw error;
      return next;
    },
    onMutate: async (next: boolean) => {
      const key = ["notepad-access", notepadId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      // Seed the row when the cache is still empty, or the optimistic update
      // is dropped and the switch snaps back to its old position.
      qc.setQueryData(key, (old: { allow_guest_access: boolean } | undefined) =>
        old ? { ...old, allow_guest_access: next } : { allow_guest_access: next },
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        qc.setQueryData(["notepad-access", notepadId], context.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notepad-access", notepadId] });
    },
  });

  // Accept invite (called when user opens a notepad they were invited to)
  const acceptInvite = useMutation({
    mutationFn: async (args: { inviteId: string; userId: string; role: "editor" | "viewer" }) => {
      // Add as member
      const { error: memberErr } = await supabase.from("notepad_members").insert({
        notepad_id: notepadId,
        user_id: args.userId,
        role: args.role,
      });
      if (memberErr) throw memberErr;

      // Mark invite as accepted
      const { error: inviteErr } = await supabase
        .from("notepad_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", args.inviteId);
      if (inviteErr) throw inviteErr;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["invites", notepadId] });
    },
  });

  return {
    members,
    invites,
    allowGuestAccess,
    guestAccessLoaded,
    addMember,
    invite,
    removeMember,
    changeRole,
    setGuestAccess,
    acceptInvite,
  };
}
