import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FormatMenu } from "@/components/editor/format-menu";
import { supabase } from "@/integrations/supabase/client";
import {
  SessionShell,
  HeaderBar,
  ContentArea,
  BottomControls,
} from "@/components/layout";
import { NotepadEditor, NotepadContent } from "@/components/editor";
import { CollaborationProvider } from "@/components/collaboration";
import { PresenceAvatars, usePresence } from "@/components/collaboration";
import { useComments, CommentThread, CommentHighlightLayer } from "@/components/comments";
import { ChatPanel, useChat, groupMessages } from "@/components/chat";
import { ChatBadge } from "@/components/chat/chat-badge";
import { ChatNotificationSound } from "@/components/chat/chat-notification-sound";
import { useChatTyping } from "@/components/chat/use-chat-typing";
import { Sidebar, useSidebar } from "@/components/layout";
import { Popover, PopoverContent } from "@/components/ui/popover";
// PopoverAnchor: base's ui/popover.tsx omits this stock-shadcn export, so pull
// it straight from the Radix primitive (identical — the shadcn one is a plain
// re-export). Keeps ui/popover.tsx byte-identical to the base starter.
import { PopoverAnchor } from "@radix-ui/react-popover";
import type { Editor } from "@tiptap/react";
import type { Awareness } from "y-protocols/awareness";
import type { Json } from "@/integrations/supabase/types";
import { useAuth, useCurrentUser } from "@/components/auth";
import { SharePopover, useMembers } from "@/components/share";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { NoteDrawer } from "@/components/workspace/note-drawer";
import { NoteActionsMenuFor } from "@/components/workspace/note-actions";
import { Icon } from "@/components/base/icon";
import { SupabaseDataProvider } from "@/lib/data-provider";
import { WorkspaceFilterProvider } from "@/lib/filter-context";
import { setAuthReturnTo } from "@/lib/auth-redirect";
import { AUTH_CTA } from "@/lib/auth-cta";
import { useIsMobile } from "@/hooks/use-mobile";

