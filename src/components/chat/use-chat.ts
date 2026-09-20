import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useEffect, useCallback, useMemo, useState } from "react";

export interface ChatMessage {
  id: string;
  notepad_id: string;
  user_id: string;
  user_name: string;
  body: Json;
  response_to_id: string | null;
  edited_at: string | null;
  created_at: string;
  reactions: ChatReaction[];
}

export interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
}

// consecutive messages from same user grouped
export type MessageGroup =
  | {
      type: "user";
      id: string;
      userId: string;
      userName: string;
      createdAt: string;
      messages: ChatMessage[];
    }
  | {
      type: "reaction";
      id: string;
      emoji: string;
      userIds: string[];
    };

// Immutable grouping — no mutation of existing arrays
// Note for step 05.03: bundle Vu wraps message group rendering in React.memo
// with custom comparator on id + messageIds.length. Apply when building Vu.
export function groupMessages(messages: ChatMessage[]): MessageGroup[] {
  // Step 1: group consecutive same-user messages
  const userGroups: Extract<MessageGroup, { type: "user" }>[] = [];
  for (const msg of messages) {
    const last = userGroups[userGroups.length - 1];
    if (last && last.userId === msg.user_id) {
      userGroups[userGroups.length - 1] = {
        ...last,
        messages: [...last.messages, msg],
      };
    } else {
      userGroups.push({
        type: "user",
        id: msg.id,
        userId: msg.user_id,
        userName: msg.user_name,
        createdAt: msg.created_at,
        messages: [msg],
      });
    }
  }

  // Step 2: insert reaction groups after each user group
  const result: MessageGroup[] = [];
  for (const group of userGroups) {
    result.push(group);

    const byEmoji: Record<string, string[]> = {};
    for (const msg of group.messages) {
      for (const r of msg.reactions) {
        const list = byEmoji[r.reaction] ??= [];
        if (!list.includes(r.user_id)) list.push(r.user_id);
      }
    }

    for (const [emoji, userIds] of Object.entries(byEmoji)) {
      result.push({
        type: "reaction",
        id: `${group.id}-reaction-${emoji}`,
        emoji,
        userIds,
      });
    }
  }

  return result;
}

export function useChat(notepadId: string) {
  const qc = useQueryClient();
  const key = useMemo(() => ["chat", notepadId], [notepadId]);
  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: key }),
    [qc, key],
  );

  // Load root messages (response_to_id is null)
  // limitMessages: 100
  const { data: messages = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*, chat_reactions(*)")
        .eq("notepad_id", notepadId)
        .is("response_to_id", null)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((m) => ({
        ...m,
        reactions: (m as { chat_reactions?: ChatReaction[] }).chat_reactions ?? [],
      })) as ChatMessage[];
    },
  });

  // Reactive thread loading
  const useThread = (parentId: string | null) => {
    return useQuery({
      queryKey: ["chat-thread", notepadId, parentId],
      queryFn: async () => {
        if (!parentId) return [];
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*, chat_reactions(*)")
          .eq("response_to_id", parentId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return (data ?? []).map((m) => ({
          ...m,
          reactions: (m as { chat_reactions?: ChatReaction[] }).chat_reactions ?? [],
        })) as ChatMessage[];
      },
      enabled: parentId !== null,
    });
  };

  // Reactive reply counts
  const useReplyCounts = () => {
    return useQuery({
      queryKey: ["chat-reply-counts", notepadId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("response_to_id")
          .eq("notepad_id", notepadId)
          .not("response_to_id", "is", null);
        if (error) throw error;
        const counts: Record<string, number> = {};
        for (const row of data ?? []) {
          const id = row.response_to_id as string;
          counts[id] = (counts[id] ?? 0) + 1;
        }
        return counts;
      },
    });
  };

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${notepadId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "chat_messages",
        filter: `notepad_id=eq.${notepadId}`,
      }, () => {
        invalidate();
        qc.invalidateQueries({ queryKey: ["chat-reply-counts", notepadId] });
        qc.invalidateQueries({ queryKey: ["chat-thread", notepadId] });
      })
      .subscribe();

    const reactionsChannel = supabase
      .channel(`chat-reactions:${notepadId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "chat_reactions",
      }, invalidate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [notepadId, invalidate, qc]);

  // Send message (root or thread reply)
  const send = useMutation({
    mutationFn: async (args: {
      userName: string;
      userId: string;
      body: Json;
      responseToId?: string;
    }) => {
      const { error } = await supabase.from("chat_messages").insert({
        notepad_id: notepadId,
        user_name: args.userName,
        user_id: args.userId,
        body: args.body,
        response_to_id: args.responseToId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Reactions
  const addReaction = useMutation({
    mutationFn: async (args: {
      messageId: string;
      userId: string;
      reaction: string;
    }) => {
      const { error } = await supabase.from("chat_reactions").insert({
        message_id: args.messageId,
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
        .from("chat_reactions")
        .delete()
        .eq("id", reactionId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const groups = useMemo(() => groupMessages(messages), [messages]);

  // Unread count — tracked via localStorage
  const lastSeenKey = `chat-last-seen:${notepadId}`;
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(
    () => typeof window !== "undefined" ? localStorage.getItem(lastSeenKey) : null,
  );

  const markAsSeen = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(lastSeenKey, now);
    setLastSeenAt(now);
  }, [lastSeenKey]);

  const unreadCount = useMemo(() => {
    if (!lastSeenAt) return messages.length;
    const threshold = new Date(lastSeenAt).getTime();
    return messages.filter((m) => new Date(m.created_at).getTime() > threshold).length;
  }, [messages, lastSeenAt]);

  return {
    messages,
    groups,
    send,
    useThread,
    useReplyCounts,
    addReaction,
    removeReaction,
    unreadCount,
    markAsSeen,
  };
}
