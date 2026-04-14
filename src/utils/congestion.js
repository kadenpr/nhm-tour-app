/**
 * Congestion simulation model for NHM Tour App.
 *
 * Busyness for each gallery is estimated from two factors:
 *   1. Inherent popularity (based on known NHM visitor patterns)
 *   2. Time of day (NHM is busiest 11am–2pm)
 *
 * Combined into a congestion score 0–1 per node.
 */

// Inherent popularity scores (0–1). Entrances and facilities are excluded.
export const POPULARITY_SCORES = {
  // Very popular
  dinosaurs: 0.95,
  hintze_hall: 0.90,
  // Popular
  human_evolution: 0.72,
  creepy_crawlies: 0.70,
  investigate: 0.65,
  earth_hall: 0.65,
  volcanoes: 0.60,
  // Moderate
  mammals: 0.52,
  human_biology: 0.50,
  the_vault: 0.50,
  treasures: 0.48,
  minerals: 0.44,
  birds: 0.44,
  fishes: 0.42,
  fossil_marine: 0.38,
  earths_treasury: 0.38,
  from_beginning: 0.38,
  darwin_centre: 0.36,
  cocoon: 0.34,
  restless_surface: 0.33,
  giant_sequoia: 0.32,
  // Quiet
  east_pavilion: 0.28,
  lasting_imp: 0.28,
  waterhouse: 0.27,
  attenborough: 0.26,
  jerwood: 0.24,
  images_of_nature: 0.23,
  marine_inverts: 0.22,
  zoology_spirit: 0.18,
  wildlife_garden: 0.16,
};

/**
 * Time-of-day multiplier (0–1). NHM opens 10am, closes 5:50pm.
 * Peak congestion: 11am–2pm.
 * @param {number} hour - 0–23
 */
export function getTimeOfDayFactor(hour) {
  if (hour < 10 || hour >= 18) return 0.10;
  if (hour < 11) return 0.30 + (hour - 10) * 0.45;  // 10–11: 0.30 → 0.75
  if (hour < 12) return 0.75 + (hour - 11) * 0.15;  // 11–12: 0.75 → 0.90
  if (hour < 14) return 0.90 + (hour - 12) * 0.05;  // 12–14: 0.90 → 1.00
  if (hour < 16) return 1.00 - (hour - 14) * 0.20;  // 14–16: 1.00 → 0.60
  return 0.60 - (hour - 16) * 0.12;                 // 16–18: 0.60 → 0.36
}

/**
 * Combined congestion score (0–1) for a given node and hour.
 * Returns 0 for nodes without a popularity score (entrances, facilities).
 */
export function getCongestionScore(nodeId, hour) {
  const pop = POPULARITY_SCORES[nodeId];
  if (pop === undefined) return 0;
  const timeFactor = getTimeOfDayFactor(hour);
  return Math.min(1, pop * (0.35 + timeFactor * 0.75));
}

/**
 * Compute congestion scores for all nodes at the given hour.
 * Defaults to the current local hour.
 * @param {number} [hour]
 * @returns {Record<string, number>}
 */
export function getAllCongestionScores(hour = new Date().getHours()) {
  const scores = {};
  for (const id of Object.keys(POPULARITY_SCORES)) {
    scores[id] = getCongestionScore(id, hour);
  }
  return scores;
}

/** Returns "low" | "moderate" | "high" */
export function getCongestionLevel(score) {
  if (score < 0.40) return "low";
  if (score < 0.68) return "moderate";
  return "high";
}

/** Returns green / amber / red hex color */
export function getCongestionColor(score) {
  if (score < 0.40) return "#22863a";   // green
  if (score < 0.68) return "#C67A1E";   // amber
  return "#B03028";                      // red
}

/**
 * Applies congestion penalties to EDGES so Dijkstra naturally prefers quieter paths.
 * Traversing a node with score 1.0 adds up to CONGESTION_WEIGHT extra minutes.
 * @param {Array} edges - original EDGES array from museumData
 * @param {Record<string, number>} scores
 * @returns {Array}
 */
const CONGESTION_WEIGHT = 7; // max extra minutes for the busiest gallery

export function getCongestionEdges(edges, scores) {
  return edges.map(([a, b, w]) => {
    const avgScore = ((scores[a] || 0) + (scores[b] || 0)) / 2;
    return [a, b, w + avgScore * CONGESTION_WEIGHT];
  });
}

/**
 * Builds the congestion section for the Claude prompt.
 * @param {Record<string, number>} scores
 * @param {number} hour
 * @returns {string}
 */
export function getCongestionPromptSection(scores, hour) {
  const busy = [];
  const moderate = [];

  for (const [id, score] of Object.entries(scores)) {
    const level = getCongestionLevel(score);
    if (level === "high") busy.push(id);
    else if (level === "moderate") moderate.push(id);
  }

  const timeDesc =
    hour < 11 ? "early morning (relatively quiet)"
    : hour < 14 ? "midday — peak visitor hours"
    : hour < 16 ? "early afternoon (moderately busy)"
    : "late afternoon (winding down)";

  return `CURRENT CONGESTION (${timeDesc}):
- High congestion right now: ${busy.length ? busy.join(", ") : "none"}
- Moderate congestion: ${moderate.length ? moderate.join(", ") : "none"}
- Quiet galleries: all others

Factor this into your route and tips — prefer less-crowded alternatives where interests allow, and warn visitors about busy galleries in your narrative or tips.`;
}
