import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/auth-provider";
import { useDemoIdentity } from "@/lib/demo-identity";
import { useAppearance } from "@/lib/appearance";
import { UserAvatar } from "./user-avatar";
import { useSettingsUrl } from "./use-settings-url";

const APPEARANCE_LABEL = { light: "light", dark: "dark", auto: "auto" } as const;

/**
 * The account menu — three bands answering three different questions:
 * who am I signed in as, where do I go and what can I change from here, and
 * how do I leave.
 *
 * The way out sits alone in the last band, for the same reason Delete does on
 * an item: you should never land on it while reaching for something else.
 */
export function AccountMenu({
  isDemo = false,
}: {
  /** In the demo the way out is "Exit demo", not "Sign Out". */
  isDemo?: boolean;
}) {
  const navigate = useNavigate();
  const { user, profile, currentUser, signOut } = useAuth();
  const { appearance, cycleAppearance } = useAppearance();
  const { openSettings } = useSettingsUrl();

  const demo = useDemoIdentity();
  const name = isDemo ? demo.name : currentUser.name;
  /**
   * In the demo this is the one place, once, where the demo says what it is.
   *
   * It used to read "Guest 843 / Not signed in" — auth chrome telling a visitor
   * they are logged out of something they never tried to log into, and a
   * generated guest number that means nothing. Everything in the demo works;
   * the only thing worth saying is the one thing that differs.
   * See docs/design/demo-and-seed.md rules 4 and 7.
   */
  const secondLine = isDemo
    ? "Demo — resets when you reload"
    : profile?.email ?? user?.email ?? "Not signed in";

  const handleLeave = useCallback(async () => {
    if (isDemo) {
      navigate("/");
      return;
    }
    await signOut();
    navigate("/login", { replace: true });
  }, [isDemo, navigate, signOut]);

  const handleSettings = useCallback(() => openSettings("account"), [openSettings]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* The accessible name is the job — "Account Menu" — not the person's
            name, because a screen reader already reads the name written inside. */}
        <button
          type="button"
          aria-label="Account Menu"
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
        >
          <UserAvatar
            userId={user?.id ?? currentUser.id}
            name={name}
            photoUrl={currentUser.avatarUrl}
            colorOverride={profile?.avatar_color}
            size={28}
            nameIsWritten
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {secondLine}
            </span>
          </span>
          <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-64">
        {/* Band 1 — who am I signed in as. The tick answers "which one am I in". */}
        <DropdownMenuItem onSelect={handleSettings} className="flex items-start gap-2">
          <IconCheck className="mt-0.5 size-4 shrink-0" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm">{name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {secondLine}
            </span>
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Band 2 — where do I go, and what can I change from here. */}
        <DropdownMenuItem onSelect={handleSettings}>Settings</DropdownMenuItem>
        <DropdownMenuItem
          // Cycling must not close the menu: the page changes behind it, so you
          // look, judge, and click again until it is right.
          onSelect={(event) => {
            event.preventDefault();
            cycleAppearance();
          }}
          className="justify-between"
        >
          <span>Appearance</span>
          <span className="text-xs text-muted-foreground">
            {APPEARANCE_LABEL[appearance]}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Band 3 — how do I leave. Alone, on purpose. */}
        <DropdownMenuItem onSelect={() => void handleLeave()}>
          {isDemo ? "Exit demo" : "Sign Out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
