import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useEffect } from "react";

export interface CommentThread {
  id: string;
  notepad_id: string;
  anchor_type: "block" | "range";
  anchor_data: Json;
  resolved_at: string | null;
  created_at: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  thread_id: string;
  user_name: string;
  user_id: string;
  body: Json;
  edited_at: string | null;
  created_at: string;
  reactions: Reaction[];
}

export interface Reaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction: string;
}

export function useComments(notepadId: string) {
  const qc = useQueryClient();
  const key = ["comments", notepadId];
  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const { data: threads = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comment_threads")
        .select("*, comments(*, comment_reactions(*))")
        .eq("notepad_id", notepadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((t) => ({
        ...t,
        comments: (t.comments ?? []).map((c: { comment_reactions?: Reaction[] } & Omit<Comment, "reactions">) => ({
          ...c,
          reactions: c.comment_reactions ?? [],
        })),
      })) as CommentThread[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`comments:${notepadId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "comment_threads",
        filter: `notepad_id=eq.${notepadId}`,
      }, invalidate)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "comments",
      }, invalidate)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "comment_reactions",
      }, invalidate)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [notepadId]);

  // submitComment handles both creating (threadId undefined) and replying
  const submitComment = useMutation({
    mutationFn: async (args: {
      threadId?: string;
      anchorType?: "block" | "range";
      anchorData?: Json;
      userName: string;
      userId: string;
      body: Json;
    }) => {
      let targetThreadId = args.threadId;

      if (targetThreadId === undefined) {
        // Creating new thread + first message (bundle: yn dispatch)
        if (!args.anchorType || !args.anchorData)
          throw new Error("Missing anchor for new thread");
        const { data: thread, error: tErr } = await supabase
          .from("comment_threads")
          .insert({
            notepad_id: notepadId,
            anchor_type: args.anchorType,
            anchor_data: args.anchorData,
          })
          .select("id")
          .single();
        if (tErr || !thread) throw tErr ?? new Error("Failed to create thread");
        targetThreadId = thread.id;
      }

      // Insert comment (first message or reply)
      const { error: cErr } = await supabase.from("comments").insert({
        thread_id: targetThreadId,
        user_name: args.userName,
        user_id: args.userId,
        body: args.body,
      });
      if (cErr) throw cErr;
      return targetThreadId;
    },
    onSuccess: invalidate,
  });

  const resolve = useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase
        .from("comment_threads")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", threadId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const unresolve = useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase
        .from("comment_threads")
        .update({ resolved_at: null })
        .eq("id", threadId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addReaction = useMutation({
    mutationFn: async (args: {
      commentId: string;
      userId: string;
      reaction: string;
    }) => {
      const { error } = await supabase.from("comment_reactions").insert({
        comment_id: args.commentId,
        user_id: args.userId,
        reaction: args.reaction,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeReaction = useMutation({
    mutationFn: async (reactionId: string) => {
      const { error } = await supabase
        .from("comment_reactions")
        .delete()
        .eq("id", reactionId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { threads, submitComment, resolve, unresolve, addReaction, removeReaction };
}
