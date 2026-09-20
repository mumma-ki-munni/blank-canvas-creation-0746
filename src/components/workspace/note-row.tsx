import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Icon } from "@/components/base/icon";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type WorkspaceNote } from "@/lib/data-provider";
import { formatShortDate } from "./format";
import {
  NoteActionsMenu,
  NoteContextMenu,
  useNoteActions,
} from "./note-actions";

/**
 * A single note in the workspace list. Clicking anywhere opens the editor; the
 * ⋯ menu holds every action, including tags.
 *
 * Treatment adapted from comment-message.tsx (— the editor's only
 * list-item-in-a-panel precedent): a bordered card, `rounded-xl` (0.75rem), 1px
 * `border/default`, hover → `border/strong` (NOT a bg fill), `text-sm` (14px).
 * Cards separated by gap, not `border-b` dividers.
 */
/**
 * Where opening a note goes.
 *
 * The demo runs the same list against seeded data, so its notes live under
 * `/demo/:id` rather than `/session/:id`. Keeping the note id in the path is
 * what makes the open note reloadable and linkable — see
 * docs/design/demo-and-seed.md rule 9.
 */
function useNoteHref(): (noteId: string) => string {
  const { pathname } = useLocation();
  const isDemo = pathname.toLowerCase().startsWith("/demo");
  return (noteId: string) => (isDemo ? `/demo/${noteId}` : `/session/${noteId}`);
}

export function NoteRow({
  note,
  showOwner = false,
}: {
  note: WorkspaceNote;
  showOwner?: boolean;
}) {
  const navigate = useNavigate();
  const noteHref = useNoteHref();
  const { id: activeId, noteId: demoNoteId } = useParams();
  const active = (activeId ?? demoNoteId) === note.id;
  // Keeps the hover actions on screen while their menu is open — see the
  // comment on the actions container below.
  const [menuOpen, setMenuOpen] = useState(false);
  const { entries, dialogs } = useNoteActions(note);

  return (
    <NoteContextMenu entries={entries} onOpenChange={setMenuOpen}>
    <div
      role="button"
      tabIndex={0}
      // While its menu is open the row looks different: the menu opens beside
      // the pointer and attaches to nothing, so in a list of similar rows you
      // can lose track of which one you hit — and then Delete is a guess.
      data-menu-open={menuOpen ? "true" : undefined}
      onClick={() => navigate(noteHref(note.id))}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(noteHref(note.id));
      }}
      className={cn(
        "group relative cursor-pointer rounded-lg px-2 py-2 text-left text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground hover:bg-primary"
          : "hover:bg-muted",
        menuOpen && !active && "bg-muted ring-2 ring-inset ring-ring",
      )}
    >
      {/* Line 1 — the name, with the actions sat beside it.
          Everything on this line is laid out, not floated: the title takes the
          space that is left and truncates, the actions never shrink. Nothing
          here can end up on top of anything else, which is the whole point —
          this row used to position the date absolutely and centre it on the
          row, so on a two-line note it landed on the snippet. */}
      <div className="flex min-h-7 items-center gap-1.5">
        {note.is_pinned && (
          <Icon
            name="pin--filled"
            size={14}
            className={cn("shrink-0", active ? "text-white" : "text-foreground")}
          />
        )}
        <h3
          className={cn(
            "min-w-0 flex-1 truncate font-heading text-sm font-medium",
            active ? "text-white" : "text-foreground",
          )}
        >
          {note.title || "Untitled"}
        </h3>
        {/* The ⋯ is always here, not revealed on hover: a touchscreen has no
            hover and no right-click, so a hover-only button is no button. That
            also avoids the old "menu moves when I move the mouse" bug — a
            trigger that gets display:none mid-flight leaves Radix a zero-size
            anchor, and the menu jumps to the corner of the pane. */}
        <div
          className={cn("flex shrink-0 items-center gap-1", active && "text-white")}
          onClick={(e) => e.stopPropagation()}
        >
          <NoteActionsMenu entries={entries} onOpenChange={setMenuOpen}>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Note actions"
            >
              <Icon name="overflow-menu--horizontal" size={16} />
            </Button>
          </NoteActionsMenu>
        </div>
      </div>

      {/* Line 2 — the date, then the snippet, as two things sat side by side.
          This is the shape Apple Notes uses, and the reason is the bug it fixes:
          the date used to be absolutely positioned and centred on the whole row,
          so on a two-line row it landed on top of the snippet. A date that never
          shrinks plus a snippet that takes the rest and truncates cannot collide,
          at any width, in any language. */}
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={cn(
            "shrink-0 text-sm tabular-nums",
            active ? "text-white/80" : "text-muted-foreground",
          )}
        >
          {formatShortDate(note.updated_at)}
        </span>
        {/* A note with nothing in it yet still says something, so the line does
            not end on a lonely date. Apple Notes writes "No additional text"
            here for the same reason: the row keeps its shape whether the note
            is full or empty, and a brand-new note does not look broken. */}
        <p
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            active
              ? "text-white/80"
              : note.snippet
                ? "text-muted-foreground"
                : "text-muted-foreground/70",
          )}
        >
          {note.snippet || "No additional text"}
        </p>
      </div>

      {/* Line 3 — where it lives, what it is tagged with, who shared it.
          The tags are DISPLAYED here and EDITED from the ⋯ menu, the same way
          the folder is. They used to be the other way round: a tag button on
          every row, and the tags themselves shown nowhere. */}
      {(note.folder_name || note.tags.length > 0 || (showOwner && note.owner_name)) && (
        <div
          className={cn(
            "mt-0.5 flex min-w-0 items-center gap-1 text-xs",
            active ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {note.folder_name && (
            <>
              <Icon name="folder" size={12} className="shrink-0" />
              <span className="shrink-0">{note.folder_name}</span>
            </>
          )}
          {note.tags.length > 0 && (
            <>
              <Icon name="sell" size={12} className="ml-1 shrink-0" />
              <span className="truncate">
                {note.tags.map((t) => t.name).join(", ")}
              </span>
            </>
          )}
          {showOwner && note.owner_name && (
            <span className="shrink-0">
              {note.folder_name || note.tags.length ? "· " : ""}
              Shared by {note.owner_name}
            </span>
          )}
        </div>
      )}


      {dialogs}
    </div>
    </NoteContextMenu>
  );
}

