import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Lens } from "@/lib/data-provider";

export type SortBy = "updated_at" | "created_at" | "title";
export type SortDir = "asc" | "desc";
export type ViewMode = "list" | "gallery";

export interface WorkspaceFilterState {
  lens: Lens;
  folderId: string | null;
  tagIds: string[];
  search: string;
  sortBy: SortBy;
  sortDir: SortDir;
  groupByDate: boolean;
  viewMode: ViewMode;
}

const DEFAULT_STATE: WorkspaceFilterState = {
  lens: "all",
  folderId: null,
  tagIds: [],
  search: "",
  sortBy: "updated_at",
  sortDir: "desc",
  groupByDate: true,
  viewMode: "list",
};

interface WorkspaceFilterContextValue {
  filters: WorkspaceFilterState;
  setFilters: (updates: Partial<WorkspaceFilterState>) => void;
  setLens: (lens: Lens) => void;
  setFolder: (folderId: string | null) => void;
  toggleTag: (tagId: string) => void;
  setSearch: (search: string) => void;
  setSort: (sortBy: SortBy, sortDir: SortDir) => void;
  setGroupByDate: (v: boolean) => void;
  setViewMode: (v: ViewMode) => void;
  reset: () => void;
}

const WorkspaceFilterContext = createContext<WorkspaceFilterContextValue | null>(null);

export function useWorkspaceFilters(): WorkspaceFilterContextValue {
  const ctx = useContext(WorkspaceFilterContext);
  if (!ctx) throw new Error("useWorkspaceFilters must be inside a WorkspaceFilterProvider");
  return ctx;
}

export function WorkspaceFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setState] = useState<WorkspaceFilterState>(DEFAULT_STATE);

  const value = useMemo<WorkspaceFilterContextValue>(() => {
    const setFilters = (updates: Partial<WorkspaceFilterState>) =>
      setState((prev) => ({ ...prev, ...updates }));

    return {
      filters,
      setFilters,
      setLens: (lens) =>
        setState((prev) => ({
          ...prev,
          lens,
          folderId: lens === "folder" ? prev.folderId : null,
          tagIds: lens === "tag" ? prev.tagIds : [],
        })),
      setFolder: (folderId) => setState((prev) => ({ ...prev, lens: "folder", folderId })),
      toggleTag: (tagId) =>
        setState((prev) => ({
          ...prev,
          lens: "tag",
          tagIds: prev.tagIds.includes(tagId)
            ? prev.tagIds.filter((t) => t !== tagId)
            : [...prev.tagIds, tagId],
        })),
      setSearch: (search) => setState((prev) => ({ ...prev, search })),
      setSort: (sortBy, sortDir) => setState((prev) => ({ ...prev, sortBy, sortDir })),
      setGroupByDate: (groupByDate) => setState((prev) => ({ ...prev, groupByDate })),
      setViewMode: (viewMode) => setState((prev) => ({ ...prev, viewMode })),
      reset: () => setState(DEFAULT_STATE),
    };
  }, [filters]);

  return (
    <WorkspaceFilterContext.Provider value={value}>{children}</WorkspaceFilterContext.Provider>
  );
}
