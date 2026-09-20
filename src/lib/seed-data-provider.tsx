import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import * as seed from "@/data/seed";
import type { Folder, SeedNote, Tag } from "@/data/seed";
import {
  DataProviderContext,
  type AppDataProvider,
  type DeletedNote,
  type TagRef,
  type WorkspaceNote,
} from "@/lib/data-provider";

/**
 * SeedDataProvider — the same `AppDataProvider` surface as the Supabase one,
 * served from an in-memory copy of `@/data/seed`.
 *
 * Used ONLY by the `/demo/*` routes: no auth, no network, no database. Every
 * mutation writes to the store below and re-renders, so the demo behaves like
 * the real workspace and resets on reload.
 */

interface SeedState {
  notes: SeedNote[];
  folders: Folder[];
  tags: Tag[];
}

let state: SeedState = {
  notes: seed.notes.map((n) => ({ ...n, tags: [...n.tags] })),
  folders: [...seed.folders],
  tags: [...seed.tags],
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => void listeners.delete(l);
}

function setState(next: (prev: SeedState) => SeedState) {
  state = next(state);
  emit();
}

function updateNote(id: string, patch: (n: SeedNote) => SeedNote) {
  setState((prev) => ({
    ...prev,
    notes: prev.notes.map((n) => (n.id === id ? patch(n) : n)),
  }));
}

function useSeedState(): SeedState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

// ── Mapping / filtering ──────────────────────────────────────────────────────

function toWorkspaceNote(n: SeedNote, folders: Folder[]): WorkspaceNote {
  return {
    id: n.id,
    title: n.title,
    snippet: n.snippet,
    updated_at: n.updated_at,
    created_at: n.created_at,
    deleted_at: n.deleted_at,
    is_pinned: n.is_pinned,
    folder_id: n.folder_id,
    folder_name: folders.find((f) => f.id === n.folder_id)?.name ?? null,
    shared_with_me: n.shared_with_me,
    owner_name: n.owner_name,
    tags: n.tags.map((t) => ({ id: t.id, name: t.name })),
  };
}

function matchesSearch(n: WorkspaceNote, search?: string): boolean {
  if (!search) return true;
  const q = search.toLowerCase();
  return (
    n.title.toLowerCase().includes(q) || n.snippet.toLowerCase().includes(q)
  );
}

