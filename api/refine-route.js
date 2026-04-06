import Anthropic from "@anthropic-ai/sdk";
import { NODES } from "../src/data/museumData.js";
import { checkRateLimit } from "./_rateLimit.js";

const ENTRANCE_NAMES = {
  entrance_cromwell: "Cromwell Road (main south)",
  entrance_queens: "Queen's Gate (west)",
  entrance_exhibition: "Exhibition Road (east)",
};

function buildNodeList() {
  return NODES.map((n) => {
    const dur = n.dur > 0 ? `, ~${n.dur}min visit` : ", no dwell time";
    return `  { id: "${n.id}", name: "${n.name}", zone: "${n.zone}", floor: "${n.floor}"${dur}, desc: "${n.desc}" }`;
  }).join("\n");
}

function validateStops(stops) {
  const validIds = new Set(NODES.map((n) => n.id));
  return (stops || []).filter((s) => {
    if (!validIds.has(s.nodeId)) {
      console.warn(`Dropping unknown nodeId: ${s.nodeId}`);
      return false;
    }
    return true;
  });
}

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

  const { answers, previewRoute, followUpAnswers } = req.body || {};
  if (!answers || !previewRoute || !followUpAnswers) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const nodeMap = {};
  NODES.forEach((n) => (nodeMap[n.id] = n));

  const nodeList = buildNodeList();
  const entranceName = ENTRANCE_NAMES[answers.entrance] || answers.entrance;

  const visitStyleDesc =
    answers.visitStyle === "guided"
      ? "Focused — visitor knows what they want, stick closely to their stated interests"
      : answers.visitStyle === "explore"
      ? "Exploratory — visitor wants to discover, include a variety of zones and surprises"
      : "Mixed — balance their stated interests with some unexpected discoveries";

  const currentStops = previewRoute.stops
    .map((s, i) => `${i + 1}. ${nodeMap[s.nodeId]?.name || s.nodeId} (id: ${s.nodeId})`)
    .join("\n");

  const skipText = followUpAnswers.skip?.length
    ? followUpAnswers.skip.map((id) => `${nodeMap[id]?.name || id} (${id})`).join(", ")
    : "none";

  const addText = followUpAnswers.addGems?.length
    ? followUpAnswers.addGems.map((id) => `${nodeMap[id]?.name || id} (${id})`).join(", ")
    : "none";

  const prompt = `You are an expert tour guide for the Natural History Museum London. Refine this tour route based on visitor feedback.

CURRENT PLANNED ROUTE:
${currentStops}

VISITOR FEEDBACK:
- Stops to REMOVE from route: ${skipText}
- Hidden gems to ADD to route: ${addText}

VISITOR PREFERENCES:
- Visit style: ${visitStyleDesc}
- Time available: ${answers.duration}
- Interests: ${answers.interests.join(", ")}${answers.specificExhibits ? `\n- Must-see exhibits requested: ${answers.specificExhibits} — prioritise matching these by name or keyword` : ""}
- Group: ${answers.group}
- Entrance: ${answers.entrance} (${entranceName})
- Accessibility: ${answers.accessibility === "step_free" ? "Step-free access required — avoid stairs; upper floors only via lift_hintze" : "Standard access, stairs fine"}${answers.specialRequests ? `\n- Special requests: ${answers.specialRequests}` : ""}

AVAILABLE NODES (use these exact ids):
${nodeList}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "narrative": "2-3 friendly sentences describing why this refined route suits this visitor",
  "totalMinutes": <realistic total visit time as a number>,
  "stops": [
    {
      "nodeId": "<exact id from node list>",
      "reason": "<one sentence: why this stop suits this visitor>",
      "tip": "<one short practical tip>"
    }
  ]
}

RULES:
- First stop MUST be ${answers.entrance}
- Remove ALL stops listed under "Stops to REMOVE" — do not include them
- Include ALL stops listed under "Hidden gems to ADD"
- Replace removed stops with nearby alternatives to maintain route flow if needed
- Stop count: 5-7 for "1 hour", 8-12 for "2 hours", 13-16 for "3-4 hours", 17-22 for "4+ hours"
- Keep route geographically logical (no unnecessary backtracking)
${answers.accessibility === "step_free" ? "- ONLY use floor F1/F2/LG nodes if lift_hintze is included as a stop first\n- Avoid volcanoes, restless_surface, from_beginning, earths_treasury unless lift_hintze is included" : ""}
- Only use nodeIds that exactly match ids in the node list above`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const fullText = message.content[0]?.text || "";
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Failed to refine route. Please try again." });
    }

    const data = JSON.parse(jsonMatch[0]);
    data.stops = validateStops(data.stops);

    if (data.stops.length < 2) {
      return res.status(500).json({ error: "Refined route was too short. Please try again." });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("[refine-route]", err);
    return res.status(500).json({ error: "Failed to refine route. Please try again." });
  }
}
