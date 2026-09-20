import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { InviteInput } from "./invite-input";
import { MemberList } from "./member-list";
import { CopyLinkButton } from "./copy-link-button";
import type { NotepadMember, NotepadInvite } from "./use-members";

interface SharePopoverProps {
  notepadId: string;
  members: NotepadMember[];
  invites: NotepadInvite[];
  allowGuestAccess: boolean;
  /** False until the flag has been read — the switch stays disabled til then. */
  guestAccessLoaded: boolean;
  currentUserId: string;
  onInvite: (email: string, role: "editor" | "viewer") => void;
  onRemoveMember: (memberId: string) => void;
  onChangeRole: (memberId: string, role: "editor" | "viewer") => void;
  onSetGuestAccess: (next: boolean) => void;
  children: React.ReactNode;
  /** Controlled, so `?share=1` on the note's address can open it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SharePopover({
  notepadId,
  members,
  invites,
  allowGuestAccess,
  guestAccessLoaded,
  currentUserId,
  onInvite,
  onRemoveMember,
  onChangeRole,
  onSetGuestAccess,
  open,
  onOpenChange,
  children,
}: SharePopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-[360px] p-4"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <div className="space-y-4">
          <InviteInput onInvite={onInvite} />

          <MemberList
            members={members}
            invites={invites}
            currentUserId={currentUserId}
            onRemove={onRemoveMember}
            onChangeRole={onChangeRole}
          />

          {/* Link sharing sits directly above the copy button, because the two
              are one decision: the link is only useful once this is on. */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  Anyone with the link can edit
                </span>
                <span className="text-xs text-muted-foreground">
                  {!guestAccessLoaded
                    ? "Checking…"
                    : allowGuestAccess
                      ? "On — no sign-in needed"
                      : "Off — invited people only"}
                </span>
              </div>
              <Switch
                checked={allowGuestAccess}
                disabled={!guestAccessLoaded}
                onCheckedChange={onSetGuestAccess}
              />
            </div>

            <div className="mt-3">
              <CopyLinkButton
                notepadId={notepadId}
                allowGuestAccess={allowGuestAccess}
                guestAccessLoaded={guestAccessLoaded}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
