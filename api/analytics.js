/**
 * Server-side analytics receiver.
 * Logs events to stdout for now — swap out for Supabase / Google Sheets
 * by replacing the console.log with an insert/append call.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const event = req.body || {};
  if (!event.event) {
    return res.status(400).json({ error: "Missing event name" });
  }

  // Structured log — parseable by any log aggregator
  console.log(JSON.stringify({ type: "analytics", ...event }));

  return res.status(200).json({ ok: true });
}
