import { createClient } from "@supabase/supabase-js";

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      console.error("[analytics] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
      return null;
    }
    supabase = createClient(url, key);
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

  const client = getSupabase();
  if (!client) {
    return res.status(200).json({ ok: true, warn: "Supabase not configured" });
  }

  try {
    const { error } = await client
      .from("events")
      .insert({ event, timestamp: timestamp || new Date().toISOString(), properties });

    if (error) {
      console.error("[analytics] Supabase insert error:", error.message, error.details);
    }
  } catch (err) {
    console.error("[analytics] Unexpected error:", err.message);
  }

  return res.status(200).json({ ok: true });
}
