import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AccountSection } from "./account-section";
import { SETTINGS_SECTIONS, useSettingsUrl } from "./use-settings-url";

/**
 * Settings — a place with its own address, reached from the account menu and
 * nowhere else.
 *
 * The list of sections and the content are two surfaces, not one sheet: the
 * list sits a shade back with a hairline between them. The shade is a
 * percentage of the text colour, not a fixed grey, because a fixed grey is
 * wrong in one of the two themes.
 */
export function SettingsDialog() {
  const { section, isOpen, openSettings, closeSettings } = useSettingsUrl();

  const active = section ?? "account";
  const activeLabel =
    SETTINGS_SECTIONS.find((entry) => entry.id === active)?.label ?? "Account";

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && closeSettings()}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <DialogDescription className="sr-only">
          Your account and app preferences.
        </DialogDescription>

        <div className="flex min-h-[26rem] flex-col sm:flex-row">
          <nav
            aria-label="Settings sections"
            className="flex shrink-0 flex-col gap-1 border-b border-border p-3 sm:w-52 sm:border-b-0 sm:border-r"
            style={{
              background:
                "color-mix(in srgb, var(--color-foreground) 5%, var(--color-card))",
            }}
          >
            <DialogTitle className="px-2 pb-2 pt-1 text-sm font-semibold text-foreground">
              Settings
            </DialogTitle>

            {SETTINGS_SECTIONS.map((entry) => {
              const isActive = entry.id === active;
              return (
                <button
                  key={entry.id}
                  type="button"
                  // Drawn AND announced.
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => openSettings(entry.id)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    isActive
                      ? "bg-card font-medium text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {entry.label}
                </button>
              );
            })}
          </nav>

          <div className="min-w-0 flex-1 overflow-y-auto bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">
              {activeLabel}
            </h2>
            <div className="mt-6">
              <AccountSection />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
