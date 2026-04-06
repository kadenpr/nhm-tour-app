import { NODES, EDGES, FLOOR_LABELS } from "../data/museumData";
import { shortestPath } from "./routing";

const NODE_MAP = {};
NODES.forEach((n) => (NODE_MAP[n.id] = n));

// Pre-build edge weight lookup for walk time calculation
const EDGE_WEIGHT = {};
EDGES.forEach(([a, b, w]) => {
  EDGE_WEIGHT[`${a}|${b}`] = w;
  EDGE_WEIGHT[`${b}|${a}`] = w;
});

/**
 * Get a compass direction string from one node to another.
 * NHM coordinate system: higher Y = south (toward Cromwell Rd entrance), higher X = east.
 */
function getDirection(fromNode, toNode) {
  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < 25 && absDy < 25) return "straight ahead";

  const dominantEW = absDx > absDy * 1.6;
  const dominantNS = absDy > absDx * 1.6;

  if (dominantEW) return dx > 0 ? "east" : "west";
  if (dominantNS) return dy > 0 ? "south" : "north";

  const ns = dy > 0 ? "south" : "north";
  const ew = dx > 0 ? "east" : "west";
  return `${ns}-${ew}`;
}

/**
 * Generate step-by-step walking directions from one node to another.
 * Returns { steps: string[], walkMinutes: number }.
 */
export function generateDirections(fromId, toId) {
  const path = shortestPath(fromId, toId, EDGES);

  if (path.length === 0) return { steps: [], walkMinutes: 0 };
  if (path.length === 1) return { steps: [], walkMinutes: 0 };

  // Total walk time along path
  let walkMinutes = 0;
  for (let i = 0; i < path.length - 1; i++) {
    walkMinutes += EDGE_WEIGHT[`${path[i]}|${path[i + 1]}`] || 2;
  }

  const steps = [];

  for (let i = 0; i < path.length - 1; i++) {
    const cur = NODE_MAP[path[i]];
    const next = NODE_MAP[path[i + 1]];
    if (!cur || !next) continue;

    // Approaching the Hintze Hall lift
    if (next.id === "lift_hintze") {
      if (next.id === toId) {
        steps.push("Head to the lift near Hintze Hall");
      } else {
        steps.push("Head to the lift near Hintze Hall");
      }
      continue;
    }

    // Departing from the Hintze Hall lift (floor change)
    if (cur.id === "lift_hintze") {
      steps.push(`Take the lift to ${FLOOR_LABELS[next.floor] || next.floor}`);
      continue;
    }

    // Earth Hall escalator to upper/lower Red Zone floors
    if (cur.id === "earth_hall" && cur.floor !== next.floor) {
      steps.push(
        `Take the escalator in Earth Hall to ${FLOOR_LABELS[next.floor] || next.floor}`
      );
      continue;
    }

    // Skip facility pass-throughs (café, shop) unless it's the destination
    if ((next.zone === "facility" || next.zone === "entrance") && next.id !== toId) {
      continue;
    }

    const dir = getDirection(cur, next);

    // Final destination
    if (next.id === toId) {
      steps.push(`${next.name} is ${dir}`);
      continue;
    }

    // Intermediate gallery
    steps.push(`Head ${dir} through ${next.name}`);
  }

  return { steps, walkMinutes };
}
