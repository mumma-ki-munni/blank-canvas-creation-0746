import { useEffect, useRef, useCallback } from "react";
import type { ChatMessage } from "./use-chat";

interface ChatNotificationSoundProps {
  latestMessage: ChatMessage | undefined;
  currentUserId: string;
  isChatOpen: boolean;
}

// plays sound when new root message from another user
// while chat is closed or tab is hidden
export function ChatNotificationSound({
  latestMessage,
  currentUserId,
  isChatOpen,
}: ChatNotificationSoundProps) {
  const prevMessageIdRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  // Pre-create audio element
  const chatSoundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    chatSoundRef.current = new Audio("/sounds/chat.mp3");
    chatSoundRef.current.volume = 0.04; // volume: 0.04
  }, []);

  const playChat = useCallback(() => {
    const audio = chatSoundRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {}); // ignore autoplay policy errors
  }, []);

  useEffect(() => {
    // Skip first run — don't play sound on page load for existing messages
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevMessageIdRef.current = latestMessage?.id ?? null;
      return;
    }

    if (
      latestMessage &&
      latestMessage.user_id !== currentUserId &&
      latestMessage.id !== prevMessageIdRef.current &&
      latestMessage.response_to_id === null &&
      (!isChatOpen || document.visibilityState === "hidden")
    ) {
      playChat();
    }
    prevMessageIdRef.current = latestMessage?.id ?? null;
  }, [latestMessage, currentUserId, isChatOpen, playChat]);

  return null; // renderless
}
