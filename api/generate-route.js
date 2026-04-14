import Anthropic from "@anthropic-ai/sdk";
import { NODES } from "../src/data/museumData.js";
import { checkRateLimit } from "./_rateLimit.js";
import { getAllCongestionScores, getCongestionPromptSection } from "../src/utils/congestion.js";

const ENTRANCE_NAMES = {
  entrance_cromwell: "Cromwell Road (main south)",
  entrance_queens: "Queen's Gate (west)",
  entrance_exhibition: "Exhibition Road (east)",
};

// ── Response cache ────────────────────────────────────────────────────────────
// Keyed by (normalised answers + hour) so congestion stays fresh each hour.
const routeCache = new Map();
const MAX_CACHE_SIZE = 50;

function getCacheKey(answers, hour) {
  return JSON.stringify({
    entrance: answers.entrance,
    duration: answers.duration,
    interests: [...(answers.interests || [])].sort(),
    group: answers.group,
    visitStyle: answers.visitStyle,
    accessibility: answers.accessibility,
    specificExhibits: (answers.specificExhibits || "").trim().toLowerCase(),
    specialRequests: (answers.specialRequests || "").trim().toLowerCase(),
    hour,
  });
}

function cacheGet(key) {
  return routeCache.get(key) || null;
}

function cacheSet(key, value) {
  if (routeCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry
    routeCache.delete(routeCache.keys().next().value);
  }
  routeCache.set(key, value);
}

// ── Node filtering ────────────────────────────────────────────────────────────
// Trim the node list sent to Claude to reduce token count.
function filterNodes(answers) {
  const stepFree = answers.accessibility === "step_free";
  const duration = answers.duration;

  // Upper-floor node ids (require lift or escalator)
  const upperFloorIds = new Set([
    "minerals", "treasures", "the_vault", "giant_sequoia",   // Green F1/F2 via lift
    "earths_treasury", "from_beginning", "volcanoes", "restless_surface", // Red F1/F2
    "investigate",  // LG
  ]);

  return NODES.filter((n) => {
    // Step-free: exclude upper floors unless lift is in the graph (Claude handles this)
    // We keep upper floors in the list but Claude's rules handle ordering.
    // Only hard-exclude wildlife_garden for short visits (too far out of main path).
    if (n.id === "wildlife_garden" && (duration === "1 hour" || duration === "2 hours")) {
      return false;
    }

    // For step-free visitors with 1-hour visits, exclude all upper-floor nodes
    // since there's no time to use the lift and return
    if (stepFree && duration === "1 hour" && upperFloorIds.has(n.id)) {
      return false;
    }

    return true;
  });
}

// ── Node list builder ─────────────────────────────────────────────────────────
function buildNodeList(filteredNodes, congestionScores) {
  return filteredNodes.map((n) => {
    const dur = n.dur > 0 ? `, ~${n.dur}min visit` : ", no dwell time";
    const score = congestionScores[n.id];
    const congestion =
      score === undefined ? ""
      : score >= 0.68 ? ", congestion:HIGH"
      : score >= 0.40 ? ", congestion:MODERATE"
      : ", congestion:low";
    return `  { id: "${n.id}", name: "${n.name}", zone: "${n.zone}", floor: "${n.floor}"${dur}${congestion}, desc: "${n.desc}" }`;
  }).join("\n");
}

