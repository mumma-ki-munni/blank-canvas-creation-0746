import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/base/icon";
import { CommentComposer, type CommentComposerHandle } from "./comment-composer";
import { CommentContent } from "./comment-content";
import { CommentHoverActions } from "./comment-hover-actions";
import { getCursorColor } from "@/components/collaboration/cursor-colors";
import type { CommentThread as ThreadType } from "./use-comments";
import type { Json } from "@/integrations/supabase/types";

// Two modes: "draft" (no thread yet) and "browsing" (existing thread)

type CommentThreadProps = {
  currentUserId: string;
  userName: string;
  onClose: () => void;
  onSubmit: (body: Json) => void;
  className?: string;
} & (
  | {
      mode: "draft";
      thread?: undefined;
      onResolve?: undefined;
      onUnresolve?: undefined;
      onAddReaction?: undefined;
      onRemoveReaction?: undefined;
    }
  | {
      mode: "browsing";
      thread: ThreadType;
      onResolve: () => void;
      onUnresolve: () => void;
      onAddReaction: (commentId: string, reaction: string) => void;
      onRemoveReaction: (reactionId: string) => void;
    }
);

export function CommentThread(props: CommentThreadProps) {
  const {
    mode,
    currentUserId,
    userName,
    onClose,
    onSubmit,
    className,
  } = props;

  const thread = mode === "browsing" ? props.thread : undefined;
  const comments = thread?.comments ?? [];
  const firstComment = comments[0];
  const replies = comments.slice(1);
  const hasMessages = comments.length > 0;
  const hasReplies = replies.length > 0;
  const isResolved = thread?.resolved_at !== null && thread?.resolved_at !== undefined;

  const [composing, setComposing] = useState(!hasMessages);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [hasText, setHasText] = useState(false);
  const [firstMsgHovered, setFirstMsgHovered] = useState(false);
  const composerRef = useRef<CommentComposerHandle>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Memoized handlers
  const handleFirstMsgEnter = useCallback(() => setFirstMsgHovered(true), []);
  const handleFirstMsgLeave = useCallback(() => setFirstMsgHovered(false), []);

  const handleHoverReaction = useCallback(
    (emoji: string) => {
      if (mode === "browsing" && firstComment) {
        props.onAddReaction(firstComment.id, emoji);
      }
    },
    [mode, firstComment, mode === "browsing" ? props.onAddReaction : undefined],
  );

  const handleHoverReply = useCallback(() => {
    setFirstMsgHovered(false);
    setComposing(true);
    requestAnimationFrame(() => composerRef.current?.focus());
  }, []);

  const handleToggleReplies = useCallback(
    () => setRepliesExpanded((prev) => !prev),
    [],
  );

  const handleComposerChange = useCallback(
    (text: string) => setHasText(text.length > 0),
    [],
  );

  const handleComposerSubmit = useCallback(
    (body: Json) => {
      onSubmit(body);
      if (mode !== "draft") {
        setComposing(false);
        setHasText(false);
      }
    },
    [onSubmit, mode],
  );

  const handleShowComposer = useCallback(() => {
    setComposing(true);
    requestAnimationFrame(() => composerRef.current?.focus());
  }, []);

  const handleSendClick = useCallback(() => {
    if (!composerRef.current) return;
    const body = composerRef.current.getJSON();
    onSubmit(body);
    if (mode !== "draft") {
      setComposing(false);
      setHasText(false);
    }
  }, [onSubmit, mode]);

  const authorColor = firstComment
    ? getCursorColor(firstComment.user_id)
    : getCursorColor(currentUserId);
  const authorName = firstComment?.user_name ?? userName;
  const authorInitial = authorName.charAt(0).toUpperCase();
  const time = firstComment
    ? new Date(firstComment.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;

  return (
    // panel — bg:white, border-radius:0 .75rem .75rem .75rem, drop-shadow
    <div
      ref={panelRef}
      className={cn(
        "rounded-tl-none rounded-tr-[12px] rounded-br-[12px] rounded-bl-[12px]",
        "bg-popover text-popover-foreground",
        "drop-shadow-[0_8px_16px_rgba(0,0,0,0.08)]",
        "hover:drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]",
        "transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        "hover:cursor-pointer",
        className,
      )}
    >
      {/* 350px grid, padding 1rem, gap 0.5rem */}
      <div className="relative grid w-[350px] grow gap-2 p-4">
        {/* header — row or column-reverse when resolved */}
        <header
          className={cn(
            "flex gap-2",
            isResolved
              ? "flex-col-reverse items-stretch"
              : "flex-row items-center justify-between",
          )}
        >
          {/* Avatar + name + time */}
          <div className="flex items-center gap-1">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white"
              style={{ backgroundColor: authorColor }}
            >
              {authorInitial}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{authorName}</span>
              {time && (
                <span className="whitespace-nowrap text-sm text-muted-foreground">
                  {time}
                </span>
              )}
            </div>
          </div>

          {/* resolve bar (no close button — popover handles dismiss) */}
          {mode === "browsing" && (
            <div
              className={cn(
                "flex items-center gap-1 rounded",
                isResolved && "bg-orange-pastel",
              )}
            >
              {isResolved ? (
                <>
                  <button
                    type="button"
                    onClick={props.onUnresolve}
                    className="cursor-pointer rounded px-1.5 py-0.5 text-sm font-medium hover:bg-accent"
                  >
                    Unresolve
                  </button>
                  {firstComment?.created_at && thread?.resolved_at && (
                    <span className="text-sm text-muted-foreground">
                      Resolved at{" "}
                      {new Date(thread.resolved_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={props.onResolve}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-1 text-sm font-medium hover:bg-accent"
                  title="Resolve"
                >
                  <Icon name="check_circle" size={16} />
                </button>
              )}
            </div>
          )}
        </header>

        {/* first message body — inline renderer wrapped in a hover container */}
        {hasMessages && firstComment && (
          <div
            className="relative mt-2"
            onMouseEnter={handleFirstMsgEnter}
            onMouseLeave={handleFirstMsgLeave}
          >
            {mode === "browsing" && !isResolved && (
              <CommentHoverActions
                visible={firstMsgHovered}
                onReaction={handleHoverReaction}
                onReply={handleHoverReply}
              />
            )}
            <CommentContent content={firstComment.body} />
          </div>
        )}

        {/* reactions on first message */}
        {mode === "browsing" && firstComment && firstComment.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(() => {
              const grouped = firstComment.reactions.reduce(
                (acc, r) => {
                  (acc[r.reaction] ??= []).push(r);
                  return acc;
                },
                {} as Record<string, typeof firstComment.reactions>,
              );
              return Object.entries(grouped).map(([emoji, items]) => {
                const mine = items.find((r) => r.user_id === currentUserId);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() =>
                      mine
                        ? props.onRemoveReaction(mine.id)
                        : props.onAddReaction(firstComment.id, emoji)
                    }
                    className={cn(
                      "flex cursor-pointer items-center rounded-[6px] border px-[5px] py-[2px]",
                      "transition-colors hover:border-foreground/10",
                      mine && "bg-accent border-border",
                    )}
                  >
                    <span className="text-sm">{emoji}</span>
                    {items.length > 1 && (
                      <span className="ml-1.5 text-[10px] text-muted-foreground">
                        {items.length}
                      </span>
                    )}
                  </button>
                );
              });
            })()}
          </div>
        )}

        {/* collapsible replies (Cue plain bubbles) */}
        {hasReplies && (
          <>
            {repliesExpanded &&
              replies.map((reply) => (
                <div key={reply.id} className="flex gap-2 pr-2 pl-7">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-medium text-white"
                        style={{ backgroundColor: getCursorColor(reply.user_id) }}
                      >
                        {reply.user_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold">{reply.user_name}</span>
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(reply.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {/* Cue — inline-flex, surface/strong, border-radius:1rem, padding:0.3125rem 0.75rem */}
                    <div className="inline-flex rounded-2xl bg-accent px-3 py-[5px] text-sm">
                      <CommentContent content={reply.body} />
                    </div>
                  </div>
                </div>
              ))}
            {/* g9/_9 — show/hide toggle */}
            <button
              type="button"
              onClick={handleToggleReplies}
              className="cursor-pointer text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              {repliesExpanded
                ? "Hide answers"
                : `Show ${replies.length} ${replies.length === 1 ? "answer" : "answers"}`}
            </button>
          </>
        )}

        {/* composer or "Reply" link */}
        {composing || mode === "draft" ? (
          <CommentComposer
            ref={composerRef}
            onChange={handleComposerChange}
            onSubmit={handleComposerSubmit}
            placeholder={
              mode === "draft"
                ? `Comment as ${userName}...`
                : `Reply as ${userName}...`
            }
            autoFocus={mode === "draft"}
          />
        ) : (
          <button
            type="button"
            onClick={handleShowComposer}
            className="cursor-pointer text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            Reply
          </button>
        )}

        {/* Wue — send button, absolute bottom-right, variant:transparent */}
        {(composing || mode === "draft") && (
          <button
            type="button"
            disabled={!hasText}
            onClick={handleSendClick}
            className={cn(
              "absolute bottom-7 right-7",
              "flex h-7 w-7 cursor-pointer items-center justify-center rounded",
              "hover:bg-accent",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
            aria-label="Send"
          >
            <Icon name="send" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
