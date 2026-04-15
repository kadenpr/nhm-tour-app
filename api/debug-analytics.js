import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    return res.status(200).json({
      status: "missing_env",
      hasUrl: !!url,
      hasKey: !!key,
    });
  }

  try {
    const supabase = createClient(url, key);
    const { error } = await supabase
      .from("events")
      .insert({ event: "debug_test", timestamp: new Date().toISOString(), properties: {} });

    if (error) {
      return res.status(200).json({ status: "insert_failed", error: error.message, details: error.details });
    }

    return res.status(200).json({ status: "ok", message: "Row inserted successfully" });
  } catch (err) {
    return res.status(200).json({ status: "exception", error: err.message });
  }
}
