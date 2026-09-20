import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { fileToAvatarDataUrl } from "@/lib/avatar-file";


interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_color: string;
}

interface CurrentUser {
  id: string;
  name: string;
  color: string;
  avatarUrl: string | null;
  isGuest: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  // NOTE: there are deliberately no signInWithGoogle / signInWithApple helpers here.
  // OAuth goes through the Lovable managed broker inside <SocialAuthButtons>, which is
  // the ONE brand-compliant SSO surface. Two ways to start OAuth is how the hand-rolled
  // off-brand buttons crept back in. See docs/design/auth.md.
  signOut: () => Promise<void>;
  currentUser: CurrentUser;
  /** Save the display name, or clear the photo. */
  updateProfile: (input: {
    display_name?: string;
    avatar_url?: string | null;
  }) => Promise<void>;
  /**
   * Put a photo on the top rung of the avatar ladder. Resolves to its URL, or
   * throws — a failed upload leaves the old photo alone.
   */
  uploadAvatar: (file: File) => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function useCurrentUser(): CurrentUser {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useCurrentUser must be inside AuthProvider");
  return ctx.currentUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Stable guest identity — created once, shared across all consumers
  const [guest] = useState(() => ({
    id: crypto.randomUUID(),
    name: `Guest ${Math.floor(Math.random() * 1000)}`,
    color: "#808080",
  }));

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(
    async (input: { display_name?: string; avatar_url?: string | null }) => {
      if (!user) return;
      // Only the two fields a person owns, normalised and bounded. Anything
      // else (email, id, colour) is decided by the server.
      const patch: { display_name?: string; avatar_url?: string | null } = {};
      if (input.display_name !== undefined) {
        patch.display_name = input.display_name.trim().slice(0, 80);
      }
      if (input.avatar_url !== undefined) {
        const url = input.avatar_url;
        if (url !== null && !url.startsWith("data:image/")) {
          throw new Error("Unsupported image");
        }
        patch.avatar_url = url;
      }
      if (Object.keys(patch).length === 0) return;
      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id);
      if (error) throw error;

      // The new photo has to appear everywhere at once — the menu trigger
      // included — without a reload.
      await loadProfile(user.id);
    },
    [loadProfile, user],
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) throw new Error("Not signed in");

      // Shrunk in the browser and kept on the profile row itself. There is no
      // file bucket: this workspace does not allow public ones, and a link that
      // expires would leave a face missing later.
      const dataUrl = await fileToAvatarDataUrl(file);

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: dataUrl })
        .eq("id", user.id);
      if (error) throw error;

      await loadProfile(user.id);
      return dataUrl;
    },
    [loadProfile, user],
  );

  const currentUser: CurrentUser = useMemo(() => {
    if (user && profile) {
      return {
        id: user.id,
        name: profile.display_name ?? profile.email.split("@")[0],
        color: profile.avatar_color,
        avatarUrl: profile.avatar_url,
        isGuest: false,
      };
    }
    return { ...guest, avatarUrl: null, isGuest: true };
  }, [user, profile, guest]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      currentUser,
      updateProfile,
      uploadAvatar,
    }),
    [
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      currentUser,
      updateProfile,
      uploadAvatar,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
