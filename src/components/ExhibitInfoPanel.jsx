import { useState, useEffect } from "react";
import { fetchExhibitInfo } from "../api/fetchExhibitInfo";
import { FLOOR_LABELS, ZONE_LABELS } from "../data/museumData";

export function ExhibitInfoPanel({ node, color, marginLeft = 38 }) {
  const [wikiInfo, setWikiInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!node || node.zone === "entrance" || node.zone === "facility") return;
    let cancelled = false;
    setLoading(true);
    setWikiInfo(null);
    fetchExhibitInfo(node).then((info) => {
      if (!cancelled) {
        setWikiInfo(info);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [node?.id]);

  const durText = node.dur > 0 ? `~${node.dur} min visit` : "No set dwell time";

  return (
    <div
      style={{
        margin: `4px 0 4px ${marginLeft}px`,
        padding: "12px 14px",
        borderRadius: 8,
        background: `${color}08`,
        border: `1px solid ${color}20`,
        fontSize: 13,
      }}
    >
      {/* Node description */}
      {node.desc && (
        <p style={{ margin: "0 0 10px", color: "#333", lineHeight: 1.5, fontWeight: 500 }}>
          {node.desc}
        </p>
      )}

      {/* Wikipedia content */}
      {loading && (
        <p style={{ margin: "0 0 10px", color: "#aaa", fontSize: 12, fontStyle: "italic" }}>
          Loading information…
        </p>
      )}
      {!loading && wikiInfo?.extract && (
        <div style={{ marginBottom: 10 }}>
          {wikiInfo.extract.split("\n\n").map((para, i) => (
            <p
              key={i}
              style={{
                margin: i === 0 ? 0 : "6px 0 0",
                color: "#555",
                lineHeight: 1.65,
                fontSize: 13,
              }}
            >
              {para}
            </p>
          ))}
        </div>
      )}
      {!loading && !wikiInfo && node.zone !== "entrance" && node.zone !== "facility" && (
        <p style={{ margin: "0 0 10px", color: "#bbb", fontSize: 12, fontStyle: "italic" }}>
          No additional information available.
        </p>
      )}

      {/* Duration / floor / zone */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", borderTop: `1px solid ${color}15`, paddingTop: 8, marginTop: 4 }}>
        <span style={{ fontSize: 12, color: "#888" }}>⏱ {durText}</span>
        <span style={{ fontSize: 12, color: "#888" }}>· {FLOOR_LABELS[node.floor] || node.floor}</span>
        <span style={{ fontSize: 12, color: "#888" }}>· {ZONE_LABELS[node.zone]}</span>
      </div>
    </div>
  );
}