/**
 * The gallery tile — the same note, the same actions. This view used to render
 * plain tiles with no menu at all, so switching from list to gallery made every
 * action disappear.
 */
export function NoteTile({ note }: { note: WorkspaceNote }) {
  const navigate = useNavigate();
  const noteHref = useNoteHref();
  const [menuOpen, setMenuOpen] = useState(false);
  const { entries, dialogs } = useNoteActions(note);

  return (
    <NoteContextMenu entries={entries} onOpenChange={setMenuOpen}>
      <div
        role="button"
        tabIndex={0}
        data-menu-open={menuOpen ? "true" : undefined}
        onClick={() => navigate(noteHref(note.id))}
        onKeyDown={(e) => {
          if (e.key === "Enter") navigate(noteHref(note.id));
        }}
        className={cn(
          "relative flex aspect-square cursor-pointer flex-col items-start justify-end rounded-lg border border-border bg-background p-2 text-left transition-colors hover:bg-muted",
          menuOpen && "bg-muted ring-2 ring-inset ring-ring",
        )}
      >
        <div className="absolute right-1 top-1 z-10" onClick={(e) => e.stopPropagation()}>
          <NoteActionsMenu entries={entries} onOpenChange={setMenuOpen}>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={`Actions for ${note.title}`}
            >
              <Icon name="overflow-menu--horizontal" size={16} />
            </Button>
          </NoteActionsMenu>
        </div>

        <div className="mb-2 flex w-full flex-1 items-center justify-center rounded bg-muted text-muted-foreground">
          <Icon name="edit_note" size={22} />
        </div>
        <span className="line-clamp-2 text-xs font-medium">{note.title}</span>
        {dialogs}
      </div>
    </NoteContextMenu>
  );
}
