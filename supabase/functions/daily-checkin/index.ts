import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active users with push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("user_id")

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No subscriptions" }), {
        headers: { "Content-Type": "application/json" }
      })
    }

    // Get unique user IDs
    const userIds = [...new Set(subscriptions.map(s => s.user_id))]

    // Get user languages
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, language")
      .in("id", userIds)

    const langMap: Record<string, string> = {}
    ;(profiles || []).forEach(p => { langMap[p.id] = p.language || 'en' })

    // Send push to each user
    const results = await Promise.allSettled(
      userIds.map(async (userId) => {
        const lang = langMap[userId] || 'en'
        const title = lang === 'es' ? '📋 Registro de trabajo' : '📋 Work Log'
        const body = lang === 'es'
          ? '¿En qué propiedad trabajaste hoy? Toca para registrar tu día.'
          : 'Which property did you work on today? Tap to log your day.'

        // Use the send-push-notification function
        const resp = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
            },
            body: JSON.stringify({
              user_id: userId,
              title,
              body,
              url: "/worklog"
            })
          }
        )
        return resp.status
      })
    )

    return new Response(JSON.stringify({ results }), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
