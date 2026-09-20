/**
 * StylePack type + default pack for the base starter.
 *
 * The type is the contract between the Lovable platform (TDP, codegen,
 * designer tooling) and the template. Each starter exports one `stylePack`.
 *
 * Runtime values live in `style-pack.css` (color tokens, font families,
 * font weights) and `index.html` (font <link> URLs). This TS object is
 * the typed canonical reference — swap it when forking to a new starter.
 *
 * Font weights are NOT in this type — they flow through CSS vars
 * (--font-heading-weight, --font-body-weight) and are overridden at
 * runtime via the TDP postMessage listener (lovable-customization.js).
 */
export interface StylePack {
  label: string;
  /** Representative hex for swatch preview. */
  previewColor: string;
  /** 4-color preview row (used by pack-pickers in tooling). */
  colors: [string, string, string, string];
  /** Full shadcn-compatible token set. Values are complete color strings
   *  (oklch(...) or hex). Mapped to bare CSS vars (--background, --primary,
   *  etc.) which @theme inline resolves to --color-* for Tailwind. */
  colorTokens: {
    primary: string;
    primaryForeground: string;
    background: string;
    foreground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    sidebar?: string;
    sidebarForeground?: string;
    sidebarPrimary?: string;
    sidebarPrimaryForeground?: string;
    sidebarAccent?: string;
    sidebarAccentForeground?: string;
    sidebarBorder?: string;
    sidebarRing?: string;
  };
  /** Heading + body font families. Loaded via index.html <link> tag. */
  font: {
    heading: { family: string; url: string };
    body: { family: string; url: string };
  };
}

const interUrl =
  "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap";

/**
 * Editor pack — the editor starter's default.
 *
 * A clean document surface: the CTA color as primary, soft/strong black-alpha
 * surfaces, Google Sans Flex for headings + body. Values mirror
 * style-pack.css (:root/.dark), which is the runtime source of truth; this
 * object is the typed canonical reference for platform tooling. Overridable
 * via the StylePack contract.
 */
export const stylePack: StylePack = {
  label: "Editor",
  previewColor: "#ff4137",
  colors: ["#ff4137", "#ffffff", "#1a1a1a", "#8c8c8c"],
  colorTokens: {
    primary: "rgba(26, 26, 26, 1)",
    primaryForeground: "rgba(255, 255, 255, 1)",
    background: "rgba(255, 255, 255, 1)",
    foreground: "rgba(0, 0, 0, 1)",
    secondary: "rgba(0, 0, 0, 0.05)",
    secondaryForeground: "rgba(0, 0, 0, 1)",
    accent: "rgba(0, 0, 0, 0.05)",
    accentForeground: "rgba(0, 0, 0, 1)",
    muted: "rgba(0, 0, 0, 0.03)",
    mutedForeground: "rgba(0, 0, 0, 0.55)",
    card: "rgba(255, 255, 255, 1)",
    cardForeground: "rgba(0, 0, 0, 1)",
    popover: "rgba(255, 255, 255, 1)",
    popoverForeground: "rgba(0, 0, 0, 1)",
    destructive: "rgba(216, 32, 32, 1)",
    destructiveForeground: "rgba(255, 255, 255, 1)",
    border: "rgba(0, 0, 0, 0.05)",
    input: "rgba(0, 0, 0, 0.12)",
    ring: "rgba(5, 88, 249, 0.25)",
  },
  font: {
    heading: { family: "Inter Display", url: interUrl },
    body: { family: "Inter", url: interUrl },
  },
};

export default stylePack;
