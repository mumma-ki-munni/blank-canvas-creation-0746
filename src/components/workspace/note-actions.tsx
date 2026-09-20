import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icon } from "@/components/base/icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { useDataProvider } from "@/lib/data-provider";
import { renameNote } from "./rename-note";

export interface NoteActionsTarget {
  id: string;
  title: string;
  is_pinned?: boolean;
}

/**
 * A note's actions — defined once, shown through two doors.
 *
 * The list row, the gallery tile, the editor's header and right-click all read
 * this same list, so they cannot drift apart, and no view can quietly drop the
 * whole set the way the gallery used to.
 *
 * Actions are grouped by what the verb does to the note, and the order of the
 * groups never changes:
 *
 *   look at it · get a copy out · let others in · change it · take it away
 */

type Band = "view" | "copy" | "share" | "edit" | "delete";

const BAND_ORDER: Band[] = ["view", "copy", "share", "edit", "delete"];

type Entry =
  | {
      kind: "item";
      id: string;
      label: string;
      icon: string;
      band: Band;
      destructive?: boolean;
      onSelect: () => void;
    }
  | {
      kind: "sub";
      id: string;
      label: string;
      icon: string;
      band: Band;
      /** `checked` draws a tick — for a submenu that toggles rather than picks. */
      children: {
        id: string;
        label: string;
        checked?: boolean;
        onSelect: () => void;
      }[];
    };

/**
 * Builds the list, and owns the rename dialog that two of its entries need.
 * Render `dialogs` once per note, next to whichever door you mounted.
 */
export function useNoteActions(note: NoteActionsTarget) {
  const dp = useDataProvider();
  const navigate = useNavigate();
  /**
   * Where a note lives — `/session/:id` in the app, `/demo/:id` in the demo.
   *
   * Without this, Open and Share… walked the visitor out of the demo and into
   * the Supabase-backed route, which has no such note: a blank white page with
   * no sidebar and no way back. Every control in the demo has to work, and one
   * that leaves the demo does not count as working. See
   * docs/design/demo-and-seed.md rule 1.
   */
  const { pathname } = useLocation();
  const isDemo = pathname.toLowerCase().startsWith("/demo");
  const noteBase = isDemo ? "/demo" : "/session";
  const queryClient = useQueryClient();
  const pinNote = dp.usePinNote();
  const softDelete = dp.useSoftDeleteNote();
  const assignFolder = dp.useAssignFolder();
  const renameViaProvider = dp.useRenameNote();
  const { data: folders = [] } = dp.useFolders();
  const { data: tags = [] } = dp.useTags();
  const { data: noteTags = [] } = dp.useNoteTagsForNote(note.id);
  const addTag = dp.useAddTagToNote();
  const removeTag = dp.useRemoveTagFromNote();

  // The editor's header knows the note's id and name but not whether it is
  // pinned, so look that up rather than always offering "Pin". The list is the
  // same cached query the drawer uses, so this costs nothing extra.
  const { data: allNotes = [] } = dp.useWorkspaceNotes({ lens: "all", search: "" });
  const isPinned =
    note.is_pinned ?? allNotes.find((n) => n.id === note.id)?.is_pinned ?? false;

  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(note.title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reopening the dialog should show the note's current name, not last edit.
  useEffect(() => {
    if (renaming) setDraft(note.title);
  }, [renaming, note.title]);

  const handleTogglePin = useCallback(() => {
    pinNote.mutate({ notepadId: note.id, isPinned: !isPinned });
  }, [pinNote, note.id, isPinned]);

  const handleDelete = useCallback(() => {
    softDelete.mutate({ notepadId: note.id });
  }, [softDelete, note.id]);

  const handleSubmitRename = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const next = draft.trim();
      if (!next || next === note.title) {
        setRenaming(false);
        return;
      }
      setSaving(true);
      try {
        // The demo has no Supabase to write to, and no stored Yjs updates to
        // replay, so the shared helper cannot work there. Its provider does the
        // same job against seeded state. The authed path is untouched.
        if (isDemo) renameViaProvider.mutate({ notepadId: note.id, title: next });
        else await renameNote(note.id, next);
        queryClient.invalidateQueries({ queryKey: ["notes"] });
        queryClient.invalidateQueries({ queryKey: ["notepad", note.id] });
        setRenaming(false);
      } catch {
        toast.error("Couldn't rename this note");
      } finally {
        setSaving(false);
      }
    },
    [draft, isDemo, note.id, note.title, queryClient, renameViaProvider],
  );

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [];

    // look at it
    list.push({
      kind: "item",
      id: "open",
      label: "Open",
      icon: "edit_note",
      band: "view",
      onSelect: () => navigate(`${noteBase}/${note.id}`),
    });

    // let others in — the sharing panel lives on the note, so this opens the
    // note with its share popover already open.
    list.push({
      kind: "item",
      id: "share",
      label: "Share…",
      icon: "group",
      band: "share",
      onSelect: () => navigate(`${noteBase}/${note.id}?share=1`),
    });

    // change it
    list.push({
      kind: "item",
      id: "pin",
      label: isPinned ? "Unpin" : "Pin",
      icon: isPinned ? "pin--filled" : "pin",
      band: "edit",
      onSelect: handleTogglePin,
    });
    list.push({
      kind: "item",
      id: "rename",
      label: "Rename",
      icon: "edit",
      band: "edit",
      onSelect: () => setRenaming(true),
    });
    list.push({
      kind: "sub",
      id: "move",
      label: "Move to folder",
      icon: "folder",
      band: "edit",
      children: [
        {
          id: "no-folder",
          label: "No folder",
          onSelect: () =>
            assignFolder.mutate({ notepadId: note.id, folderId: null }),
        },
        ...folders.map((f) => ({
          id: f.id,
          label: f.name,
          onSelect: () =>
            assignFolder.mutate({ notepadId: note.id, folderId: f.id }),
        })),
      ],
    });

    // Tags live here rather than in their own button on every row. The row
    // never showed a note's tags, so that button set something you could not
    // see — and it cost 28px of the title line on every single row. The menu
    // edits, the row displays: same as Move to folder, whose result shows up on
    // the row's third line.
    if (tags.length > 0) {
      list.push({
        kind: "sub",
        id: "tags",
        label: "Tags",
        icon: "sell",
        band: "edit",
        children: tags.map((t) => {
          const on = noteTags.some((nt) => nt.id === t.id);
          return {
            id: t.id,
            label: t.name,
            checked: on,
            onSelect: () =>
              on
                ? removeTag.mutate({ notepadId: note.id, tagId: t.id })
                : addTag.mutate({ notepadId: note.id, tagId: t.id }),
          };
        }),
      });
    }

    // take it away
    list.push({
      kind: "item",
      id: "delete",
      label: "Delete",
      icon: "delete",
      band: "delete",
      destructive: true,
      onSelect: handleDelete,
    });

    return list;
  }, [
    addTag,
    assignFolder,
    folders,
    handleDelete,
    handleTogglePin,
    isPinned,
    navigate,
    noteBase,
    note.id,
    noteTags,
    removeTag,
    tags,
  ]);

  const dialogs = (
    <Dialog open={renaming} onOpenChange={setRenaming}>
      <DialogContent
        className="sm:max-w-sm"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.select();
        }}
      >
        <DialogHeader>
          <DialogTitle>Rename note</DialogTitle>
          <DialogDescription>
            This also rewrites the note's first heading, because that heading is
            what names the note.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmitRename} className="space-y-4">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Note name"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setRenaming(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !draft.trim()}>
              {saving ? "Renaming…" : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return { entries, dialogs };
}

