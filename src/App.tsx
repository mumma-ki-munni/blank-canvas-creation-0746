import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, LoginPage } from "./components/auth";
import { AppearanceProvider } from "./lib/appearance";
import { queryClient } from "./lib/query-client";
import { ProtectedRoute } from "./components/protected-route";
import { SupabaseDataProvider } from "./lib/data-provider";
import { WorkspaceFilterProvider } from "./lib/filter-context";
import { Toaster } from "./components/ui/sonner";
import ApplicationLayout from "./layouts/application-layout";
import Landing from "./pages/landing";
import SessionPage from "./pages/session";
import NotesPage from "./pages/notes";
import NotFound from "./pages/not-found";
import AuthCallback from "./pages/auth-callback";
import { SeedDataProvider } from "./lib/seed-data-provider";
import DemoIndex from "./pages/demo";
import DemoNote from "./pages/demo/note";

/**
 * Keyed so the editor fully REMOUNTS when the note id changes (switching notes
 * from the sidebar). Without the key, React reuses SessionPage and its Yjs/
 * TipTap view goes stale → "editor view not available" → blank. The note-list
 * sidebar's open/closed state survives via localStorage (see session.tsx).
 */
function SessionRoute() {
  const { id = "new" } = useParams();
  return <SessionPage key={id} />;
}

// Direction B — editor-first, list as a peek drawer.
//  "/"            → marketing landing (CTAs → /session/new, /demo)
//  "/login"       → auth
//  "/session/:id" → the editor app (collab + chat + comments + share); guest-capable
//  "/notes"       → workspace (protected, SupabaseDataProvider)
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppearanceProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<ApplicationLayout />}>
            <Route path="/" element={<Landing />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Editor (guest-capable, never auth-gated) */}
          <Route path="/session/:id" element={<SessionRoute />} />

          {/* Demo — mirrors the authenticated workspace on seeded data.
              No auth, no database (SeedDataProvider). */}
          <Route
            element={
              <SeedDataProvider>
                <WorkspaceFilterProvider>
                  <Outlet />
                </WorkspaceFilterProvider>
              </SeedDataProvider>
            }
          >
            <Route path="/demo" element={<DemoIndex />} />
            <Route path="/demo/:noteId" element={<DemoNote />} />
          </Route>

          {/* Authenticated workspace — Supabase */}
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <SupabaseDataProvider>
                  <WorkspaceFilterProvider>
                    <NotesPage />
                  </WorkspaceFilterProvider>
                </SupabaseDataProvider>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
    </AppearanceProvider>
  </QueryClientProvider>
);

export default App;
