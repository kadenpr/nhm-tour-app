import { useState, useMemo } from "react";
import { NODES, ZONE_COLORS, ZONE_LABELS, FLOOR_LABELS } from "../data/museumData";
import { ExhibitInfoPanel } from "./ExhibitInfoPanel";

const NODE_MAP = {};
NODES.forEach((n) => (NODE_MAP[n.id] = n));

export default function EditRoute({ routeData, onSave, onClose }) {
  const [stops, setStops] = useState([...routeData.stops]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedInfo, setExpandedInfo] = useState(null); // nodeId of expanded stop

  const stopNodeIds = useMemo(() => new Set(stops.map((s) => s.nodeId)), [stops]);

  // Filtered nodes for search (exclude already-added stops)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return NODES.filter(
      (n) =>
        !stopNodeIds.has(n.id) &&
        (n.name.toLowerCase().includes(q) || (n.desc || "").toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery, stopNodeIds]);

  const moveUp = (i) => {
    if (i === 0) return;
    const next = [...stops];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setStops(next);
  };

  const moveDown = (i) => {
    if (i === stops.length - 1) return;
    const next = [...stops];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setStops(next);
  };

  const removeStop = (i) => {
    if (stops.length <= 2) return; // minimum 2 stops
    setStops(stops.filter((_, idx) => idx !== i));
  };

  const addStop = (node) => {
    setStops([...stops, { nodeId: node.id, reason: "Added by you", tip: "" }]);
    setSearchQuery("");
  };

  return (
    <>
      <style>{`
        @keyframes nhm-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes nhm-modal-up {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 1100,
          animation: "nhm-fade-in 0.2s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(560px, calc(100vw - 32px))",
          maxHeight: "calc(100vh - 48px)",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          zIndex: 1200,
          display: "flex",
          flexDirection: "column",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
          animation: "nhm-modal-up 0.22s ease",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid #f0f0ee",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>✏️ Edit Your Route</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
              {stops.length} stops · reorder, remove or add exhibits
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: "#ccc", fontSize: 20, padding: 4, lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* Stops list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {stops.map((stop, i) => {
              const node = NODE_MAP[stop.nodeId];
              if (!node) return null;
              const color = ZONE_COLORS[node.zone] || "#888";
              const isFirst = i === 0;
              const isLast = i === stops.length - 1;
              const badgeColor = isFirst ? "#22863a" : isLast ? "#B03028" : color;

              return (
                <div key={`${stop.nodeId}-${i}`}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `1px solid ${color}20`,
                    background: `${color}05`,
                  }}
                >
                  {/* Stop number */}
                  <div
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: badgeColor,
                      color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a", lineHeight: 1.2 }}>
                      {node.name}
                      {isFirst && <span style={{ marginLeft: 6, fontSize: 10, color: "#22863a", fontWeight: 500 }}>START</span>}
                      {isLast && <span style={{ marginLeft: 6, fontSize: 10, color: "#B03028", fontWeight: 500 }}>END</span>}
                    </div>
                    <div style={{ fontSize: 11, color: color, fontWeight: 500 }}>
                      {ZONE_LABELS[node.zone]} · {FLOOR_LABELS[node.floor] || node.floor}
                      {stop.reason === "Added by you" && (
                        <span style={{ color: "#bbb", marginLeft: 4 }}>· added by you</span>
                      )}
                    </div>
                  </div>

                  {/* Info / Up / Down / Remove controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                    <button
                      onClick={() => setExpandedInfo(expandedInfo === stop.nodeId ? null : stop.nodeId)}
                      style={{
                        width: 28, height: 28, border: "1px solid #eee",
                        borderRadius: 6, background: expandedInfo === stop.nodeId ? `${color}15` : "#fff",
                        cursor: "pointer",
                        color: expandedInfo === stop.nodeId ? color : "#888",
                        fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      title="More info"
                    >
                      ℹ
                    </button>
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      style={{
                        width: 28, height: 28, border: "1px solid #eee",
                        borderRadius: 6, background: i === 0 ? "#fafaf7" : "#fff",
                        cursor: i === 0 ? "default" : "pointer",
                        color: i === 0 ? "#ddd" : "#666",
                        fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === stops.length - 1}
                      style={{
                        width: 28, height: 28, border: "1px solid #eee",
                        borderRadius: 6, background: i === stops.length - 1 ? "#fafaf7" : "#fff",
                        cursor: i === stops.length - 1 ? "default" : "pointer",
                        color: i === stops.length - 1 ? "#ddd" : "#666",
                        fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeStop(i)}
                      disabled={stops.length <= 2}
                      style={{
                        width: 28, height: 28, border: "1px solid #eee",
                        borderRadius: 6, background: stops.length <= 2 ? "#fafaf7" : "#fff",
                        cursor: stops.length <= 2 ? "default" : "pointer",
                        color: stops.length <= 2 ? "#ddd" : "#B03028",
                        fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      title="Remove stop"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {expandedInfo === stop.nodeId && (
                  <ExhibitInfoPanel node={node} color={color} marginLeft={38} />
                )}
                </div>
              );
            })}
          </div>

          {/* Add stop section */}
          <div
            style={{
              borderTop: "1px solid #f0f0ee",
              paddingTop: 16,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "#bbb", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Add an exhibit
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or description…"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e5e0",
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
                background: "#fafaf7",
                color: "#1a1a1a",
              }}
            />

            {searchResults.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  borderRadius: 10,
                  border: "1px solid #e5e5e0",
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                {searchResults.map((node) => {
                  const color = ZONE_COLORS[node.zone] || "#888";
                  return (
                    <button
                      key={node.id}
                      onClick={() => addStop(node)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        border: "none",
                        borderBottom: "1px solid #f5f5f3",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fafaf7")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{node.name}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>
                          {ZONE_LABELS[node.zone]} · {FLOOR_LABELS[node.floor] || node.floor}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: "#C67A1E", fontWeight: 600, flexShrink: 0 }}>+ Add</span>
                    </button>
                  );
                })}
              </div>
            )}

            {searchQuery.trim() && searchResults.length === 0 && (
              <div style={{ marginTop: 8, fontSize: 13, color: "#aaa", textAlign: "center", padding: "8px 0" }}>
                No exhibits found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #f0f0ee",
            display: "flex",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              color: "#666",
              fontFamily: "inherit",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(stops)}
            style={{
              flex: 2,
              padding: "11px 0",
              borderRadius: 10,
              border: "none",
              background: "#C67A1E",
              cursor: "pointer",
              fontSize: 14,
              color: "#fff",
              fontFamily: "inherit",
              fontWeight: 700,
            }}
          >
            Save route
          </button>
        </div>
      </div>
    </>
  );
}
