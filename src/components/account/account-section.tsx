import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth/auth-provider";
import { useDemoIdentity, setDemoIdentity } from "@/lib/demo-identity";
import { AVATAR_ACCEPT, AVATAR_LIMITS_TEXT } from "@/lib/avatar";
import { UserAvatar } from "./user-avatar";

/**
 * Settings › Account. The photo sits at the top, above the name, because this
 * section is where the account is described and a face is part of describing
 * it.
 *
 * The avatar itself is the control, and a button beside it says what it does.
 * Both open the same file picker.
 */
export function AccountSection() {
  const { user, profile, currentUser, updateProfile, uploadAvatar } = useAuth();
  const { pathname } = useLocation();
  const isDemo = pathname.toLowerCase().startsWith("/demo");
  const demo = useDemoIdentity();

  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(isDemo ? demo.name : profile?.display_name ?? "");
  const [seeded, setSeeded] = useState(profile?.id ?? null);
  const [busy, setBusy] = useState(false);

  // Seed the field once the profile arrives, without an effect.
  if (profile && seeded !== profile.id) {
    setSeeded(profile.id);
    setName(profile.display_name ?? "");
  }

  const photoUrl = isDemo ? demo.avatarUrl : profile?.avatar_url ?? null;

  const pickPhoto = useCallback(() => fileRef.current?.click(), []);

  const handleFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Let the same file be chosen twice in a row.
      event.target.value = "";
      if (!file) return;
      setBusy(true);
      try {
        await uploadAvatar(file);
        toast.success("Photo updated");
      } catch {
        // A failed upload says so and leaves the old photo alone.
        toast.error("Couldn't upload that photo. Your old one is still there.");
      } finally {
        setBusy(false);
      }
    },
    [uploadAvatar],
  );

  const handleRemovePhoto = useCallback(async () => {
    setBusy(true);
    try {
      await updateProfile({ avatar_url: null });
    } catch {
      toast.error("Couldn't remove that photo. Try again.");
    } finally {
      setBusy(false);
    }
  }, [updateProfile]);

  const handleSaveName = useCallback(async () => {
    setBusy(true);
    try {
      // The demo has no profile row to write to, so it keeps its own name.
      // It still really saves — the account menu at the foot of the drawer
      // reads the same store and updates with it.
      if (isDemo) setDemoIdentity({ name: name.trim() });
      else await updateProfile({ display_name: name.trim() });
      toast.success("Name saved");
    } catch {
      toast.error("Couldn't save your name. Try again.");
    } finally {
      setBusy(false);
    }
  }, [isDemo, name, updateProfile]);

  const nameChanged =
    name.trim() !== (isDemo ? demo.name : profile?.display_name ?? "").trim();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Label>Photo</Label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={pickPhoto}
            disabled={busy}
            aria-label="Change photo"
            className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <UserAvatar
              userId={user?.id}
              name={currentUser.name}
              photoUrl={photoUrl}
              colorOverride={profile?.avatar_color}
              size={64}
              nameIsWritten
            />
          </button>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={pickPhoto}
                disabled={busy}
              >
                Change photo
              </Button>

              {/* Remove is offered only when there is a photo, and it drops
                  back to the initials — never to an empty circle. */}
              {photoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleRemovePhoto()}
                  disabled={busy}
                >
                  Remove photo
                </Button>
              )}
            </div>

            {/* The limits are written next to the control, not discovered by failing. */}
            <p className="text-xs text-muted-foreground">{AVATAR_LIMITS_TEXT}</p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept={AVATAR_ACCEPT}
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="account-name">Name</Label>
        <div className="flex items-center gap-2">
          <Input
            id="account-name"
            value={name}
            placeholder="Your name"
            onChange={(event) => setName(event.target.value)}
          />
          <Button
            onClick={() => void handleSaveName()}
            disabled={!nameChanged || busy}
          >
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your initials come from this name when you have no photo.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Email</Label>
        <p className="text-sm text-foreground">
          {profile?.email ?? user?.email ?? "—"}
        </p>
      </div>
    </div>
  );
}
