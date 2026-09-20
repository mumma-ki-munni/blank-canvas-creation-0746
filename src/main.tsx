import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./base.css";
import "./style-pack.css";
import { applyAppearance, readAppearance } from "@/lib/appearance";

// Paint the saved appearance before the first render so nothing flashes.
applyAppearance(readAppearance());

createRoot(document.getElementById("root")!).render(<App />);
