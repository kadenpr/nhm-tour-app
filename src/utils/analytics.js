/**
 * Lightweight analytics for NHM Tour App.
 *
 * Events are stored in localStorage (capped at MAX_EVENTS) and
 * fire-and-forget POSTed to /api/analytics so the server can log them.
 *
 * Events tracked:
 *   session_start            — app loaded
 *   questionnaire_completed  — visitor submitted preferences
 *   route_generated          — initial route returned from Claude
 *   follow_up_submitted      — visitor submitted skip/add gems choices
 *   route_refined            — refined route returned from Claude
 *   journey_started          — visitor pressed "Start Journey"
 *   journey_stop_arrived     — visitor tapped "I'm here"
 *   journey_next             — visitor advanced to next stop
 *   journey_completed        — visitor reached the last stop
 *   journey_abandoned        — visitor pressed "Exit Journey" before last stop
 *   route_shared             — visitor copied share link
 *   route_saved              — visitor saved route to My Routes
 */

const STORAGE_KEY = "nhm_analytics";
const MAX_EVENTS = 500;

/**
 * Track an event with optional properties.
 * @param {string} name
 * @param {Record<string, unknown>} [properties]
 */
export function trackEvent(name, properties = {}) {
  const event = {
    event: name,
    timestamp: new Date().toISOString(),
    ...properties,
  };

  // Persist locally
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    stored.push(event);
    if (stored.length > MAX_EVENTS) stored.splice(0, stored.length - MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage unavailable or quota exceeded — silently skip
  }

  // Fire-and-forget to server
  try {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => {}); // ignore network errors
  } catch {
    // fetch unavailable — silently skip
  }
}

/**
 * Read all stored events from localStorage.
 * @returns {Array}
 */
export function getStoredEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