function sortNotes(a: WorkspaceNote, b: WorkspaceNote): number {
  if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const ok = { isLoading: false, error: null } as const;

// ── Provider ─────────────────────────────────────────────────────────────────

function createSeedProvider(): AppDataProvider {
  return {
    useWorkspaceNotes: (filters) => {
      const s = useSeedState();
      const data = s.notes
        .map((n) => toWorkspaceNote(n, s.folders))
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
      return { data, ...ok };
    },

    useSharedNotes: (filters) => {
      const s = useSeedState();
      const data = s.notes
        .map((n) => toWorkspaceNote(n, s.folders))
        .filter((n) => !n.deleted_at && n.shared_with_me)
        .filter((n) => matchesSearch(n, filters.search))
        .sort(sortNotes);
      return { data, ...ok };
    },

    useDeletedNotes: () => {
      const s = useSeedState();
      const data: DeletedNote[] = s.notes
        .filter((n) => n.deleted_at)
        .sort(
          (a, b) =>
            new Date(b.deleted_at!).getTime() - new Date(a.deleted_at!).getTime(),
        )
        .map((n) => ({
          id: n.id,
          title: n.title,
          snippet: n.snippet,
          deleted_at: n.deleted_at!,
          purge_at: addDays(n.deleted_at!, 30),
        }));
      return { data, ...ok };
    },

    useFolders: () => ({ data: useSeedState().folders, ...ok }),

    useNotesInFolder: (folderId, filters) => {
      const s = useSeedState();
      const data = s.notes
        .map((n) => toWorkspaceNote(n, s.folders))
        .filter((n) => !n.deleted_at && n.folder_id === folderId)
        .filter((n) => matchesSearch(n, filters.search))
        .sort(sortNotes);
      return { data, ...ok };
    },

    useTags: () => ({ data: useSeedState().tags, ...ok }),

    useNotesByTags: (tagIds, filters) => {
      const s = useSeedState();
      const data = s.notes
        .map((n) => toWorkspaceNote(n, s.folders))
        .filter((n) => !n.deleted_at)
        .filter((n) => tagIds.every((tid) => n.tags.some((t) => t.id === tid)))
        .filter((n) => matchesSearch(n, filters.search))
        .sort(sortNotes);
      return { data, ...ok };
    },

    useNoteTagsForNote: (notepadId) => {
      const s = useSeedState();
      const note = s.notes.find((n) => n.id === notepadId);
      const data: TagRef[] = note?.tags.map((t) => ({ id: t.id, name: t.name })) ?? [];
      return { data, ...ok };
    },

    useNoteBody: (notepadId) => {
      const s = useSeedState();
      return { data: s.notes.find((n) => n.id === notepadId)?.body ?? "", ...ok };
    },

    // Static marketing content — identical fixtures to the Supabase provider.
    useFeatureTabs: () => ({ data: seed.featureTabs, ...ok }),
    useSupportingFeatures: () => ({ data: seed.supportingFeatures, ...ok }),
    useTestimonials: () => ({ data: seed.testimonials, ...ok }),
    useFooterLinks: () => ({ data: seed.footerLinks, ...ok }),

    // ── Mutations ────────────────────────────────────────────────────────────
    useCreateNote: () => ({
      mutate: useCallback(async (input: { activeFolderId?: string | null }) => {
        const id = `demo-${Date.now().toString(36)}`;
        const now = new Date().toISOString();
        setState((prev) => ({
          ...prev,
          notes: [
            {
              id,
              title: "",
              snippet: "",
              folder_id: input.activeFolderId ?? null,
              deleted_at: null,
              is_pinned: false,
              updated_at: now,
              created_at: now,
              owner_id: "demo",
              shared_with_me: false,
              owner_name: null,
              tags: [],
              body: "",
            },
            ...prev.notes,
          ],
        }));
        return { id };
      }, []),
      isPending: false,
    }),

    useRenameNote: () => ({
      mutate: useCallback(({ notepadId, title }: { notepadId: string; title: string }) => {
        updateNote(notepadId, (n) => ({
          ...n,
          title,
          updated_at: new Date().toISOString(),
        }));
      }, []),
      isPending: false,
    }),

    useCreateFolder: () => ({
      mutate: useCallback(({ name }: { name: string }) => {
        setState((prev) => ({
          ...prev,
          folders: [
            ...prev.folders,
            {
              id: `f-${Date.now().toString(36)}`,
              name: name.trim(),
              owner_id: "demo",
              created_at: new Date().toISOString(),
            },
          ].sort((a, b) => a.name.localeCompare(b.name)),
        }));
      }, []),
      isPending: false,
    }),

    useDeleteFolder: () => ({
      mutate: useCallback(({ folderId }: { folderId: string }) => {
        setState((prev) => ({
          ...prev,
          folders: prev.folders.filter((f) => f.id !== folderId),
          notes: prev.notes.map((n) =>
            n.folder_id === folderId ? { ...n, folder_id: null } : n,
          ),
        }));
      }, []),
      isPending: false,
    }),

    useCreateTag: () => ({
      mutate: useCallback(async ({ name }: { name: string }) => {
        const id = `t-${Date.now().toString(36)}`;
        setState((prev) => ({
          ...prev,
          tags: [
            ...prev.tags,
            { id, name: name.trim(), owner_id: "demo", created_at: new Date().toISOString() },
          ].sort((a, b) => a.name.localeCompare(b.name)),
        }));
        return { id };
      }, []),
      isPending: false,
    }),

    useDeleteTag: () => ({
      mutate: useCallback(({ tagId }: { tagId: string }) => {
        setState((prev) => ({
          ...prev,
          tags: prev.tags.filter((t) => t.id !== tagId),
          notes: prev.notes.map((n) => ({
            ...n,
            tags: n.tags.filter((t) => t.id !== tagId),
          })),
        }));
      }, []),
      isPending: false,
    }),

    useAddTagToNote: () => ({
      mutate: useCallback(({ notepadId, tagId }: { notepadId: string; tagId: string }) => {
        const tag = state.tags.find((t) => t.id === tagId);
        if (!tag) return;
        updateNote(notepadId, (n) =>
          n.tags.some((t) => t.id === tagId)
            ? n
            : { ...n, tags: [...n.tags, { id: tag.id, name: tag.name }] },
        );
      }, []),
      isPending: false,
    }),

    useRemoveTagFromNote: () => ({
      mutate: useCallback(({ notepadId, tagId }: { notepadId: string; tagId: string }) => {
        updateNote(notepadId, (n) => ({
          ...n,
          tags: n.tags.filter((t) => t.id !== tagId),
        }));
      }, []),
      isPending: false,
    }),

    usePinNote: () => ({
      mutate: useCallback(({ notepadId, isPinned }: { notepadId: string; isPinned: boolean }) => {
        updateNote(notepadId, (n) => ({ ...n, is_pinned: isPinned }));
      }, []),
      isPending: false,
    }),

    useSoftDeleteNote: () => ({
      mutate: useCallback(({ notepadId }: { notepadId: string }) => {
        updateNote(notepadId, (n) => ({ ...n, deleted_at: new Date().toISOString() }));
      }, []),
      isPending: false,
    }),

    useRestoreNote: () => ({
      mutate: useCallback(({ notepadId }: { notepadId: string }) => {
        updateNote(notepadId, (n) => ({ ...n, deleted_at: null }));
      }, []),
      isPending: false,
    }),

    useHardDeleteNote: () => ({
      mutate: useCallback(({ notepadId }: { notepadId: string }) => {
        setState((prev) => ({
          ...prev,
          notes: prev.notes.filter((n) => n.id !== notepadId),
        }));
      }, []),
      isPending: false,
    }),

    useAssignFolder: () => ({
      mutate: useCallback(
        ({ notepadId, folderId }: { notepadId: string; folderId: string | null }) => {
          updateNote(notepadId, (n) => ({ ...n, folder_id: folderId }));
        },
        [],
      ),
      isPending: false,
    }),
  };
}

export function SeedDataProvider({ children }: { children: ReactNode }) {
  // Hooks live on the object; the object itself is stable per render tree.
  const provider = createSeedProvider();
  return (
    <DataProviderContext.Provider value={provider}>
      {children}
    </DataProviderContext.Provider>
  );
}
