import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@/components/base/icon";
import { Button } from "@/components/base/button";
import { Input } from "@/components/base/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDataProvider } from "@/lib/data-provider";
import { useWorkspaceFilters } from "@/lib/filter-context";
import { AccountMenu } from "@/components/account/account-menu";
import { SettingsDialog } from "@/components/account/settings-dialog";
import { NoteRow, NoteTile } from "./note-row";
import { groupByRecency } from "./recency";

/**
 * NoteDrawer — the note list sidebar (notes-app list shape).
 *
 * Search + New, then a collapsible **Pinned** group and **recency buckets**
 * (Today / Yesterday / Previous 7 Days / Previous 30 Days / month / year).
 * Rows are the the editor-adapted `NoteRow` cards (Carbon icons). Pinning +
 * search are built in; the recency bucketing is our addition (`recency.ts`).
 * No lens nav, no folders/tags as primary nav — recency + pinned only.
 */
const WIDE = 240;

export function NoteDrawer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { filters, setSearch, setSort, setGroupByDate, setViewMode } = useWorkspaceFilters();
  const dp = useDataProvider();
  const notesR = dp.useWorkspaceNotes({ lens: "all", search: filters.search });
  const createNote = dp.useCreateNote();

  const [pinnedOpen, setPinnedOpen] = useState(true);

  // "Date created" used to sort by updated_at, because created_at was not on
  // WorkspaceNote — so the menu offered a sort it did not perform. It is on the
  // note now, and this reads it. A control that claims one thing and does
  // another is worse than one that is missing.
  const all = [...(notesR.data ?? [])].sort((a, b) => {
    const dir = filters.sortDir === "asc" ? 1 : -1;
    if (filters.sortBy === "title") return a.title.localeCompare(b.title) * dir;
    const key = filters.sortBy === "created_at" ? "created_at" : "updated_at";
    return (new Date(a[key]).getTime() - new Date(b[key]).getTime()) * dir;
  });
  const pinned = all.filter((n) => n.is_pinned);
  const rest = all.filter((n) => !n.is_pinned);
  const groups = filters.groupByDate ? groupByRecency(rest) : [{ key: "all", label: "", notes: rest }];

  // The demo runs this same list against seeded data, so its notes live under
  // `/demo/:noteId` rather than `/session/:id`.
  const isDemo = location.pathname.toLowerCase().startsWith("/demo");

  const handleNewNote = useCallback(async () => {
    const res = await createNote.mutate({ activeFolderId: null });
    if (res?.id) navigate(isDemo ? `/demo/${res.id}` : `/session/${res.id}`);
  }, [createNote, navigate, isDemo]);

  return (
    <div
      className="pointer-events-auto flex h-full flex-col overflow-hidden bg-muted"
      style={{ width: WIDE }}
    >
      {/* Title band — 48px, matches the editor header height for cross-pane rhythm */}
      <div className="flex h-12 shrink-0 items-center px-3">
        <span className="text-sm font-semibold">Notepad</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-0.5 px-1 pb-2">
        <Button
          variant="ghost"
          size="control"
          onClick={handleNewNote}
          className="w-full justify-start gap-2 px-2 font-medium"
        >
          <Icon name="add" size={16} />
          New note
        </Button>
        <Input
          leadingIcon="search"
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="border-transparent bg-transparent hover:bg-muted"
        />
        <div className="flex items-center justify-between px-1 pt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="control"
                aria-label="Sort and group"
                className="gap-1 px-2 text-xs text-muted-foreground"
              >
                <Icon name="filter" size={14} />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              {(
                [
                  ["updated_at", "Date edited"],
                  ["created_at", "Date created"],
                  ["title", "Title"],
                ] as const
              ).map(([key, label]) => (
                <DropdownMenuItem key={key} onClick={() => setSort(key, filters.sortDir)}>
                  {filters.sortBy === key ? "✓ " : "   "}
                  {label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setSort(filters.sortBy, filters.sortDir === "asc" ? "desc" : "asc")
                }
              >
                <Icon
                  name={filters.sortDir === "asc" ? "arrow_upward" : "arrow_downward"}
                  size={14}
                />
                {filters.sortDir === "asc" ? "Ascending" : "Descending"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filters.groupByDate}
                onCheckedChange={setGroupByDate}
              >
                Group by date
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="List view"
              aria-pressed={filters.viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={cn(filters.viewMode === "list" && "bg-muted")}
            >
              <Icon name="format_list_bulleted" size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Gallery view"
              aria-pressed={filters.viewMode === "gallery"}
              onClick={() => setViewMode("gallery")}
              className={cn(filters.viewMode === "gallery" && "bg-muted")}
            >
              <Icon name="apps" size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 space-y-4 overflow-y-auto px-1 pb-2">
        {notesR.isLoading ? null : all.length === 0 && (filters.search || filters.viewMode !== "gallery") ? (
          // Search-zero (both views) and the empty LIST get a sentence — a
          // list never fakes a row. The empty GALLERY falls through to the
          // grid below, which always leads with the create tile.
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Icon
              name={filters.search ? "search" : "edit_note"}
              size={26}
              className="text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              {filters.search
                ? "No notes match your search."
                : "No notes yet — create your first note."}
            </p>
          </div>
        ) : filters.viewMode === "gallery" ? (
          <div className="grid grid-cols-2 gap-2 px-1">
            {/* The create action as the first grid slot, Numbers-style
                (docs/design/empty-state.md): no box idle — plus + verb in the
                accent colour at a tile's footprint — silhouette on hover.
                Persists after notes exist. */}
            <button
              type="button"
              onClick={handleNewNote}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg text-primary transition-colors hover:bg-background/60 active:bg-background"
            >
              <Icon name="add" size={24} />
              <span className="text-xs font-medium">New note</span>
            </button>
            {all.map((n) => (
              <NoteTile key={n.id} note={n} />
            ))}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <section>
                <button
                  type="button"
                  onClick={() => setPinnedOpen((v) => !v)}
                  className="flex h-8 w-full items-center gap-1 px-2 font-heading text-xs font-semibold text-muted-foreground"
                >
                  <Icon
                    name={pinnedOpen ? "chevron_down" : "chevron_right"}
                    size={16}
                    className="text-muted-foreground"
                  />
                  Pinned
                </button>
                {pinnedOpen && (
                  <div className="space-y-1">
                    {pinned.map((n) => (
                      <NoteRow key={n.id} note={n} showOwner={n.shared_with_me} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {groups.map((g) => (
              <section key={g.key}>
                {g.label && (
                  <h3 className="px-2 py-1 font-heading text-xs font-semibold text-muted-foreground">
                    {g.label}
                  </h3>
                )}
                <div className="space-y-1">
                  {g.notes.map((n) => (
                    <NoteRow key={n.id} note={n} showOwner={n.shared_with_me} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      {/* Footer — separator, leave affordance, then account row (same metrics as top controls) */}
      <div className="flex flex-col">
        <div className="border-t border-border" />

        <div className="flex flex-col gap-0.5 px-1 py-2">
          {/* One account menu: who you are, Settings, Appearance, and the way
              out. Settings is reached from here and nowhere else. */}
          <AccountMenu isDemo={isDemo} />
        </div>

        {/* Mounted once, so `?settings=…` works cold. */}
        <SettingsDialog />
      </div>
    </div>

  );
}
