import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth";
import * as seed from "@/data/seed";
import type {
  Folder,
  Tag,
  FeatureTab,
  SupportingFeature,
  Testimonial,
  FooterLinkGroup,
} from "@/data/seed";

// Re-export the static landing content types so page components consume them
// from the provider surface, never from `@/data/seed` directly.
export type { FeatureTab, SupportingFeature, Testimonial, FooterLinkGroup };

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

export type Lens = "all" | "shared" | "folder" | "tag" | "deleted";

/** Minimal tag shape used for chips (id + name). */
export interface TagRef {
  id: string;
  name: string;
}

/** A note as rendered in the workspace note list (provider-agnostic shape). */
export interface WorkspaceNote {
  id: string;
  title: string;
  snippet: string;
  updated_at: string;
  /** When the note was made. The note list's "Date created" sort reads this. */
  created_at: string;
  deleted_at: string | null;
  is_pinned: boolean;
  folder_id: string | null;
  folder_name: string | null;
  shared_with_me: boolean;
  owner_name: string | null;
  tags: TagRef[];
}

/** A note in the Recently Deleted lens. */
export interface DeletedNote {
  id: string;
  title: string;
  snippet: string;
  deleted_at: string;
  /** deleted_at + 30 days — when the note is permanently purged. */
  purge_at: string;
}

export interface WorkspaceFilters {
  lens: Lens;
  folderId?: string;
  tagIds?: string[];
  search?: string;
}
export interface SharedFilters {
  search?: string;
}
export interface FolderFilters {
  folderId: string;
  search?: string;
}
export interface TagFilters {
  tagIds: string[];
  search?: string;
}

interface ReadResult<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
}
interface Mutation<TInput, TResult = void> {
  mutate: (input: TInput) => TResult;
  isPending: boolean;
}

export interface AppDataProvider {
  // Reads
  useWorkspaceNotes(filters: WorkspaceFilters): ReadResult<WorkspaceNote[]>;
  useSharedNotes(filters: SharedFilters): ReadResult<WorkspaceNote[]>;
  useDeletedNotes(): ReadResult<DeletedNote[]>;
  useFolders(): ReadResult<Folder[]>;
  useNotesInFolder(folderId: string, filters: FolderFilters): ReadResult<WorkspaceNote[]>;
  useTags(): ReadResult<Tag[]>;
  useNotesByTags(tagIds: string[], filters: TagFilters): ReadResult<WorkspaceNote[]>;
  useNoteTagsForNote(notepadId: string): ReadResult<TagRef[]>;
  /**
   * Rich-text body prose (HTML) for the read-only demo note preview.
   * Seed provider returns the note's `body`; the Supabase provider returns ""
   * because the real note body lives in Yjs (`notepad_updates`), not a column —
   * the authenticated workspace opens the live editor instead of a preview.
   */
  useNoteBody(notepadId: string): ReadResult<string>;

  // Static landing marketing content (public `/` route)
  useFeatureTabs(): ReadResult<FeatureTab[]>;
  useSupportingFeatures(): ReadResult<SupportingFeature[]>;
  useTestimonials(): ReadResult<Testimonial[]>;
  useFooterLinks(): ReadResult<FooterLinkGroup[]>;

