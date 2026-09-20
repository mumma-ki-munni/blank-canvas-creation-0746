import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  "https://ollicmdvyhpfrhszlgxv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbGljbWR2eWhwZnJoc3psZ3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTIzODUsImV4cCI6MjEwMDEyODM4NX0.2EDO6c8j-YukMjtydP-SFX3hXjn6Hbkkc21FHUG91w8";

const supabaseEnvPlugin = () => ({
  name: "lovable-supabase-env",
  transform(code: string, id: string) {
    if (!id.endsWith("/src/integrations/supabase/client.ts")) return null;

    return code
      .replaceAll("import.meta.env.VITE_SUPABASE_URL", JSON.stringify(SUPABASE_URL))
      .replaceAll(
        "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY",
        JSON.stringify(SUPABASE_PUBLISHABLE_KEY),
      );
  },
});

export default defineConfig(({ mode }) => ({
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_PUBLISHABLE_KEY),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
      process.env.VITE_SUPABASE_PROJECT_ID,
    ),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [supabaseEnvPlugin(), react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
