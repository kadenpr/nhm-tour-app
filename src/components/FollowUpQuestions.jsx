import { useState } from "react";
import { NODES, ZONE_COLORS, ZONE_LABELS, FLOOR_LABELS } from "../data/museumData";
import { ExhibitInfoPanel } from "./ExhibitInfoPanel";

const HIDDEN_GEM_IDS = [
  "cocoon",
  "the_vault",
  "treasures",
  "fossil_marine",
  "lasting_imp",
  "giant_sequoia",
  "investigate",
  "from_beginning",
  "restless_surface",
  "images_of_nature",
];

const GEM_DESCRIPTIONS = {
  cocoon: "Watch scientists work with millions of real preserved specimens",
  the_vault: "Rare gems, meteorites and precious objects in a secure display",
  treasures: "22 of the most extraordinary objects in the entire collection",
  fossil_marine: "Ichthyosaurs and plesiosaurs — prehistoric sea monsters",
  lasting_imp: "Pick up and touch real bones, shells and specimens",
  giant_sequoia: "A cross-section of a 1,300-year-old sequoia tree",
  investigate: "Hands-on science lab — use real scientific equipment",
  from_beginning: "The full 4.5 billion year story of planet Earth",
  restless_surface: "How wind, water and ice sculpt our world",
  images_of_nature: "Stunning nature artwork and wildlife photography gallery",
};


export default function FollowUpQuestions({ previewRoute, onSubmit }) {
  const [skipIds, setSkipIds] = useState([]);
  const [gemIds, setGemIds] = useState([]);
  const [expandedInfo, setExpandedInfo] = useState(null);

  const nodeMap = {};
  NODES.forEach((n) => (nodeMap[n.id] = n));

  // All stops except the entrance (first stop) can be skipped
  const skippableStops = previewRoute.stops.filter((s) => {
    const node = nodeMap[s.nodeId];
    return node && node.zone !== "entrance";
  });

  // Hidden gems not already in the route
  const routeNodeIds = new Set(previewRoute.stops.map((s) => s.nodeId));
  const availableGems = HIDDEN_GEM_IDS
    .filter((id) => !routeNodeIds.has(id) && nodeMap[id])
    .map((id) => nodeMap[id]);

  const toggleSkip = (id) =>
    setSkipIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleGem = (id) =>
    setGemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleInfo = (id) =>
    setExpandedInfo((prev) => (prev === id ? null : id));

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        background: "#fafaf7",
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>✨</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
          Personalise your route
        </h1>
        <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
          We've built your route — now fine-tune it
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Q1: Skip stops */}
        {skippableStops.length > 0 && (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e5e5e0",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              padding: "24px 28px",
            }}
          >
            <div style={{ fontSize: 11, color: "#bbb", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Optional
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", margin: "0 0 4px" }}>
              Any stops you'd prefer to skip?
            </h2>
            <p style={{ fontSize: 13, color: "#999", margin: "0 0 16px" }}>
              We'll swap them for something nearby
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {skippableStops.map((stop) => {
                const node = nodeMap[stop.nodeId];
                const col = ZONE_COLORS[node.zone] || "#888";
                const selected = skipIds.includes(stop.nodeId);
                const infoOpen = expandedInfo === stop.nodeId;
                return (
                  <div key={stop.nodeId}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: selected ? "2px solid #B03028" : "1.5px solid #e5e5e0",
                        background: selected ? "#FFF0F0" : "#fff",
                        transition: "all 0.15s",
                      }}
                    >
                      {/* Clickable area to toggle skip */}
                      <div
                        onClick={() => toggleSkip(stop.nodeId)}
                        style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }}
                      >
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: selected ? "#B03028" : "#222", lineHeight: 1.2 }}>
                            {node.name}
                          </div>
                          <div style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>
                            {ZONE_LABELS[node.zone]} · {FLOOR_LABELS[node.floor] || node.floor}
                          </div>
                        </div>
                        {selected && (
                          <span style={{ fontSize: 12, color: "#B03028", fontWeight: 700, flexShrink: 0 }}>✕ Skip</span>
                        )}
                      </div>
                      {/* Info button */}
                      <button
                        onClick={() => toggleInfo(stop.nodeId)}
                        style={{
                          width: 26, height: 26, border: "1px solid #eee",
                          borderRadius: 6, background: infoOpen ? `${col}15` : "#fff",
                          cursor: "pointer", color: infoOpen ? col : "#aaa",
                          fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}
                        title="More info"
                      >
                        ℹ
                      </button>
                    </div>
                    {infoOpen && <ExhibitInfoPanel node={node} color={col} marginLeft={22} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Q2: Hidden gems */}
        {availableGems.length > 0 && (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e5e5e0",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              padding: "24px 28px",
            }}
          >
            <div style={{ fontSize: 11, color: "#bbb", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Optional
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", margin: "0 0 4px" }}>
              Want to discover a hidden gem?
            </h2>
            <p style={{ fontSize: 13, color: "#999", margin: "0 0 16px" }}>
              Lesser-known spots worth squeezing in
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {availableGems.map((node) => {
                const selected = gemIds.includes(node.id);
                const infoOpen = expandedInfo === node.id;
                const col = ZONE_COLORS[node.zone] || "#888";
                return (
                  <div key={node.id}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: selected ? "2px solid #C67A1E" : "1.5px solid #e5e5e0",
                        background: selected ? "#FFF8F0" : "#fff",
                        transition: "all 0.15s",
                      }}
                    >
                      {/* Clickable area to toggle gem */}
                      <div
                        onClick={() => toggleGem(node.id)}
                        style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }}
                      >
                        <span style={{ fontSize: 20, flexShrink: 0 }}>💎</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: selected ? 600 : 500, color: selected ? "#C67A1E" : "#222", lineHeight: 1.2 }}>
                            {node.name}
                          </div>
                          <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                            {GEM_DESCRIPTIONS[node.id] || node.desc}
                          </div>
                        </div>
                        {selected && (
                          <span style={{ width: 18, height: 18, borderRadius: 4, background: "#C67A1E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, color: "#fff" }}>
                            ✓
                          </span>
                        )}
                      </div>
                      {/* Info button */}
                      <button
                        onClick={() => toggleInfo(node.id)}
                        style={{
                          width: 26, height: 26, border: "1px solid #eee",
                          borderRadius: 6, background: infoOpen ? "#C67A1E20" : "#fff",
                          cursor: "pointer", color: infoOpen ? "#C67A1E" : "#aaa",
                          fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}
                        title="More info"
                      >
                        ℹ
                      </button>
                    </div>
                    {infoOpen && <ExhibitInfoPanel node={node} color={col} marginLeft={22} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={() => onSubmit({ skip: skipIds, addGems: gemIds })}
          style={{
            padding: "14px 24px",
            borderRadius: 10,
            border: "none",
            background: "#1a1a1a",
            color: "#fff",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "inherit",
            transition: "background 0.15s",
          }}
        >
          ✨ Generate my final route
        </button>
      </div>
    </div>
  );
}