// ── Stop validator ────────────────────────────────────────────────────────────
function validateStops(stops) {
  const validIds = new Set(NODES.map((n) => n.id));
  return (stops || []).filter((s) => {
    if (!validIds.has(s.nodeId)) {
      console.warn(`[generate-route] Dropping unknown nodeId: ${s.nodeId}`);
      return false;
    }
    return true;
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { allowed, retryAfter } = checkRateLimit(req);
  if (!allowed) {
    res.setHeader("Retry-After", retryAfter);
    return res.status(429).json({ error: `Too many requests. Please wait ${retryAfter}s before trying again.` });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server API key not configured" });
  }

  const { answers } = req.body || {};
  if (!answers) {
    return res.status(400).json({ error: "Missing answers" });
  }

  const hour = new Date().getHours();

  // Check cache
  const cacheKey = getCacheKey(answers, hour);
  const cached = cacheGet(cacheKey);
  if (cached) {
    return res.status(200).json({ ...cached, cached: true });
  }

  // Build congestion model
  const congestionScores = getAllCongestionScores(hour);
  const congestionSection = getCongestionPromptSection(congestionScores, hour);

  // Filter and format node list
  const filteredNodes = filterNodes(answers);
  const nodeList = buildNodeList(filteredNodes, congestionScores);
  const entranceName = ENTRANCE_NAMES[answers.entrance] || answers.entrance;

  const visitStyleDesc =
    answers.visitStyle === "guided"
      ? "Focused — visitor knows what they want, stick closely to their stated interests"
      : answers.visitStyle === "explore"
      ? "Exploratory — visitor wants to discover, include a variety of zones and surprises"
      : "Mixed — balance their stated interests with some unexpected discoveries";

  const systemPrompt = `You are an expert tour guide for the Natural History Museum London.
You output ONLY valid JSON — no markdown, no preamble, no explanation.
Your entire response must be a single JSON object matching the schema provided.`;

  const userPrompt = `Generate a personalised tour route.

AVAILABLE NODES (use these exact ids):
${nodeList}

${congestionSection}

VISITOR PREFERENCES:
- Visit style: ${visitStyleDesc}
- Time available: ${answers.duration}
- Interests: ${answers.interests.join(", ")}${answers.specificExhibits ? `\n- Must-see exhibits requested: ${answers.specificExhibits} — prioritise matching these by name or keyword` : ""}
- Group: ${answers.group}
- Entrance: ${answers.entrance} (${entranceName})
- Accessibility: ${answers.accessibility === "step_free" ? "Step-free access required — avoid stairs; upper floors only via lift_hintze" : "Standard access, stairs fine"}${answers.specialRequests ? `\n- Special requests: ${answers.specialRequests}` : ""}

Return this JSON structure:
{
  "narrative": "2-3 friendly sentences describing why this route suits this visitor, mentioning congestion if relevant",
  "totalMinutes": <realistic total visit time as a number>,
  "stops": [
    {
      "nodeId": "<exact id from node list>",
      "reason": "<one sentence: why this stop suits this visitor>",
      "tip": "<one short practical tip, mentioning congestion if the gallery is busy>"
    }
  ]
}

RULES:
- First stop MUST be ${answers.entrance}
- Stop count: 5-7 for "1 hour", 8-12 for "2 hours", 13-16 for "3-4 hours", 17-22 for "4+ hours"
- Match stops to stated interests
- Keep route geographically logical (no unnecessary backtracking)
- Prefer lower-congestion alternatives when interests are equally matched
${answers.accessibility === "step_free" ? "- ONLY use floor F1/F2/LG nodes if lift_hintze is included as a stop first\n- Avoid volcanoes, restless_surface, from_beginning, earths_treasury unless lift_hintze is included" : ""}
- For group "${answers.group}" with young children: prioritise dinosaurs, creepy_crawlies, human_biology, hintze_hall, investigate
- Include a café or shop stop if time allows
- Only use nodeIds that exactly match ids in the node list above`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: "{" },
      ],
    });

    // Response begins mid-JSON since we prefilled "{" — reconstruct it
    const rawText = message.content[0]?.text || "";
    let jsonStr = "{" + rawText;

    // Fallback: if the model ignored prefill and returned a full object anyway
    if (rawText.trimStart().startsWith("{")) {
      jsonStr = rawText;
    }

    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      // Last resort: regex extraction
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(500).json({ error: "Failed to generate a valid route. Please try again." });
      }
      data = JSON.parse(jsonMatch[0]);
    }

    data.stops = validateStops(data.stops);

    if (data.stops.length < 2) {
      return res.status(500).json({ error: "Generated route was too short. Please try again." });
    }

    // Cache successful response
    cacheSet(cacheKey, data);

    return res.status(200).json(data);
  } catch (err) {
    console.error("[generate-route]", err);
    return res.status(500).json({ error: "Failed to generate route. Please try again." });
  }
}