function toBands(entries: Entry[]): Entry[][] {
  return BAND_ORDER.map((band) =>
    entries.filter((entry) => entry.band === band),
  ).filter((group) => group.length > 0);
}

interface MenuParts {
  Item: React.ElementType;
  Separator: React.ElementType;
  Sub: React.ElementType;
  SubTrigger: React.ElementType;
  SubContent: React.ElementType;
  Portal: React.ElementType;
}

function renderEntries(entries: Entry[], parts: MenuParts) {
  const { Item, Separator, Sub, SubTrigger, SubContent, Portal } = parts;
  return toBands(entries).map((group, index) => (
    <Fragment key={group[0].id}>
      {index > 0 && <Separator />}
      {group.map((entry) =>
        entry.kind === "sub" ? (
          <Sub key={entry.id}>
            <SubTrigger>
              <Icon name={entry.icon} size={16} />
              {entry.label}
            </SubTrigger>
            <Portal>
              <SubContent>
                {entry.children.map((child) => (
                  <Item
                    key={child.id}
                    // A toggle keeps the menu open, so several tags can go on
                    // in one visit. A plain pick closes it, as menus do.
                    onSelect={(event) => {
                      if (child.checked !== undefined) event.preventDefault();
                      child.onSelect();
                    }}
                    className="gap-2"
                  >
                    {child.checked !== undefined && (
                      <Icon
                        name="check"
                        size={14}
                        className={cn("shrink-0", !child.checked && "invisible")}
                      />
                    )}
                    {child.label}
                  </Item>
                ))}
              </SubContent>
            </Portal>
          </Sub>
        ) : (
          <Item
            key={entry.id}
            onSelect={entry.onSelect}
            className={cn(
              "gap-2",
              entry.destructive && "text-destructive focus:text-destructive",
            )}
          >
            <Icon name={entry.icon} size={16} />
            {entry.label}
          </Item>
        ),
      )}
    </Fragment>
  ));
}

/** Door one: the ⋯ button. */
export function NoteActionsMenu({
  entries,
  align = "end",
  onOpenChange,
  children,
}: {
  entries: Entry[];
  align?: "start" | "end";
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {renderEntries(entries, {
          Item: DropdownMenuItem,
          Separator: DropdownMenuSeparator,
          Sub: DropdownMenuSub,
          SubTrigger: DropdownMenuSubTrigger,
          SubContent: DropdownMenuSubContent,
          Portal: DropdownMenuPortal,
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The ⋯ button for a single note, building its own list and owning its own
 * rename dialog. Use this where there is no row to hang the list on — the
 * editor's header.
 */
export function NoteActionsMenuFor({
  note,
  align = "end",
  children,
}: {
  note: NoteActionsTarget;
  align?: "start" | "end";
  children: React.ReactNode;
}) {
  const { entries, dialogs } = useNoteActions(note);
  return (
    <>
      <NoteActionsMenu entries={entries} align={align}>
        {children}
      </NoteActionsMenu>
      {dialogs}
    </>
  );
}

/** Door two: right-click the note. Same list, same order. */
export function NoteContextMenu({
  entries,
  onOpenChange,
  children,
}: {
  entries: Entry[];
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {renderEntries(entries, {
          Item: ContextMenuItem,
          Separator: ContextMenuSeparator,
          Sub: ContextMenuSub,
          SubTrigger: ContextMenuSubTrigger,
          SubContent: ContextMenuSubContent,
          Portal: ContextMenuPortal,
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}
