import type { ComponentType } from "react";
import {
  Add,
  Chat,
  FaceAdd,
  Document,
  Checkmark,
  CheckmarkFilled,
  TaskComplete,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Close,
  Code,
  TrashCan,
  Edit,
  Notebook,
  Folder,
  TextBold,
  TextItalic,
  ListBulleted,
  ListNumbered,
  Quotes,
  TextStrikethrough,
  TextUnderline,
  UserMultiple,
  SubtractLarge,
  Link,
  Copy,
  Logout,
  Tag,
  Send,
  Menu,
  Search,
  Pin,
  PinFilled,
  OverflowMenuVertical,
  OverflowMenuHorizontal,
  Table,
  TextScale,
  TextHighlight,
  Image,
  Filter,
  ArrowUp,
  ArrowDown,
  Apps,
  At,
  Share,
} from "@carbon/icons-react";
import { cn } from "@/lib/utils";

/**
 * Icon — IBM Carbon icons (SVG), the set the editor actually ships.
 *
 * The bundle's iconIds are Carbon names (`pin--filled`, `chevron--left--small`,
 * `overflow-menu--vertical`, `add--alt`, `checkmark--filled`/`--outline`), so
 * these are adapted 1:1 to `@carbon/icons-react` components — crisp
 * geometric SVGs (not the flat Material Symbols font), with **filled vs outline
 * variants** for depth (pinned → PinFilled, active → filled). Icons inherit
 * `currentColor`, so `text-muted-foreground` etc. still colours them.
 *
 * `name` keeps our existing iconId strings so call sites are unchanged.
 */
type CarbonIcon = ComponentType<{ size?: number | string; className?: string }>;

const ICONS: Record<string, CarbonIcon> = {
  // nav / lenses
  article: Document,
  notes: Notebook,
  edit_note: Notebook,
  group: UserMultiple,
  folder: Folder,
  sell: Tag,
  delete: TrashCan,
  // chrome
  add: Add,
  search: Search,
  close: Close,
  edit: Edit,
  logout: Logout,
  menu: Menu,
  chevron_left: ChevronLeft,
  chevron_down: ChevronDown,
  chevron_right: ChevronRight,
  left_panel_close: Menu,
  link: Link,
  content_copy: Copy,
  send: Send,
  // pin — filled/outline for depth (pin / pin--filled)
  pin: Pin,
  "pin--filled": PinFilled,
  "overflow-menu--vertical": OverflowMenuVertical,
  "overflow-menu--horizontal": OverflowMenuHorizontal,
  // comments / chat
  add_comment: Chat,
  add_reaction: FaceAdd,
  chat: Chat,
  chat_bubble_outline: Chat,
  message: Chat,
  check: Checkmark,
  check_circle: CheckmarkFilled,
  checklist: TaskComplete,
  // editor toolbar
  code: Code,
  code_blocks: Code,
  format_bold: TextBold,
  format_italic: TextItalic,
  format_underlined: TextUnderline,
  format_strikethrough: TextStrikethrough,
  ink_highlighter: TextHighlight,
  image: Image,
  format_list_bulleted: ListBulleted,
  format_list_numbered: ListNumbered,
  format_quote: Quotes,
  horizontal_rule: SubtractLarge,
  table: Table,
  // Carbon has no per-level heading glyph; the slash menu labels ("Heading 1"…)
  // carry the level, the icon just signals "heading".
  format_h1: TextScale,
  format_h2: TextScale,
  format_h3: TextScale,
  format_h4: TextScale,
  // sort/filter/view-mode/mention
  filter: Filter,
  arrow_upward: ArrowUp,
  arrow_downward: ArrowDown,
  apps: Apps,
  alternate_email: At,
  share: Share,
};

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export function Icon({ name, className, size = 20 }: IconProps) {
  const Glyph = ICONS[name];
  if (!Glyph) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[Icon] no Carbon mapping for "${name}"`);
    }
    return null;
  }
  return <Glyph size={size} className={cn("shrink-0", className)} />;
}
