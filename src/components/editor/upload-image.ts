import { supabase } from "@/integrations/supabase/client";

/**
 * Upload an image file to the `note-images` bucket and return a URL usable in
 * an <img src>. Bucket is private (workspace disallows public buckets), so we
 * hand back a long-lived signed URL. On failure we throw — callers surface it.
 */
export async function uploadNoteImage(file: File, notepadId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guest / local demo (e.g. /demo): no Storage write access. Embed the image
  // as a data URL so the public demo editor still supports images. `allowBase64`
  // on the Image extension lets these render.
  if (!user) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error ?? new Error("Image read failed"));
      reader.readAsDataURL(file);
    });
  }

  const path = `${user.id}/${notepadId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("note-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;

  // 10 years — effectively permanent for note bodies.
  const { data, error } = await supabase.storage
    .from("note-images")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (error || !data?.signedUrl) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}