  // Mutations
  useCreateNote(): Mutation<{ activeFolderId?: string | null }, Promise<{ id: string }>>;
  /**
   * Rename a note from its own first heading.
   *
   * The authenticated editor (pages/session.tsx) writes the title straight to
   * Supabase on a debounce and does not come through here; this exists so the
   * demo can do the same thing against seeded data, rather than a typed title
   * never reaching the list beside it.
   */
  useRenameNote(): Mutation<{ notepadId: string; title: string }>;
  useCreateFolder(): Mutation<{ name: string }>;
  useDeleteFolder(): Mutation<{ folderId: string }>;
  useCreateTag(): Mutation<{ name: string }, Promise<{ id: string }>>;
  useDeleteTag(): Mutation<{ tagId: string }>;
  useAddTagToNote(): Mutation<{ notepadId: string; tagId: string }>;
  useRemoveTagFromNote(): Mutation<{ notepadId: string; tagId: string }>;
  usePinNote(): Mutation<{ notepadId: string; isPinned: boolean }>;
  useSoftDeleteNote(): Mutation<{ notepadId: string }>;
  useRestoreNote(): Mutation<{ notepadId: string }>;
  useHardDeleteNote(): Mutation<{ notepadId: string }>;
  useAssignFolder(): Mutation<{ notepadId: string; folderId: string | null }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

export const DataProviderContext = createContext<AppDataProvider | null>(null);

export function useDataProvider(): AppDataProvider {
  const ctx = useContext(DataProviderContext);
  if (!ctx) throw new Error("useDataProvider must be inside a DataProvider");
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared pure filter/sort helpers — used by BOTH providers so the demo behaves
// identically to the authenticated workspace.
// ─────────────────────────────────────────────────────────────────────────────

function sortNotes(a: WorkspaceNote, b: WorkspaceNote): number {
  if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

function matchesSearch(note: WorkspaceNote, search?: string): boolean {
  if (!search) return true;
  const q = search.toLowerCase();
  return (
    note.title.toLowerCase().includes(q) ||
    note.snippet.toLowerCase().includes(q)
  );
}

function filterWorkspaceNotes(
  notes: WorkspaceNote[],
  filters: WorkspaceFilters,
): WorkspaceNote[] {
  return notes
    .filter((n) => !n.deleted_at)
    .filter((n) => filters.lens !== "shared" || n.shared_with_me)
    .filter(
      (n) =>
        filters.lens !== "folder" ||
        !filters.folderId ||
        n.folder_id === filters.folderId,
    )
    .filter(
      (n) =>
        filters.lens !== "tag" ||
        !filters.tagIds?.length ||
        filters.tagIds.every((tid) => n.tags.some((t) => t.id === tid)),
    )
    .filter((n) => matchesSearch(n, filters.search))
    .sort(sortNotes);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// SupabaseDataProvider — real React Query hooks against Supabase.
// ─────────────────────────────────────────────────────────────────────────────

interface RawMember {
  user_id: string;
  role: string;
  is_pinned?: boolean;
}
interface RawNoteTag {
  tag_id: string;
  tags: { id: string; name: string } | null;
}
interface RawNoteRow {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
  deleted_at: string | null;
  folder_id: string | null;
  folders: { name: string } | null;
  notepad_members: RawMember[];
  note_tags: RawNoteTag[];
}

function mapNoteRow(r: RawNoteRow, userId: string): WorkspaceNote {
  const members = r.notepad_members ?? [];
  const mine = members.find((m) => m.user_id === userId) ?? members[0];
  return {
    id: r.id,
    title: r.title || "Untitled",
    // Body lives in Yjs (notepad_updates), not a column — no snippet server-side.
    snippet: "",
    updated_at: r.updated_at,
    created_at: r.created_at,
    deleted_at: r.deleted_at,
    is_pinned: mine?.is_pinned ?? false,
    folder_id: r.folder_id,
    folder_name: r.folders?.name ?? null,
    shared_with_me: (mine?.role ?? "owner") !== "owner",
    owner_name: null,
    tags: (r.note_tags ?? [])
      .map((nt) => ({ id: nt.tags?.id ?? nt.tag_id, name: nt.tags?.name ?? "" }))
      .filter((t) => t.name),
  };
}

export function SupabaseDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.id;
  const notesKey = ["workspace-notes", uid];
  const foldersKey = ["folders", uid];
  const tagsKey = ["tags", uid];
  const deletedKey = ["deleted-notes", uid];

  const provider: AppDataProvider = {
    // ── Reads ──────────────────────────────────────────────────────────────
    useWorkspaceNotes: (filters) => {
      const { data, isLoading, error } = useQuery({
        queryKey: notesKey,
        queryFn: async () => {
          const { data, error } = await supabase
            .from("notepads")
            .select(
              `id, title, updated_at, created_at, deleted_at, folder_id,
               folders!folder_id(name),
               notepad_members!inner(user_id, role, is_pinned),
               note_tags(tag_id, tags(id, name))`,
            )
            .eq("notepad_members.user_id", uid!)
            .is("deleted_at", null)
            .order("is_pinned", { referencedTable: "notepad_members", ascending: false })
            .order("updated_at", { ascending: false })
            .returns<RawNoteRow[]>();
          if (error) throw error;
          return (data ?? []).map((r) => mapNoteRow(r, uid!));
        },
        enabled: !!uid,
      });
      return {
        data: filterWorkspaceNotes(data ?? [], filters),
        isLoading,
        error: (error as Error) ?? null,
      };
    },

    useSharedNotes: (filters) => {
      const { data, isLoading, error } = useQuery({
        queryKey: ["shared-notes", uid],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("notepads")
            .select(
              `id, title, updated_at, created_at, deleted_at, folder_id,
               folders!folder_id(name),
               notepad_members!inner(user_id, role, is_pinned),
               note_tags(tag_id, tags(id, name))`,
            )
            .eq("notepad_members.user_id", uid!)
            .neq("notepad_members.role", "owner")
            .is("deleted_at", null)
            .order("updated_at", { ascending: false })
            .returns<RawNoteRow[]>();
          if (error) throw error;
          return (data ?? []).map((r) => mapNoteRow(r, uid!));
        },
        enabled: !!uid,
      });
      return {
        data: (data ?? [])
          .filter((n) => matchesSearch(n, filters.search))
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
        isLoading,
        error: (error as Error) ?? null,
      };
    },

    useDeletedNotes: () => {
      const { data, isLoading, error } = useQuery({
        queryKey: deletedKey,
        queryFn: async () => {
          const { data, error } = await supabase
            .from("notepads")
            .select(`id, title, deleted_at, notepad_members!inner(user_id, role)`)
            .eq("notepad_members.user_id", uid!)
            .eq("notepad_members.role", "owner")
            .not("deleted_at", "is", null)
            .order("deleted_at", { ascending: false })
            .returns<{ id: string; title: string; deleted_at: string }[]>();
          if (error) throw error;
          return (data ?? []).map((r) => ({
            id: r.id,
            title: r.title || "Untitled",
            snippet: "",
            deleted_at: r.deleted_at,
            purge_at: addDays(r.deleted_at, 30),
          }));
        },
        enabled: !!uid,
      });
      return { data: data ?? [], isLoading, error: (error as Error) ?? null };
    },

    useFolders: () => {
      const { data, isLoading, error } = useQuery({
        queryKey: foldersKey,
        queryFn: async () => {
          const { data, error } = await supabase
            .from("folders")
            .select("id, name, owner_id, created_at")
            .eq("owner_id", uid!)
            .order("name", { ascending: true })
            .returns<Folder[]>();
          if (error) throw error;
          return data ?? [];
        },
        enabled: !!uid,
      });
      return { data: data ?? [], isLoading, error: (error as Error) ?? null };
    },

    useNotesInFolder: (folderId, filters) => {
      const { data, isLoading, error } = useQuery({
        queryKey: ["notes-in-folder", uid, folderId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("notepads")
            .select(
              `id, title, updated_at, created_at, deleted_at, folder_id,
               folders!folder_id(name),
               notepad_members!inner(user_id, role, is_pinned),
               note_tags(tag_id, tags(id, name))`,
            )
            .eq("notepad_members.user_id", uid!)
            .eq("folder_id", folderId)
            .is("deleted_at", null)
            .order("is_pinned", { referencedTable: "notepad_members", ascending: false })
            .order("updated_at", { ascending: false })
            .returns<RawNoteRow[]>();
          if (error) throw error;
          return (data ?? []).map((r) => mapNoteRow(r, uid!));
        },
        enabled: !!uid && !!folderId,
      });
      return {
        data: (data ?? []).filter((n) => matchesSearch(n, filters.search)).sort(sortNotes),
        isLoading,
        error: (error as Error) ?? null,
      };
    },

    useTags: () => {
      const { data, isLoading, error } = useQuery({
        queryKey: tagsKey,
        queryFn: async () => {
          const { data, error } = await supabase
            .from("tags")
            .select("id, name, owner_id, created_at")
            .eq("owner_id", uid!)
            .order("name", { ascending: true })
            .returns<Tag[]>();
          if (error) throw error;
          return data ?? [];
        },
        enabled: !!uid,
      });
      return { data: data ?? [], isLoading, error: (error as Error) ?? null };
    },

    useNotesByTags: (tagIds, filters) => {
      const { data, isLoading, error } = useQuery({
        queryKey: ["notes-by-tags", uid, [...tagIds].sort()],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("note_tags")
            .select(
              `notepad_id, tag_id,
               notepads!notepad_id(
                 id, title, updated_at, deleted_at, folder_id,
                 folders!folder_id(name),
                 notepad_members!inner(user_id, role, is_pinned),
                 note_tags(tag_id, tags(id, name))
               )`,
            )
            .in("tag_id", tagIds)
            .is("notepads.deleted_at", null)
            .eq("notepads.notepad_members.user_id", uid!)
            .returns<{ notepad_id: string; tag_id: string; notepads: RawNoteRow | null }[]>();
          if (error) throw error;

          // Group by notepad, keep only notes carrying ALL selected tags (AND).
          const byNote = new Map<string, { note: RawNoteRow; tagHits: Set<string> }>();
          for (const row of data ?? []) {
            if (!row.notepads) continue;
            const entry = byNote.get(row.notepad_id) ?? {
              note: row.notepads,
              tagHits: new Set<string>(),
            };
            entry.tagHits.add(row.tag_id);
            byNote.set(row.notepad_id, entry);
          }
          return Array.from(byNote.values())
            .filter((e) => tagIds.every((tid) => e.tagHits.has(tid)))
            .map((e) => mapNoteRow(e.note, uid!));
        },
        enabled: !!uid && tagIds.length > 0,
      });
      return {
        data: (data ?? []).filter((n) => matchesSearch(n, filters.search)).sort(sortNotes),
        isLoading,
        error: (error as Error) ?? null,
      };
    },

    useNoteTagsForNote: (notepadId) => {
      const { data, isLoading, error } = useQuery({
        queryKey: ["note-tags", notepadId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("note_tags")
            .select("tag_id, tags(id, name)")
            .eq("notepad_id", notepadId)
            .returns<RawNoteTag[]>();
          if (error) throw error;
          return (data ?? [])
            .map((nt) => ({ id: nt.tags?.id ?? nt.tag_id, name: nt.tags?.name ?? "" }))
            .filter((t) => t.name);
        },
        enabled: !!notepadId,
      });
      return { data: data ?? [], isLoading, error: (error as Error) ?? null };
    },

    // Note body prose is only consumed by the read-only demo preview. In the
    // authenticated workspace the body lives in Yjs (notepad_updates) and is
    // rendered by the live editor, so there is nothing to return here.
    useNoteBody: () => ({ data: "", isLoading: false, error: null }),

    // Static marketing content — same fixtures the seed provider serves; it is
    // not user-specific, so no Supabase round-trip is needed.
    useFeatureTabs: () => ({ data: seed.featureTabs, isLoading: false, error: null }),
    useSupportingFeatures: () => ({ data: seed.supportingFeatures, isLoading: false, error: null }),
    useTestimonials: () => ({ data: seed.testimonials, isLoading: false, error: null }),
    useFooterLinks: () => ({ data: seed.footerLinks, isLoading: false, error: null }),

    // ── Mutations ────────────────────────────────────────────────────────────
    useCreateNote: () => {
      const mutation = useMutation({
        mutationFn: async (input: { activeFolderId?: string | null }) => {
          // Generate the id client-side so we don't depend on RETURNING (the
          // RLS SELECT check fails on a just-inserted row before the ownership
          // trigger has granted membership). A DB trigger on notepads inserts
          // the creator's owner membership row, so we must NOT insert it here
          // (it would violate the unique (notepad_id, user_id) constraint).
          const newId = crypto.randomUUID();
          const { error } = await supabase.from("notepads").insert({
            id: newId,
            title: "",
            allow_guest_access: false,
            folder_id: input.activeFolderId ?? null,
          });
          if (error) throw error;
          return { id: newId };
        },

        onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey }),
        onError: () => toast.error("Failed to create note"),
      });
      return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
    },

