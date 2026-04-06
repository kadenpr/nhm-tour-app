import { useState, useEffect, useMemo } from "react";
import { NODES, ZONE_COLORS, ZONE_LABELS, FLOOR_LABELS } from "../data/museumData";
import { fetchExhibitInfo } from "../api/fetchExhibitInfo";
import { generateDirections } from "../utils/directions";

const NODE_MAP = {};
NODES.forEach((n) => (NODE_MAP[n.id] = n));

// Fetches Wikipedia info for the current exhibit and shows it in the panel
function useExhibitInfo(node, journeyStep) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const shouldFetch =
      journeyStep === "at-exhibit" &&
      node &&
      node.zone !== "entrance" &&
      node.zone !== "facility";

    if (!shouldFetch) {
      setInfo(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setInfo(null);

    fetchExhibitInfo(node).then((result) => {
      if (!cancelled) {
        setInfo(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [node?.id, journeyStep]);

  return { info, loading };
}

// Small Wikipedia info card shown at the bottom of each exhibit stop
function WikiCard({ info, loading }) {
  if (loading) {
    return (
      <div
        style={{
          marginTop: 10,
          padding: "10px 12px",
          borderRadius: 8,
          background: "#fafaf7",
          border: "1px solid #f0f0ee",
          fontSize: 12,
          color: "#bbb",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ animation: "nhm-spin 1s linear infinite", display: "inline-block" }}>⟳</span>
        <style>{`@keyframes nhm-spin { to { transform: rotate(360deg); } }`}</style>
        Loading exhibit info…
      </div>
    );
  }

  if (!info) return null;

  return (
    <div
      style={{
        marginTop: 10,
        padding: "10px 12px",
        borderRadius: 8,
        background: "#f5f9ff",
        border: "1px solid #dde8f5",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 13 }}>📖</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#1B6FA0",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {info.title}
          </span>
        </div>
        <a
          href={info.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11,
            color: "#1B6FA0",
            textDecoration: "none",
            fontWeight: 500,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Wikipedia ↗
        </a>
      </div>
      <div
        style={{
          fontSize: 12,
          color: "#444",
          lineHeight: 1.55,
          whiteSpace: "pre-line",
        }}
      >
        {info.extract}
      </div>
    </div>
  );
}

export default function JourneyPanel({
  routeData,
  currentIndex,
  journeyStep,
  onArrive,
  onNext,
  onEnd,
}) {
  if (!routeData?.stops) return null;

  const stops = routeData.stops;
  const currentStop = stops[currentIndex];
  const currentNode = currentStop ? NODE_MAP[currentStop.nodeId] : null;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === stops.length - 1;
  const color = currentNode ? (ZONE_COLORS[currentNode.zone] || "#888") : "#C67A1E";

  const { info: wikiInfo, loading: wikiLoading } = useExhibitInfo(currentNode, journeyStep);

  // Compute walking directions when travelling between stops
  const directions = useMemo(() => {
    if (journeyStep !== "travelling" || currentIndex < 1) return { steps: [], walkMinutes: 0 };
    const fromId = stops[currentIndex - 1]?.nodeId;
    const toId = stops[currentIndex]?.nodeId;
    if (!fromId || !toId) return { steps: [], walkMinutes: 0 };
    return generateDirections(fromId, toId);
  }, [journeyStep, currentIndex, stops]);

  const renderContent = () => {
    // Journey complete
    if (journeyStep === "done") {
      return (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>
            Journey Complete!
          </div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
            You've visited all {stops.length} stops on your tour.
          </div>
          <button
            onClick={onEnd}
            style={btnStyle("#1a1a1a")}
          >
            End journey
          </button>
        </div>
      );
    }

    // Travelling to a stop
    if (journeyStep === "travelling" && currentNode) {
      return (
        <div>
          <div style={rowStyle}>
            <span style={{ fontSize: 16 }}>🚶</span>
            <span style={subheadStyle}>Head to your next stop</span>
            <span style={{ fontSize: 11, color: "#ccc", marginLeft: "auto" }}>
              {currentIndex + 1} of {stops.length}
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Badge num={currentIndex + 1} color={color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={nameStyle}>{currentNode.name}</div>
              <div style={{ fontSize: 11, color, fontWeight: 500 }}>
                {ZONE_LABELS[currentNode.zone]} · {FLOOR_LABELS[currentNode.floor] || currentNode.floor}
                {currentNode.dur > 0 && <span style={{ color: "#bbb" }}> · ~{currentNode.dur} min to explore</span>}
              </div>
            </div>
          </div>

          {/* Walking directions */}
          {directions.steps.length > 0 && (
            <div
              style={{
                marginTop: 10,
                background: "#fafaf7",
                borderRadius: 8,
                padding: "10px 12px",
                border: "1px solid #ebebeb",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#aaa",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                🗺 Directions · ~{directions.walkMinutes} min walk
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
                {directions.steps.map((step, i) => (
                  <li key={i} style={{ fontSize: 13, color: "#444", lineHeight: 1.4 }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
            <button onClick={onArrive} style={btnStyle("#C67A1E", true)}>
              I've arrived ✓
            </button>
            <button onClick={onEnd} style={ghostBtnStyle}>End journey</button>
          </div>
        </div>
      );
    }

    // At exhibit — entrance (first stop)
    if (journeyStep === "at-exhibit" && isFirst) {
      return (
        <div>
          <div style={rowStyle}>
            <span style={{ fontSize: 16 }}>📍</span>
            <span style={subheadStyle}>You're at the entrance</span>
          </div>

          {currentNode && (
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
              <Badge num={1} color="#22863a" />
              <div>
                <div style={nameStyle}>{currentNode.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  Your tour has {stops.length} stops · ~{routeData.totalMinutes} min total
                </div>
              </div>
            </div>
          )}

          <button onClick={onNext} style={{ ...btnStyle("#C67A1E"), width: "100%" }}>
            Begin your journey →
          </button>
        </div>
      );
    }

    // At exhibit — last stop
    if (journeyStep === "at-exhibit" && isLast && currentNode) {
      return (
        <div>
          <div style={rowStyle}>
            <span style={{ fontSize: 16 }}>📍</span>
            <span style={subheadStyle}>Final stop</span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
            <Badge num={currentIndex + 1} color="#B03028" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={nameStyle}>{currentNode.name}</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.4, marginBottom: 4 }}>
                {currentStop.reason}
              </div>
              {currentStop.tip && (
                <div style={{ fontSize: 12, color: "#888" }}>💡 {currentStop.tip}</div>
              )}
            </div>
          </div>

          <WikiCard info={wikiInfo} loading={wikiLoading} />

          <button onClick={onEnd} style={{ ...btnStyle("#1a1a1a"), width: "100%", marginTop: 12 }}>
            🎉 Complete journey
          </button>
        </div>
      );
    }

    // At exhibit — middle stop
    if (journeyStep === "at-exhibit" && currentNode) {
      return (
        <div>
          <div style={rowStyle}>
            <span style={{ fontSize: 16 }}>📍</span>
            <span style={subheadStyle}>You're here</span>
            <span style={{ fontSize: 11, color: "#ccc", marginLeft: "auto" }}>
              {currentIndex + 1} of {stops.length}
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Badge num={currentIndex + 1} color={color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={nameStyle}>{currentNode.name}</div>
              <div style={{ fontSize: 11, color, fontWeight: 500, marginBottom: 6 }}>
                {ZONE_LABELS[currentNode.zone]} · {FLOOR_LABELS[currentNode.floor] || currentNode.floor}
                {currentNode.dur > 0 && <span style={{ color: "#bbb" }}> · ~{currentNode.dur} min</span>}
              </div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.4 }}>
                {currentStop.reason}
              </div>
              {currentStop.tip && (
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>💡 {currentStop.tip}</div>
              )}
            </div>
          </div>

          <WikiCard info={wikiInfo} loading={wikiLoading} />

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <button onClick={onNext} style={btnStyle("#C67A1E", true)}>
              Done — next stop →
            </button>
            <button onClick={onEnd} style={ghostBtnStyle}>End</button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <style>{`
        @keyframes nhm-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes nhm-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderRadius: "16px 16px 0 0",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          padding: "14px 20px 24px",
          zIndex: 1000,
          animation: "nhm-slide-up 0.25s ease-out",
          maxWidth: 680,
          margin: "0 auto",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
          maxHeight: "55vh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, background: "#e5e5e0", borderRadius: 2, margin: "0 auto 12px" }} />
        {renderContent()}
      </div>
    </>
  );
}

// ── Shared style helpers ─────────────────────────────────────────────────────

function Badge({ num, color }) {
  return (
    <div
      style={{
        width: 34, height: 34, borderRadius: "50%", background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0,
      }}
    >
      {num}
    </div>
  );
}

const rowStyle = {
  display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
};

const subheadStyle = {
  fontSize: 12, fontWeight: 600, color: "#888",
  textTransform: "uppercase", letterSpacing: "0.05em",
};

const nameStyle = {
  fontWeight: 700, fontSize: 16, color: "#1a1a1a", marginBottom: 2,
};

function btnStyle(bg, flex = false) {
  return {
    ...(flex ? { flex: 1 } : {}),
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    background: bg,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

const ghostBtnStyle = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #eee",
  background: "transparent",
  color: "#aaa",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
};
