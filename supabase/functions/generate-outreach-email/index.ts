import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { company, role, contactName, tone = "professional", isFollowUp = false } = await req.json();
    if (!company || !role) return new Response(JSON.stringify({ error: "company and role required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Fetch user profile for personalization
    const { data: profile } = await supabase.from("profiles").select("full_name, target_roles, preferred_locations").eq("user_id", userId).single();
    const { data: links } = await supabase.from("portfolio_links").select("label, url").eq("user_id", userId);

    const userName = profile?.full_name || "the candidate";
    const portfolioText = (links || []).map((l: any) => `${l.label}: ${l.url}`).join("\n");

    const systemPrompt = `You are an expert at writing concise, personalized cold outreach emails for job applications. Tone: ${tone}. Output strict JSON: {"subject": "...", "body": "..."}. Body must be plain text, 90-150 words, no greeting placeholders, signed by ${userName}.`;

    const userPrompt = isFollowUp
      ? `Write a brief, polite FOLLOW-UP email to ${contactName || "the hiring team"} at ${company} regarding my earlier application for the ${role} role. Be respectful of their time.`
      : `Write a cold outreach email to ${contactName || "the hiring team"} at ${company} for a ${role} position. About me: ${userName}, looking for ${profile?.target_roles?.join(", ") || "engineering roles"}.${portfolioText ? `\nPortfolio:\n${portfolioText}` : ""}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "draft_email",
            description: "Return the drafted email",
            parameters: {
              type: "object",
              properties: { subject: { type: "string" }, body: { type: "string" } },
              required: ["subject", "body"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "draft_email" } },
      }),
    });

    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiRes.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : null;
    if (!parsed?.subject || !parsed?.body) {
      return new Response(JSON.stringify({ error: "Invalid AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
