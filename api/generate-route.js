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

  const { answers } = req.body || {};
  if (!answers) {
    return res.status(400).json({ error: "Missing answers" });
  }

  const nodeList = buildNodeList();
  const entranceName = ENTRANCE_NAMES[answers.entrance] || answers.entrance;

  const visitStyleDesc =
    answers.visitStyle === "guided"
      ? "Focused — visitor knows what they want, stick closely to their stated interests"
      : answers.visitStyle === "explore"
      ? "Exploratory — visitor wants to discover, include a variety of zones and surprises"
      : "Mixed — balance their stated interests with some unexpected discoveries";

  const prompt = `You are an expert tour guide for the Natural History Museum London. Generate a personalised tour route.

AVAILABLE NODES (use these exact ids):
${nodeList}

VISITOR PREFERENCES:
- Visit style: ${visitStyleDesc}
- Time available: ${answers.duration}
- Interests: ${answers.interests.join(", ")}${answers.specificExhibits ? `\n- Must-see exhibits requested: ${answers.specificExhibits} — prioritise matching these by name or keyword` : ""}
- Group: ${answers.group}
- Entrance: ${answers.entrance} (${entranceName})
- Accessibility: ${answers.accessibility === "step_free" ? "Step-free access required — avoid stairs; upper floors only via lift_hintze" : "Standard access, stairs fine"}${answers.specialRequests ? `\n- Special requests: ${answers.specialRequests}` : ""}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "narrative": "2-3 friendly sentences describing why this route suits this visitor",
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
- Stop count: 5-7 for "1 hour", 8-12 for "2 hours", 13-16 for "3-4 hours", 17-22 for "4+ hours"
- Match stops to stated interests
- Keep route geographically logical (no unnecessary backtracking)
${answers.accessibility === "step_free" ? "- ONLY use floor F1/F2/LG nodes if lift_hintze is included as a stop first\n- Avoid volcanoes, restless_surface, from_beginning, earths_treasury unless lift_hintze is included" : ""}
- For group "${answers.group}" with young children: prioritise dinosaurs, creepy_crawlies, human_biology, hintze_hall, investigate
- Include a café or shop stop if time allows (use facility node ids like central_cafe, museum_shop)
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
      return res.status(500).json({ error: "Failed to generate a valid route. Please try again." });
    }

    const data = JSON.parse(jsonMatch[0]);
    data.stops = validateStops(data.stops);

    if (data.stops.length < 2) {
      return res.status(500).json({ error: "Generated route was too short. Please try again." });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("[generate-route]", err);
    return res.status(500).json({ error: "Failed to generate route. Please try again." });
  }
}
