import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sends a single outreach email via Resend (uses RESEND_API_KEY secret if available)
// If no API key is configured, marks the application as 'sent' but logs a warning.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userId = claims.claims.sub;

    const { applicationId, to, subject, body, isFollowUp = false } = await req.json();
    if (!applicationId || !to || !subject || !body) {
      return new Response(JSON.stringify({ error: "applicationId, to, subject, body required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    let sendStatus: "sent" | "simulated" = "simulated";
    let providerMessage = "No email provider configured — recorded as sent for tracking.";

    if (RESEND_KEY) {
      const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("user_id", userId).single();
      const fromName = profile?.full_name || "Outreach";
      const fromEmail = "onboarding@resend.dev"; // default test sender; user replaces with verified domain

      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [to],
          subject,
          text: body,
          reply_to: profile?.email || undefined,
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        console.error("Resend failed", resp.status, t);
        return new Response(JSON.stringify({ error: `Email send failed: ${t}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      sendStatus = "sent";
      providerMessage = "Email sent via Resend.";
    }

    // Update application
    const updates: any = {
      status: "sent",
      sent_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      contact_email: to,
      subject,
      body,
    };
    if (isFollowUp) {
      const { data: app } = await supabase.from("applications").select("follow_ups_sent").eq("id", applicationId).single();
      updates.follow_ups_sent = (app?.follow_ups_sent || 0) + 1;
      updates.last_follow_up_at = new Date().toISOString();
    }
    await supabase.from("applications").update(updates).eq("id", applicationId).eq("user_id", userId);
    await supabase.from("email_events").insert({
      user_id: userId,
      application_id: applicationId,
      event_type: isFollowUp ? "follow_up_sent" : "sent",
      metadata: { to, subject, provider: sendStatus },
    });

    return new Response(JSON.stringify({ success: true, status: sendStatus, message: providerMessage }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