    // The same column update pages/session.tsx does on its own debounce. That
    // path is left alone; this exists so the demo has one too.
    useRenameNote: () => {
      const mutation = useMutation({
        mutationFn: async (input: { notepadId: string; title: string }) => {
          const { error } = await supabase
            .from("notepads")
            .update({ title: input.title })
            .eq("id", input.notepadId);
          if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey }),
      });
      return { mutate: mutation.mutate, isPending: mutation.isPending };
    },

    useCreateFolder: () => {
      const mutation = useMutation({
        mutationFn: async (input: { name: string }) => {
          const { data, error } = await supabase
            .from("folders")
            .insert({ owner_id: uid!, name: input.name.trim() })
            .select()
            .single();
          if (error) throw error;
          return data;
        },
        onMutate: async (input) => {
          await queryClient.cancelQueries({ queryKey: foldersKey });
          const previous = queryClient.getQueryData<Folder[]>(foldersKey);
          const optimistic: Folder = {
            id: `optimistic-${input.name}`,
            name: input.name.trim(),
            owner_id: uid ?? "",
            created_at: new Date().toISOString(),
          };
          queryClient.setQueryData<Folder[]>(foldersKey, (old) =>
            [...(old ?? []), optimistic].sort((a, b) => a.name.localeCompare(b.name)),
          );
          return { previous };
        },
        onError: (_e, _v, ctx) => {
          queryClient.setQueryData(foldersKey, ctx?.previous);
          toast.error("Couldn't create the folder. Try again.");
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: foldersKey }),
      });
      return { mutate: mutation.mutate, isPending: mutation.isPending };
    },

    useDeleteFolder: () => {
      const mutation = useMutation({
        mutationFn: async (input: { folderId: string }) => {
          const { error } = await supabase
            .from("folders")
            .delete()
            .eq("id", input.folderId)
            .eq("owner_id", uid!);
          if (error) throw error;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: foldersKey });
          queryClient.invalidateQueries({ queryKey: notesKey });
        },
        onError: () => toast.error("Couldn't delete the folder. Try again."),
      });
      return { mutate: mutation.mutate, isPending: mutation.isPending };
    },

    useCreateTag: () => {
      const mutation = useMutation({
        mutationFn: async (input: { name: string }) => {
          const { data, error } = await supabase
            .from("tags")
            .insert({ owner_id: uid!, name: input.name.trim() })
            .select()
            .single();
          if (error) throw error;
          return { id: data!.id };
        },
        onMutate: async (input) => {
          await queryClient.cancelQueries({ queryKey: tagsKey });
          const previous = queryClient.getQueryData<Tag[]>(tagsKey);
          const optimistic: Tag = {
            id: `optimistic-${input.name}`,
            name: input.name.trim(),
            owner_id: uid ?? "",
            created_at: new Date().toISOString(),
          };
          queryClient.setQueryData<Tag[]>(tagsKey, (old) =>
            [...(old ?? []), optimistic].sort((a, b) => a.name.localeCompare(b.name)),
          );
          return { previous };
        },
        onError: (err, _v, ctx) => {
          queryClient.setQueryData(tagsKey, ctx?.previous);
          const message = (err as Error)?.message ?? "";
          toast.error(
            message.includes("unique") || message.includes("duplicate")
              ? "Tag already exists"
              : "Couldn't create the tag. Try again.",
          );
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: tagsKey }),
      });
      return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
    },

    useDeleteTag: () => {
      const mutation = useMutation({
        mutationFn: async (input: { tagId: string }) => {
          const { error } = await supabase
            .from("tags")
            .delete()
            .eq("id", input.tagId)
            .eq("owner_id", uid!);
          if (error) throw error;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: tagsKey });
          queryClient.invalidateQueries({ queryKey: notesKey });
        },
        onError: () => toast.error("Couldn't delete the tag. Try again."),
      });
      return { mutate: mutation.mutate, isPending: mutation.isPending };
    },

    useAddTagToNote: () => {
      const mutation = useMutation({
        mutationFn: async (input: { notepadId: string; tagId: string }) => {
          const { error } = await supabase
            .from("note_tags")
            .insert({ notepad_id: input.notepadId, tag_id: input.tagId });
          if (error) throw error;
        },
        onMutate: async ({ notepadId, tagId }) => {
          await queryClient.cancelQueries({ queryKey: notesKey });
          const previous = queryClient.getQueryData<WorkspaceNote[]>(notesKey);
          const tag = queryClient
            .getQueryData<Tag[]>(tagsKey)
            ?.find((t) => t.id === tagId);
          const chip: TagRef = { id: tagId, name: tag?.name ?? "" };
          queryClient.setQueryData<WorkspaceNote[]>(notesKey, (old) =>
            (old ?? []).map((n) =>
              n.id === notepadId && !n.tags.some((t) => t.id === tagId)
                ? { ...n, tags: [...n.tags, chip] }
                : n,
            ),
          );
          return { previous };
        },
        onError: (_e, _v, ctx) => {
          queryClient.setQueryData(notesKey, ctx?.previous);
          toast.error("Couldn't add the tag. Try again.");
        },
        onSettled: (_d, _e, { notepadId }) => {
          queryClient.invalidateQueries({ queryKey: notesKey });
          queryClient.invalidateQueries({ queryKey: ["note-tags", notepadId] });
        },
      });
      return { mutate: mutation.mutate, isPending: mutation.isPending };
    },

    useRemoveTagFromNote: () => {
      const mutation = useMutation({
        mutationFn: async (input: { notepadId: string; tagId: string }) => {
          const { error } = await supabase
            .from("note_tags")
            .delete()
            .eq("notepad_id", input.notepadId)
            .eq("tag_id", input.tagId);
          if (error) throw error;
        },
        onMutate: async ({ notepadId, tagId }) => {
          await queryClient.cancelQueries({ queryKey: notesKey });
          const previous = queryClient.getQueryData<WorkspaceNote[]>(notesKey);
          queryClient.setQueryData<WorkspaceNote[]>(notesKey, (old) =>
            (old ?? []).map((n) =>
              n.id === notepadId
                ? { ...n, tags: n.tags.filter((t) => t.id !== tagId) }
                : n,
            ),
          );
          return { previous };
        },
        onError: (_e, _v, ctx) => {
          queryClient.setQueryData(notesKey, ctx?.previous);
          toast.error("Couldn't remove the tag. Try again.");
        },
        onSettled: (_d, _e, { notepadId }) => {
          queryClient.invalidateQueries({ queryKey: notesKey });
          queryClient.invalidateQueries({ queryKey: ["note-tags", notepadId] });
        },
      });
      return { mutate: mutation.mutate, isPending: mutation.isPending };
    },

    usePinNote: () => {
      const mutation = useMutation({
        mutationFn: async (input: { notepadId: string; isPinned: boolean }) => {
          const { error } = await supabase
            .from("notepad_members")
            .update({ is_pinned: input.isPinned })
            .eq("notepad_id", input.notepadId)
            .eq("user_id", uid!);
          if (error) throw error;
        },
        onMutate: async ({ notepadId, isPinned }) => {
          await queryClient.cancelQueries({ queryKey: notesKey });
          const previous = queryClient.getQueryData<WorkspaceNote[]>(notesKey);
          queryClient.setQueryData<WorkspaceNote[]>(notesKey, (old) =>
            (old ?? [])
              .map((n) => (n.id === notepadId ? { ...n, is_pinned: isPinned } : n))
              .sort(sortNotes),
          );
          return { previous };
        },
        onError: (_e, _v, ctx) => {
          queryClient.setQueryData(notesKey, ctx?.previous);
          toast.error("Couldn't update the pin. Try again.");
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: notesKey }),
      });
      return { mutate: mutation.mutate, isPending: mutation.isPending };
    },

    useSoftDeleteNote: () => {
      const mutation = useMutation({
        mutationFn: async (input: { notepadId: string }) => {
          const { error } = await supabase
            .from("notepads")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", input.notepadId);
          if (error) throw error;
        },
        onMutate: async ({ notepadId }) => {
          await queryClient.cancelQueries({ queryKey: notesKey });
          const previous = queryClient.getQueryData<WorkspaceNote[]>(notesKey);
          queryClient.setQueryData<WorkspaceNote[]>(notesKey, (old) =>
            (old ?? []).filter((n) => n.id !== notepadId),
          );
          return { previous };
        },
        onError: (_e, _v, ctx) => {
          queryClient.setQueryData(notesKey, ctx?.previous);
          toast.error("Couldn't delete the note. Try again.");
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: notesKey });
          queryClient.invalidateQueries({ queryKey: deletedKey });
        },
      });
      return { mutate: mutation.mutate, isPending: mutation.isPending };
    },

    useRestoreNote: () => {
      const mutation = useMutation({
        mutationFn: async (input: { notepadId: string }) => {
          const { error } = await supabase
            .from("notepads")
            .update({ deleted_at: null })
            .eq("id", input.notepadId);
          if (error) throw error;
        },
        onMutate: async ({ notepadId }) => {
          await queryClient.cancelQueries({ queryKey: deletedKey });
          const previous = queryClient.getQueryData<DeletedNote[]>(deletedKey);
          queryClient.setQueryData<DeletedNote[]>(deletedKey, (old) =>
            (old ?? []).filter((n) => n.id !== notepadId),
          );
          return { previous };
        },
        onError: (_e, _v, ctx) => {
          queryClient.setQueryData(deletedKey, ctx?.previous);
          toast.error("Couldn't restore the note. Try again.");
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: deletedKey });
          queryClient.invalidateQueries({ queryKey: notesKey });
        },
      });
      return { mutate: mutation.mutate, isPending: mutation.isPending };
    },

    useHardDeleteNote: () => {
      const mutation = useMutation({
        mutationFn: async (input: { notepadId: string }) => {
          const { error } = await supabase.from("notepads").delete().eq("id", input.notepadId);
          if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: deletedKey }),
        onError: () => toast.error("Couldn't permanently delete the note. Try again."),
      });
      return { mutate: mutation.mutate, isPending: mutation.isPending };
    },

    useAssignFolder: () => {
      const mutation = useMutation({
        mutationFn: async (input: { notepadId: string; folderId: string | null }) => {
          const { error } = await supabase
            .from("notepads")
            .update({ folder_id: input.folderId })
            .eq("id", input.notepadId);
          if (error) throw error;
        },
        onMutate: async ({ notepadId, folderId }) => {
          await queryClient.cancelQueries({ queryKey: notesKey });
          const previous = queryClient.getQueryData<WorkspaceNote[]>(notesKey);
          const folderName = folderId
            ? queryClient.getQueryData<Folder[]>(foldersKey)?.find((f) => f.id === folderId)
                ?.name ?? null
            : null;
          queryClient.setQueryData<WorkspaceNote[]>(notesKey, (old) =>
            (old ?? []).map((n) =>
              n.id === notepadId ? { ...n, folder_id: folderId, folder_name: folderName } : n,
            ),
          );
          return { previous };
        },
        onError: (_e, _v, ctx) => {
          queryClient.setQueryData(notesKey, ctx?.previous);
          toast.error("Couldn't move the note. Try again.");
        },
        onSettled: (_d, _e, { folderId }) => {
          queryClient.invalidateQueries({ queryKey: notesKey });
          if (folderId) queryClient.invalidateQueries({ queryKey: ["notes-in-folder", uid, folderId] });
        },
      });
      return { mutate: mutation.mutate, isPending: mutation.isPending };
    },
  };

  return (
    <DataProviderContext.Provider value={provider}>
      {children}
    </DataProviderContext.Provider>
  );
}
