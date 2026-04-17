import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cron-triggered: scans all users' sent applications and dispatches follow-ups when due.
// Uses service role to operate across users.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get profiles with auto follow-up enabled
    const { data: profiles, error: pErr } = await admin
      .from("profiles")
      .select("user_id, follow_up_days, max_follow_ups, auto_follow_up");
    if (pErr) throw pErr;

    let processed = 0;
    let sent = 0;

    for (const p of profiles || []) {
      if (!p.auto_follow_up) continue;
      const days = p.follow_up_days ?? 5;
      const maxFu = p.max_follow_ups ?? 2;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data: apps } = await admin
        .from("applications")
        .select("id, company, role, contact_email, follow_ups_sent, last_activity_at")
        .eq("user_id", p.user_id)
        .eq("status", "sent")
        .lt("last_activity_at", cutoff)
        .lt("follow_ups_sent", maxFu);

      for (const app of apps || []) {
        processed++;
        if (!app.contact_email) continue;

        // Generate follow-up via AI gateway
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: 'Write a brief polite follow-up email. Output JSON: {"subject":"...","body":"..."}. 60-100 words.' },
              { role: "user", content: `Follow-up #${(app.follow_ups_sent || 0) + 1} for the ${app.role} role at ${app.company}. Original outreach was ${days}+ days ago with no reply.` },
            ],
            tools: [{
              type: "function",
              function: {
                name: "draft",
                parameters: { type: "object", properties: { subject: { type: "string" }, body: { type: "string" } }, required: ["subject", "body"], additionalProperties: false },
              },
            }],
            tool_choice: { type: "function", function: { name: "draft" } },
          }),
        });
        if (!aiRes.ok) {
          console.error("AI failed for app", app.id, aiRes.status);
          continue;
        }
        const aiData = await aiRes.json();
        const args = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        const draft = args ? JSON.parse(args) : null;
        if (!draft?.subject) continue;

        // Send via Resend if configured
        const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
        if (RESEND_KEY) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Outreach <onboarding@resend.dev>",
              to: [app.contact_email],
              subject: draft.subject,
              text: draft.body,
            }),
          });
        }

        await admin.from("applications").update({
          follow_ups_sent: (app.follow_ups_sent || 0) + 1,
          last_follow_up_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        }).eq("id", app.id);

        await admin.from("email_events").insert({
          user_id: p.user_id,
          application_id: app.id,
          event_type: "follow_up_sent",
          metadata: { subject: draft.subject, auto: true },
        });
        sent++;
      }
    }

    return new Response(JSON.stringify({ processed, sent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