export default function SessionPage() {
  const { id = "new" } = useParams();
  // "Share…" on a note in the list brings you here with the panel already
  // open, so the action is reachable from the item and not only from inside
  // the editor.
  const [searchParams, setSearchParams] = useSearchParams();
  const shareOpen = searchParams.get("share") === "1";
  const setShareOpen = useCallback(
    (open: boolean) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (open) next.set("share", "1");
        else next.delete("share");
        return next;
      });
    },
    [setSearchParams],
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Empty means "no title yet". "Untitled" is added at render time, never stored.
  const [title, setTitle] = useState("");
  const { user } = useAuth();
  const handleGuestSignIn = useCallback(() => {
    const from = window.location.pathname;
    setAuthReturnTo(from);
    navigate("/login", { state: { from } });
  }, [navigate]);
  const currentUser = useCurrentUser();

  const create = useMutation({
    mutationFn: async () => {
      // Generate id client-side so we don't rely on RETURNING (RLS SELECT check
      // fails on a just-inserted row before membership is granted).
      const newId = crypto.randomUUID();
      // `title: ""` explicitly, matching the workspace's useCreateNote. Leaving
      // it out took the column default, which is the literal 'Untitled' — so a
      // note made here looked deliberately named while one made in the
      // workspace was blank. Empty is the one true "no title yet".
      const { error } = await supabase
        .from("notepads")
        .insert({ id: newId, title: "" });
      if (error) throw error;
      return { id: newId };
    },
    onSuccess: (data) => {
      // Ownership is granted by the `trg_add_notepad_owner` trigger, which runs
      // AFTER INSERT in the same transaction — so by the time the insert above
      // returns, the owner row already exists. The workspace's own create path
      // says the same (`data-provider.tsx`, useCreateNote). Writing it again
      // from here was a no-op round-trip that delayed the redirect.
      navigate(`/session/${data.id}`, { replace: true });
    },
  });

  useEffect(() => {
    if (id !== "new") return;
    if (!user) {
      // Notepad creation now requires auth (RLS). Send guests to login.
      navigate("/login", { replace: true, state: { from: "/session/new" } });
      return;
    }
    if (!create.isPending && !create.isSuccess) {
      create.mutate();
    }
  }, [id, user]);

  const { data: notepad, isLoading: notepadLoading } = useQuery({
    queryKey: ["notepad", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notepads")
        .select("id, title")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: id !== "new",
  });

  useEffect(() => {
    // `!= null`, not truthiness — an empty stored title is a real value and must
    // clear the header, otherwise it keeps whatever was there before.
    if (notepad?.title != null) setTitle(notepad.title);
  }, [notepad?.title]);

  // Auto-accept pending invite on load
  const inviteCheckedRef = useRef(false);
  useEffect(() => {
    if (!user || !notepad || inviteCheckedRef.current) return;
    inviteCheckedRef.current = true;

    async function checkInvite() {
      const { data: existing } = await supabase
        .from("notepad_members")
        .select("id")
        .eq("notepad_id", notepad!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (existing) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user!.id)
        .maybeSingle();
      if (!profile) return;

      const { data: invite } = await supabase
        .from("notepad_invites")
        .select("*")
        .eq("notepad_id", notepad!.id)
        .eq("email", profile.email)
        .is("accepted_at", null)
        .maybeSingle();

      if (invite) {
        await supabase.from("notepad_members").insert({
          notepad_id: notepad!.id,
          user_id: user!.id,
          role: invite.role,
        });
        await supabase
          .from("notepad_invites")
          .update({ accepted_at: new Date().toISOString() })
          .eq("id", invite.id);
        return;
      }

      // No invite: if the note is openly shared, a signed-in visitor joins as
      // a viewer so the note stays in their workspace. They can still edit the
      // shared document through guest access, but cannot manage members.
      const { data: np } = await supabase
        .from("notepads")
        .select("allow_guest_access")
        .eq("id", notepad!.id)
        .maybeSingle();
      if (np?.allow_guest_access) {
        const { error: joinError } = await supabase
          .from("notepad_members")
          .insert({ notepad_id: notepad!.id, user_id: user!.id, role: "viewer" });
        // 23505 = already a member, which is the expected no-op.
        if (joinError && joinError.code !== "23505") {
          console.warn("self-join failed", joinError);
        }
      }
    }

    checkInvite();
  }, [user, notepad]);


  // Single writer for the title. The editor derives it from the document's
  // first heading on every keystroke, so persist it debounced and only when it
  // actually changed.
  const persistedTitleRef = useRef<string | null>(null);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (notepad?.title != null) persistedTitleRef.current = notepad.title;
  }, [notepad?.title]);

  useEffect(() => () => {
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
  }, []);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      if (newTitle === persistedTitleRef.current) return;
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      titleTimerRef.current = setTimeout(async () => {
        // Direct column update, allowed only for members with edit rights.
        // Signed-out link guests have no write grant here, so the request is
        // rejected by RLS and the local title simply stays unpersisted.

        const { error } = await supabase
          .from("notepads")
          .update({ title: newTitle })
          .eq("id", id);
        if (error) return;
        persistedTitleRef.current = newTitle;
        queryClient.setQueryData(["notepad", id], (prev: { id: string; title: string } | undefined) =>
          prev ? { ...prev, title: newTitle } : prev,
        );
        queryClient.invalidateQueries({ queryKey: ["notes"] });
      }, 600);
    },
    [id, queryClient],
  );


  const presenceUsers = usePresence(
    notepad?.id ?? id,
    currentUser,
  );

  // Chat
  const chat = useChat(notepad?.id ?? id);
  const [awarenessInstance, setAwarenessInstance] = useState<Awareness | null>(null);
  const chatTyping = useChatTyping(awarenessInstance);
  const sidebar = useSidebar();
  const isMobile = useIsMobile();
  // Left note drawer (notes-app list). Its open/closed state is PERSISTED to
  // localStorage so it survives navigating between notes (each /session/:id
  // remount) and reloads — clicking a note keeps the sidebar as-is instead of
  // collapsing. Defaults open on desktop so you land on list + doc; on a phone
  // it is an overlay and starts closed, so the document owns the screen.
  const [notesOpen, setNotesOpen] = useState(() => {
    try {
      return localStorage.getItem("notes-sidebar") !== "closed";
    } catch {
      return true;
    }
  });

  // Entering mobile closes the overlay; the persisted preference is untouched
  // and applies again from the md breakpoint up.
  useEffect(() => {
    if (isMobile) setNotesOpen(false);
  }, [isMobile]);

  const handleToggleChat = useCallback(() => {
    const wasHidden = sidebar.state === "hidden";
    sidebar.toggle("wide");
    if (wasHidden) chat.markAsSeen();
  }, [sidebar, chat]);

  const handleToggleNotes = useCallback(() => {
    setNotesOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem("notes-sidebar", next ? "open" : "closed");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const handleCloseNotes = useCallback(() => setNotesOpen(false), []);

  // Opening a note from the mobile overlay navigates to another /session/:id —
  // dismiss the overlay so the document is what you land on.
  useEffect(() => {
    if (isMobile) setNotesOpen(false);
  }, [id, isMobile]);


  // Escape closes the mobile overlay.
  useEffect(() => {
    if (!isMobile || !notesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotesOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, notesOpen]);


  const handleChatSend = useCallback(
    (body: Json) => {
      chat.send.mutate({
        userName: currentUser.name,
        userId: currentUser.id,
        body,
      });
      chat.markAsSeen();
    },
    [chat.send, chat.markAsSeen, currentUser],
  );

  const handleChatClose = useCallback(() => {
    sidebar.hide();
  }, [sidebar]);

  // Mark as seen whenever new messages arrive while chat is open
  useEffect(() => {
    if (sidebar.state !== "hidden" && chat.messages.length > 0) {
      chat.markAsSeen();
    }
  }, [sidebar.state, chat.messages.length, chat.markAsSeen]);

  const handleChatTypingChange = useCallback(
    (text: string) => {
      chatTyping.broadcastTyping(text);
    },
    [chatTyping],
  );

  // Chat reactions
  const handleChatReaction = useCallback(
    (messageId: string, emoji: string) => {
      chat.addReaction.mutate({ messageId, userId: currentUser.id, reaction: emoji });
    },
    [chat.addReaction, currentUser.id],
  );

  const handleChatRemoveReaction = useCallback(
    (reactionId: string) => chat.removeReaction.mutate(reactionId),
    [chat.removeReaction],
  );

  // Chat threads
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);
  const chatThreadQuery = chat.useThread(chatThreadId);
  const chatThreadGroups = useMemo(
    () => groupMessages(chatThreadQuery.data ?? []),
    [chatThreadQuery.data],
  );
  // Thread typing uses same awareness — all typing shows as root for now
  const chatThreadTypingUsers: string[] = [];
  const chatReplyCountsQuery = chat.useReplyCounts();

  const handleChatThreadOpen = useCallback((messageId: string) => {
    setChatThreadId(messageId);
  }, []);

  const handleChatThreadClose = useCallback(() => {
    setChatThreadId(null);
  }, []);

  const handleChatThreadSend = useCallback(
    (body: Json) => {
      if (!chatThreadId) return;
      chat.send.mutate({
        userName: currentUser.name,
        userId: currentUser.id,
        body,
        responseToId: chatThreadId,
      });
    },
    [chatThreadId, chat.send, currentUser],
  );

  const handleChatThreadTypingChange = useCallback(
    (text: string) => {
      if (!chatThreadId) return;
      chatTyping.broadcastTyping(text);
    },
    [chatTyping],
  );

  const rootTypingUsers = chatTyping.typingUsers;

  // Share
  const membersHook = useMembers(notepad?.id ?? id);

  const handleInvite = useCallback(
    (email: string, role: "editor" | "viewer") => {
      membersHook.invite.mutate({
        email,
        role,
        invitedBy: currentUser.isGuest ? "" : currentUser.id,
      });
    },
    [membersHook.invite, currentUser],
  );

  const handleRemoveMember = useCallback(
    (memberId: string) => membersHook.removeMember.mutate(memberId),
    [membersHook.removeMember],
  );

  const handleChangeRole = useCallback(
    (memberId: string, role: "editor" | "viewer") => {
      membersHook.changeRole.mutate({ memberId, role });
    },
    [membersHook.changeRole],
  );

  const handleSetGuestAccess = useCallback(
    (next: boolean) => membersHook.setGuestAccess.mutate(next),
    [membersHook.setGuestAccess],
  );

  // Comments
  const {
    threads,
    submitComment,
    resolve,
    unresolve,
    addReaction,
    removeReaction,
  } = useComments(notepad?.id ?? id);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  const handleEditorReady = useCallback((editor: Editor) => {
    setEditorInstance(editor);
  }, []);

  const handleAwarenessReady = useCallback((awareness: Awareness) => {
    setAwarenessInstance(awareness);
  }, []);

  const handleHighlightClick = useCallback((threadId: string) => {
    setPendingAnchor(null);
    setActiveThreadId(threadId);
  }, []);

  // Draft state — local only, no DB write (bundle: initiateCommenting)
  const [pendingAnchor, setPendingAnchor] = useState<{
    anchorType: "range";
    anchorData: { from: number; to: number };
  } | null>(null);

  // Toolbar click → set draft, NOT create thread
  const handleAddComment = useCallback(
    (e: Event) => {
      const { from, to } = (e as CustomEvent).detail;
      setActiveThreadId(null);
      setPendingAnchor({ anchorType: "range", anchorData: { from, to } });
    },
    [],
  );

  // Submit first comment → create thread + message, transition to browsing
  const handleDraftSubmit = useCallback(
    (body: Json) => {
      if (!pendingAnchor) return;
      submitComment.mutate(
        {
          ...pendingAnchor,
          userName: currentUser.name,
          userId: currentUser.id,
          body,
        },
        {
          onSuccess: (threadId) => {
            setPendingAnchor(null);
            setActiveThreadId(threadId);
          },
        },
      );
    },
    [pendingAnchor, submitComment, currentUser],
  );

  const handleDraftClose = useCallback(() => setPendingAnchor(null), []);
  const handleThreadClose = useCallback(() => setActiveThreadId(null), []);

  const handleBrowsingSubmit = useCallback(
    (body: Json) => {
      if (!activeThread) return;
      submitComment.mutate({
        threadId: activeThread.id,
        userName: currentUser.name,
        userId: currentUser.id,
        body,
      });
    },
    [activeThread, submitComment, currentUser],
  );

  const handleResolve = useCallback(
    () => { if (activeThread) resolve.mutate(activeThread.id); },
    [activeThread, resolve],
  );

  const handleUnresolve = useCallback(
    () => { if (activeThread) unresolve.mutate(activeThread.id); },
    [activeThread, unresolve],
  );

  const handleAddReaction = useCallback(
    (commentId: string, emoji: string) => {
      addReaction.mutate({ commentId, userId: currentUser.id, reaction: emoji });
    },
    [addReaction, currentUser.id],
  );

  const handleRemoveReaction = useCallback(
    (reactionId: string) => removeReaction.mutate(reactionId),
    [removeReaction],
  );

  useEffect(() => {
    window.addEventListener("notepad:add-comment", handleAddComment);
    return () => window.removeEventListener("notepad:add-comment", handleAddComment);
  }, [handleAddComment]);

  if (id === "new" || notepadLoading) {
    return (
      <SessionShell>
        <HeaderBar />
        <ContentArea />
        <BottomControls />
      </SessionShell>
    );
  }

  // Access denied: notepad not found (RLS denied) for authenticated user
  if (!notepad && !notepadLoading && id !== "new" && user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <span className="text-5xl text-muted-foreground">🔒</span>
        <h1 className="text-xl font-bold">Access denied</h1>
        <p className="text-sm text-muted-foreground">
          You don't have access to this notepad. Ask the owner to invite you.
        </p>
        <a
          href="/"
          className="text-sm font-medium underline"
        >
          Go home
        </a>
      </div>
    );
  }

  if (!notepad) {
    return (
      <SessionShell>
        <HeaderBar />
        <ContentArea />
        <BottomControls />
      </SessionShell>
    );
  }

  return (
    <div className="fixed inset-0 flex bg-muted">
      {/* Note list. Desktop: a column left of the header + editor.
          Mobile: a fixed overlay panel above the editor with a backdrop, so
          the document always gets the full screen width. */}
      {user && notesOpen && (
        <>
          {isMobile && (
            <button
              type="button"
              aria-label="Close notes"
              onClick={handleCloseNotes}
              className="fixed inset-0 z-40 bg-foreground/40"
            />
          )}
          <div
            className={
              isMobile
                ? "fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px] shadow-xl"
                : "h-full shrink-0"
            }

          >
            <SupabaseDataProvider>
              <WorkspaceFilterProvider>
                <NoteDrawer />
              </WorkspaceFilterProvider>
            </SupabaseDataProvider>
          </div>
        </>
      )}


      {/* Editor pane — the the editor shell (header + card + bottom) fills the space
          right of the list. `absolute` scopes SessionShell to this pane instead
          of the whole viewport. */}
      <div className="relative min-w-0 flex-1">
        <SessionShell className="absolute">
          <HeaderBar
            title={title || "Untitled"}
            leadingIcon="menu"
        onClickBack={handleToggleNotes}
        backButtonTooltip="Notes"
        hideBackButton={!user}
        rightContent={
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            {editorInstance && <FormatMenu editor={editorInstance} />}
            <PresenceAvatars users={presenceUsers} max={isMobile ? 2 : undefined} />
            <SharePopover
              open={shareOpen}
              onOpenChange={setShareOpen}
              notepadId={notepad.id}
              members={membersHook.members}
              invites={membersHook.invites}
              allowGuestAccess={membersHook.allowGuestAccess}
              guestAccessLoaded={membersHook.guestAccessLoaded}
              currentUserId={currentUser.id}
              onInvite={handleInvite}
              onRemoveMember={handleRemoveMember}
              onChangeRole={handleChangeRole}
              onSetGuestAccess={handleSetGuestAccess}
            >
              <button
                type="button"
                aria-label="Share"
                className="flex h-8 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-medium hover:bg-accent sm:px-3"
              >
                {isMobile ? <Icon name="share" size={16} /> : "Share"}
              </button>
            </SharePopover>
            <div className="relative">
              <button
                type="button"
                onClick={handleToggleChat}
                aria-label="Comments"
                className="flex h-8 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-medium hover:bg-accent sm:px-3"
              >
                {isMobile ? <Icon name="chat" size={16} /> : "Comments"}
              </button>
              <div className="absolute -right-1 -top-1">
                <ChatBadge count={sidebar.state === "hidden" ? chat.unreadCount : 0} />
              </div>
            </div>

            {user ? (
              /* Note actions only — no auth. Signing out belongs to the account
                 menu at the foot of the note list, and nowhere else, so there is
                 exactly one place to look for it. The list is always one click
                 away via the header's menu button. */
              <SupabaseDataProvider>
                <NoteActionsMenuFor note={{ id: notepad.id, title: notepad.title }}>
                  <button
                    type="button"
                    aria-label="Note options"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-accent"
                  >
                    <Icon name="overflow-menu--horizontal" size={16} />
                  </button>
                </NoteActionsMenuFor>
              </SupabaseDataProvider>
            ) : (
              /* The one exception: a guest reading a shared note needs a visible
                 way in, or the note can never become theirs. */
              <button
                type="button"
                onClick={handleGuestSignIn}
                title="Sign in to save this note to your workspace"
                className="flex h-8 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-primary px-3 text-sm font-medium leading-none text-primary-foreground hover:opacity-90"
              >
                {AUTH_CTA.save}
              </button>
            )}
          </div>
        }
      />

      {/* Comments. Desktop: a 350px sidebar next to the doc. Mobile: a
          full-screen sheet above it — 350px of a 390px screen would leave no
          document at all. */}
      {isMobile && sidebar.state !== "hidden" && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex flex-col bg-background p-2">
          <ChatPanel
            title="Comments"
            groups={chat.groups}
            onSend={handleChatSend}
            onClose={handleChatClose}
            visible
            typingUsers={rootTypingUsers}
            onTypingChange={handleChatTypingChange}
            currentUserId={currentUser.id}
            replyCounts={chatReplyCountsQuery.data}
            onReaction={handleChatReaction}
            onRemoveReaction={handleChatRemoveReaction}
            onThreadOpen={handleChatThreadOpen}
            threadId={chatThreadId}
            threadGroups={chatThreadGroups}
            threadTypingUsers={chatThreadTypingUsers}
            onThreadSend={handleChatThreadSend}
            onThreadClose={handleChatThreadClose}
            onThreadTypingChange={handleChatThreadTypingChange}
          />
        </div>
      )}

      <ContentArea
        sidebar={
          isMobile ? undefined : (
          <Sidebar state={sidebar.state}>
            <ChatPanel
              title="Comments"
              groups={chat.groups}
              onSend={handleChatSend}
              onClose={handleChatClose}
              visible={sidebar.state !== "hidden"}
              typingUsers={rootTypingUsers}
              onTypingChange={handleChatTypingChange}
              currentUserId={currentUser.id}
              replyCounts={chatReplyCountsQuery.data}
              onReaction={handleChatReaction}
              onRemoveReaction={handleChatRemoveReaction}
              onThreadOpen={handleChatThreadOpen}
              threadId={chatThreadId}
              threadGroups={chatThreadGroups}
              threadTypingUsers={chatThreadTypingUsers}
              onThreadSend={handleChatThreadSend}
              onThreadClose={handleChatThreadClose}
              onThreadTypingChange={handleChatThreadTypingChange}
            />
          </Sidebar>
          )
        }
      >

        <CollaborationProvider
          notepadId={notepad.id}
          userName={currentUser.name}
          userId={currentUser.id}
        >
          <NotepadContent>
            <NotepadEditor
              notepadId={notepad.id}
              onTitleChange={handleTitleChange}
              onEditorReady={handleEditorReady}
              onAwarenessReady={handleAwarenessReady}
            />
          </NotepadContent>
        </CollaborationProvider>

        {/* que/Jue — highlight overlay on commented text */}
        {editorInstance && (
          <CommentHighlightLayer
            editor={editorInstance}
            threads={threads}
            activeThreadId={activeThreadId}
            pendingAnchor={pendingAnchor?.anchorData}
            onThreadClick={handleHighlightClick}
          />
        )}

        {/* Du — popover, modal:false, click-outside/Escape closes */}
        <Popover
          open={!!pendingAnchor || !!activeThread}
          onOpenChange={(open) => {
            if (!open) {
              if (pendingAnchor) handleDraftClose();
              else handleThreadClose();
            }
          }}
        >
          <PopoverAnchor className="absolute right-4 top-20" />
          <PopoverContent
            className="w-auto max-w-[calc(100vw-1.5rem)] border-0 bg-transparent p-0 shadow-none"

            side="bottom"
            align="end"
            sideOffset={0}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {pendingAnchor ? (
              <CommentThread
                mode="draft"
                currentUserId={currentUser.id}
                userName={currentUser.name}
                onSubmit={handleDraftSubmit}
                onClose={handleDraftClose}
              />
            ) : activeThread ? (
              <CommentThread
                mode="browsing"
                thread={activeThread}
                currentUserId={currentUser.id}
                userName={currentUser.name}
                onSubmit={handleBrowsingSubmit}
                onResolve={handleResolve}
                onUnresolve={handleUnresolve}
                onAddReaction={handleAddReaction}
                onRemoveReaction={handleRemoveReaction}
                onClose={handleThreadClose}
              />
            ) : null}
          </PopoverContent>
        </Popover>
      </ContentArea>

      <BottomControls />

      {/* notification sound for new messages */}
      <ChatNotificationSound
        latestMessage={chat.messages[chat.messages.length - 1]}
        currentUserId={currentUser.id}
        isChatOpen={sidebar.state !== "hidden"}
      />

        </SessionShell>
      </div>
    </div>
  );
}
