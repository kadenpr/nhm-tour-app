const KEY = "nhm_ticket";

export function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function loadTicket() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTicket(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function updateTicket(patch) {
  const current = loadTicket();
  if (current) saveTicket({ ...current, ...patch });
}

export function clearTicket() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

/**
 * Returns:
 *  "valid"    – ticket exists and is for today
 *  "expired"  – ticket exists but from a previous day
 *  "completed"– ticket was explicitly finished
 *  null       – no ticket saved
 */
export function ticketStatus(ticket) {
  if (!ticket) return null;
  if (ticket.completed) return "completed";
  if (ticket.date !== todayStr()) return "expired";
  return "valid";
}
