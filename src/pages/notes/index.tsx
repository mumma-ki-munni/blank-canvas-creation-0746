import { Navigate } from "react-router-dom";
import { useDataProvider } from "@/lib/data-provider";

/**
 * `/notes` — always lands you in a doc (notes-app model): the
 * most-recent note, or a fresh blank one (`/session/new`) if you have none.
 * The note list lives in the editor's left sidebar. Wrapped in
 * SupabaseDataProvider + WorkspaceFilterProvider by App.tsx.
 */
export default function NotesPage() {
  const dp = useDataProvider();
  const notesR = dp.useWorkspaceNotes({ lens: "all", search: "" });

  if (notesR.isLoading) return null;

  const recent = notesR.data?.[0];
  return (
    <Navigate to={recent ? `/session/${recent.id}` : "/session/new"} replace />
  );
}
