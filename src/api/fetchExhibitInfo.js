/**
 * Fetch real exhibit information from Wikipedia.
 * Uses Wikipedia's public API (CORS-enabled, no auth required).
 * Results are cached per node ID to avoid duplicate requests.
 */

const cache = new Map();

// Some NHM exhibits have well-known Wikipedia pages — map them directly
// to avoid noisy search results
const DIRECT_TITLES = {
  hintze_hall:      "Hintze Hall",
  darwin_centre:    "Darwin Centre, Natural History Museum",
  dinosaurs:        "Natural History Museum dinosaur gallery",
  earth_hall:       "Earth Galleries, Natural History Museum",
  human_evolution:  "Human evolution",
  giant_sequoia:    "Giant sequoia",
  volcanoes:        "Volcano",
  creepy_crawlies:  "Arthropod",
  fossil_marine:    "Ichthyosaur",
  hintze_hall:      "Hintze Hall",
  mammals:          "Mammal",
  birds:            "Bird",
  minerals:         "Mineral",
  marine_inverts:   "Marine invertebrates",
  human_biology:    "Human biology",
};

async function wikiSearch(query) {
  const url =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: query,
      format: "json",
      origin: "*",
      srlimit: "3",
      srprop: "snippet",
    });
  const res = await fetch(url);
  const data = await res.json();
  return data?.query?.search || [];
}

async function wikiExtract(title) {
  const url =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      prop: "extracts|info",
      exintro: "1",
      explaintext: "1",
      exsentences: "5",
      inprop: "url",
      titles: title,
      format: "json",
      origin: "*",
      redirects: "1",
    });
  const res = await fetch(url);
  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  if (page.missing !== undefined || !page.extract) return null;
  return {
    title: page.title,
    extract: page.extract,
    url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
  };
}

function cleanExtract(raw) {
  if (!raw) return "";
  // Split into sentences, take up to 4, clean up whitespace
  return raw
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20)
    .slice(0, 3)
    .join("\n\n");
}

export async function fetchExhibitInfo(node) {
  if (!node) return null;
  // Skip non-exhibit nodes
  if (node.zone === "facility" || node.zone === "entrance") return null;

  if (cache.has(node.id)) return cache.get(node.id);

  try {
    // 1. Try a direct title mapping first
    const directTitle = DIRECT_TITLES[node.id];
    if (directTitle) {
      const info = await wikiExtract(directTitle);
      if (info?.extract) {
        const result = {
          title: info.title,
          extract: cleanExtract(info.extract),
          url: info.url,
        };
        cache.set(node.id, result);
        return result;
      }
    }

    // 2. Search Wikipedia: "{name} Natural History Museum London"
    const searches = [
      `${node.name} Natural History Museum London`,
      `${node.name} Natural History Museum`,
      node.name,
    ];

    for (const query of searches) {
      const results = await wikiSearch(query);
      if (results.length === 0) continue;

      // Take the top result
      const info = await wikiExtract(results[0].title);
      if (info?.extract && info.extract.length > 50) {
        const result = {
          title: info.title,
          extract: cleanExtract(info.extract),
          url: info.url,
        };
        cache.set(node.id, result);
        return result;
      }
    }
  } catch (err) {
    console.warn("[fetchExhibitInfo] Wikipedia request failed:", err);
  }

  // Cache null so we don't retry
  cache.set(node.id, null);
  return null;
}
