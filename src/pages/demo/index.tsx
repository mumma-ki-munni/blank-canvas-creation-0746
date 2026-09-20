import { Navigate } from "react-router-dom";
import { useDataProvider } from "@/lib/data-provider";

/**
 * `/demo` — lands in the most recent seeded note, mirroring what `/notes`
 * does for the authenticated workspace. No auth, no database.
 */
export default function DemoIndex() {
  const dp = useDataProvider();
  const notes = dp.useWorkspaceNotes({ lens: "all", search: "" });
  const first = notes.data?.[0];
  if (!first) return null;
  return <Navigate to={`/demo/${first.id}`} replace />;
}
