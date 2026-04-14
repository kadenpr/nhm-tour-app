import { createClient } from "@supabase/supabase-js";

let supabase = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }
  return supabase;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { event, timestamp, ...properties } = req.body || {};
  if (!event) {
    return res.status(400).json({ error: "Missing event name" });
  }

  try {
    const { error } = await getSupabase()
      .from("events")
      .insert({ event, timestamp, properties });

    if (error) throw error;
  } catch (err) {
    // Log but don't fail the request — analytics should never break the app
    console.error("[analytics]", err.message);
  }

  return res.status(200).json({ ok: true });
}
