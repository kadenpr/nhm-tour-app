import { NODES, ZONE_COLORS, ZONE_LABELS, FLOOR_LABELS } from "../data/museumData";

export default function RoutePanel({ routeData }) {
  if (!routeData) return null;

  const nodeMap = {};
  NODES.forEach((n) => (nodeMap[n.id] = n));

  return (
    <div style={{ padding: "20px 20px 32px", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      {/* Narrative */}
      <div
        style={{
          padding: "14px 16px",
          background: "#fafaf7",
          borderRadius: 10,
          border: "1px solid #e5e5e0",
          marginBottom: 18,
        }}
      >
        <p style={{ margin: "0 0 10px", fontSize: 14, color: "#555", fontStyle: "italic", lineHeight: 1.6 }}>
          {routeData.narrative}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              background: "#1a1a1a",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            ⏱ ~{routeData.totalMinutes} min total
          </span>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              background: "#f0f0ee",
              color: "#666",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {routeData.stops.length} stops
          </span>
        </div>
      </div>

      {/* Stops list */}
      <div style={{ fontSize: 12, fontWeight: 600, color: "#bbb", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        Your route
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {routeData.stops.map((stop, i) => {
          const node = nodeMap[stop.nodeId];
          if (!node) return null;
          const col = ZONE_COLORS[node.zone] || "#888";
          const isFirst = i === 0;
          const isLast = i === routeData.stops.length - 1;
          const badgeColor = isFirst ? "#22863a" : isLast ? "#B03028" : col;

          return (
            <div
              key={stop.nodeId}
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${col}25`,
                background: `${col}06`,
                position: "relative",
              }}
            >
              {/* Connector line */}
              {i < routeData.stops.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: 27,
                    top: "100%",
                    width: 2,
                    height: 8,
                    background: `${col}40`,
                  }}
                />
              )}

              {/* Number badge */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: badgeColor,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                }}
              >
                {i + 1}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a", marginBottom: 2, lineHeight: 1.3 }}>
                  {node.name}
                  {isFirst && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: "#22863a", fontWeight: 500 }}>START</span>
                  )}
                  {isLast && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: "#B03028", fontWeight: 500 }}>END</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: col, fontWeight: 500, marginBottom: 5 }}>
                  {ZONE_LABELS[node.zone]} · {FLOOR_LABELS[node.floor] || node.floor}
                  {node.dur > 0 && <span style={{ color: "#bbb" }}> · ~{node.dur} min</span>}
                </div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.45 }}>
                  {stop.reason}
                </div>
                {stop.tip && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#888",
                      marginTop: 5,
                      padding: "5px 8px",
                      background: "rgba(0,0,0,0.03)",
                      borderRadius: 6,
                      lineHeight: 1.4,
                    }}
                  >
                    💡 {stop.tip}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tip at bottom */}
      <div
        style={{
          marginTop: 20,
          padding: "10px 14px",
          borderRadius: 8,
          background: "#FFF8F0",
          border: "1px solid #C67A1E30",
          fontSize: 12,
          color: "#888",
          lineHeight: 1.5,
        }}
      >
        💡 <strong style={{ color: "#C67A1E" }}>Tip:</strong> Click any numbered stop on the map to see details and connections.
      </div>
    </div>
  );
}
