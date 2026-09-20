import { useParams, Link, Navigate } from "react-router-dom";
import { NoteDrawer } from "@/components/workspace/note-drawer";
import { ContentArea } from "@/components/layout/content-area";
import { HeaderBar } from "@/components/layout/header-bar";
import { NotepadContent } from "@/components/editor/notepad-content";
import { Icon } from "@/components/base/icon";
import { useDataProvider } from "@/lib/data-provider";
import "@/components/editor/editor.css";

/**
 * `/demo/:noteId` — the workspace shell (note list + open note) rendered
 * against seeded data. The body is read-only prose from the seed rather than
 * the live Yjs editor, because the demo has no session and no database.
 */
export default function DemoNote() {
  const { noteId = "" } = useParams();
  const dp = useDataProvider();
  const notes = dp.useWorkspaceNotes({ lens: "all", search: "" });
  const bodyR = dp.useNoteBody(noteId);

  const note = notes.data.find((n) => n.id === noteId);
  if (notes.data.length > 0 && !note) {
    return <Navigate to="/demo" replace />;
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-muted">
      <div className="hidden md:block">
        <NoteDrawer />
      </div>

      <div className="min-w-0 flex-1">
        <ContentArea>
          <HeaderBar
            hideBackButton
            title={note?.title || "Untitled"}
            rightContent={
              <Link
                to="/login"
                className="brand-pill inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium leading-none"
              >
                <Icon name="edit" size={16} />
                Sign in to edit
              </Link>
            }
          />
          <NotepadContent>
            <div className="notepad-editor">
              <div
                className="ProseMirror"
                // Seed prose only — static strings from `@/data/seed`.
                dangerouslySetInnerHTML={{ __html: bodyR.data || "<p>This note is empty.</p>" }}
              />
            </div>
          </NotepadContent>
        </ContentArea>
      </div>
    </div>
  );
}
