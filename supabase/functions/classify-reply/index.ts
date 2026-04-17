import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Classifies pasted reply text into: positive, interview_request, rejection, neutral
// User pastes the reply email body (until inbox OAuth is wired up).
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

    const { applicationId, replyText } = await req.json();
    if (!applicationId || !replyText) return new Response(JSON.stringify({ error: "applicationId and replyText required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Classify a recruiter reply into one category and provide a 1-sentence summary." },
          { role: "user", content: `Reply:\n"""${replyText.slice(0, 4000)}"""` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "classify",
            parameters: {
              type: "object",
              properties: {
                category: { type: "string", enum: ["interview", "replied", "rejected"] },
                summary: { type: "string" },
              },
              required: ["category", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "classify" } },
      }),
    });

    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiRes.ok) return new Response(JSON.stringify({ error: "AI failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const data = await aiRes.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const result = args ? JSON.parse(args) : null;
    if (!result?.category) return new Response(JSON.stringify({ error: "Invalid AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    await supabase.from("applications").update({
      status: result.category,
      last_activity_at: new Date().toISOString(),
      notes: result.summary,
    }).eq("id", applicationId).eq("user_id", userId);

    await supabase.from("email_events").insert({
      user_id: userId,
      application_id: applicationId,
      event_type: "classified",
      metadata: result,
    });

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
