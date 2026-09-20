// Edge function: send-invite
// Verifies the caller, then either adds an existing user directly to notepad_members
// or sends a Supabase auth invite email (magic link) to a brand-new email.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APP_URL = Deno.env.get("APP_URL") ?? "https://notepad-template.lovable.app";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { error: "unauthorized" });

    // User-scoped client to identify the caller
    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData.user) return json(401, { error: "unauthorized" });
    const caller = userData.user;

    // Parse and validate body
    let body: { email?: unknown; role?: unknown; notepadId?: unknown };
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "invalid_json" });
    }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body.role === "editor" || body.role === "viewer" ? body.role : null;
    const notepadId = typeof body.notepadId === "string" ? body.notepadId : "";
    if (!email || !role || !notepadId) return json(400, { error: "invalid_body" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "invalid_email" });

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Authorization: caller must be an owner or editor of the notepad
    const { data: membership, error: memErr } = await supabaseAdmin
      .from("notepad_members")
      .select("role")
      .eq("notepad_id", notepadId)
      .eq("user_id", caller.id)
      .maybeSingle();
    if (memErr) {
      console.error("membership check failed", memErr);
      return json(500, { error: "server_error" });
    }
    if (!membership || (membership.role !== "owner" && membership.role !== "editor")) {
      return json(403, { error: "forbidden" });
    }

    // Create pending invite row
    const { data: inviteRow, error: inviteErr } = await supabaseAdmin
      .from("notepad_invites")
      .insert({
        notepad_id: notepadId,
        email,
        role,
        invited_by: caller.id,
      })
      .select("id")
      .single();
    if (inviteErr) {
      console.error("insert invite failed", inviteErr);
      return json(500, { error: "invite_insert_failed" });
    }

    // Look up existing user by email via profiles table (O(1))
    let existingUserId: string | null = null;
    const { data: profileMatch, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (profileErr) {
      console.error("profile lookup failed", profileErr);
    } else if (profileMatch) {
      existingUserId = profileMatch.id;
    }

    if (existingUserId) {
      // Add directly as member
      const { error: addErr } = await supabaseAdmin
        .from("notepad_members")
        .insert({ notepad_id: notepadId, user_id: existingUserId, role });
      if (addErr && addErr.code !== "23505") {
        console.error("add member failed", addErr);
        return json(500, { error: "add_member_failed" });
      }

      // Mark invite accepted
      await supabaseAdmin
        .from("notepad_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", inviteRow.id);

      return json(200, { status: "added", userId: existingUserId });
    }

    // Send Supabase built-in invite email
    const redirectTo = `${APP_URL}/session/${notepadId}`;
    const { error: inviteEmailErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });
    if (inviteEmailErr) {
      console.error("inviteUserByEmail failed", inviteEmailErr);
      return json(502, { error: "invite_email_failed", message: inviteEmailErr.message });
    }

    return json(200, { status: "invited" });
  } catch (err) {
    console.error("send-invite error", err);
    return json(500, { error: "server_error" });
  }
});
