import { useState, useMemo, useEffect } from "react";
import { NODES, EDGES, ZONE_COLORS, ZONE_LABELS, FLOOR_LABELS } from "../data/museumData";
import { getRoutePaths } from "../utils/routing";
import { getAllCongestionScores, getCongestionColor, getCongestionLevel, getCongestionEdges } from "../utils/congestion";

// Gateway nodes that provide access to upper/lower floors
const FLOOR_GATEWAYS = {
  F1: ["lift_hintze", "earth_hall"],
  F2: ["lift_hintze", "earth_hall"],
  LG: ["lift_hintze"],
};

const FLOOR_TABS = [
  { id: "G", label: "Ground" },
  { id: "F1", label: "Floor 1" },
  { id: "F2", label: "Floor 2" },
  { id: "LG", label: "Lower Ground" },
  { id: "Out", label: "Outside" },
];

// 3D floor config (displayed top to bottom: F2 at top, LG at bottom)
const FLOOR_3D = [
  { id: "F2", level: 3, label: "Floor 2", color: "#1B6FA0" },
  { id: "F1", level: 2, label: "Floor 1", color: "#358535" },
  { id: "G",  level: 1, label: "Ground",  color: "#C67A1E" },
  { id: "LG", level: 0, label: "Lower Ground", color: "#B03028" },
];
const FLOOR_LEVELS = { LG: 0, G: 1, F1: 2, F2: 3 };

const NODE_MAP = {};
NODES.forEach((n) => (NODE_MAP[n.id] = n));

function getFloorNodeSet(floor) {
  const ids = new Set(NODES.filter((n) => n.floor === floor).map((n) => n.id));
  (FLOOR_GATEWAYS[floor] || []).forEach((gId) => ids.add(gId));
  return ids;
}

// 3D projection: compress Y axis, stack floors vertically with slight X offset
function proj3D(x, y, floor) {
  const level = FLOOR_LEVELS[floor] ?? 1;
  const SCALE_Y = 0.22;
  const FLOOR_SPACING = 175;
  const X_STEP = 22;
  const MAX_LEVEL = 3;
  return {
    px: x + (level - 1) * X_STEP,
    py: y * SCALE_Y + (MAX_LEVEL - level) * FLOOR_SPACING + 30,
  };
}

// Y band for a floor in 3D view
function floor3DYRange(floor) {
  const level = FLOOR_LEVELS[floor] ?? 1;
  const FLOOR_SPACING = 175;
  const MAX_LEVEL = 3;
  const baseY = (MAX_LEVEL - level) * FLOOR_SPACING + 30;
  return { top: baseY, bottom: baseY + 143 }; // 650 * 0.22 ≈ 143
}

export default function NHMMap({
  route = [],
  routeData = null,
  journeyMode = false,
  journeyStopIndex = 0,
  journeyStep = "at-exhibit",
}) {
  const [activeFloor, setActiveFloor] = useState("G");
  const [selectedNode, setSelectedNode] = useState(null);
  const [view3D, setView3D] = useState(false);
  const [congestionScores, setCongestionScores] = useState(() => getAllCongestionScores());

  // Refresh congestion scores every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => setCongestionScores(getAllCongestionScores()), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-switch floor when journey progresses
  useEffect(() => {
    if (journeyMode && route[journeyStopIndex]) {
      const n = NODE_MAP[route[journeyStopIndex]];
      if (n && n.floor !== "Out") setActiveFloor(n.floor);
    }
  }, [journeyMode, journeyStopIndex, route]);

  // Floors that contain route stops (for tab dot indicators)
  const routeFloors = useMemo(() => {
    const floors = new Set();
    route.forEach((id) => {
      const n = NODE_MAP[id];
      if (n) floors.add(n.floor);
    });
    return floors;
  }, [route]);

  // Congestion-adjusted edges for routing (prefer quieter paths)
  const congestionEdges = useMemo(
    () => getCongestionEdges(EDGES, congestionScores),
    [congestionScores]
  );

  // Dijkstra paths between consecutive route stops (congestion-aware)
  const routePaths = useMemo(() => {
    if (route.length < 2) return [];
    return getRoutePaths(route, EDGES, congestionEdges);
  }, [route, congestionEdges]);

  // Set of canonical "a|b" segment keys on the full route
  const routeSegmentKeys = useMemo(() => {
    const keys = new Set();
    routePaths.forEach((path) => {
      for (let i = 0; i < path.length - 1; i++) {
        keys.add([path[i], path[i + 1]].sort().join("|"));
      }
    });
    return keys;
  }, [routePaths]);

  // In journey mode: only the path to/from current stop
  const journeySegmentKeys = useMemo(() => {
    if (!journeyMode || journeyStep === "at-exhibit") return null;
    const keys = new Set();
    const prevIdx = journeyStopIndex - 1;
    if (prevIdx >= 0 && routePaths[prevIdx]) {
      routePaths[prevIdx].forEach((_, i, arr) => {
        if (i < arr.length - 1) {
          keys.add([arr[i], arr[i + 1]].sort().join("|"));
        }
      });
    }
    return keys;
  }, [journeyMode, journeyStep, journeyStopIndex, routePaths]);

  const floorNodeSet = useMemo(() => getFloorNodeSet(activeFloor), [activeFloor]);
  const floorNodes = useMemo(
    () => NODES.filter((n) => n.floor === activeFloor),
    [activeFloor]
  );

  // Stop number (1-indexed) for each route node
  const stopIndex = useMemo(() => {
    const map = {};
    route.forEach((id, i) => { map[id] = i + 1; });
    return map;
  }, [route]);

  // routeData stop info keyed by nodeId
  const routeStopInfo = useMemo(() => {
    const map = {};
    if (routeData?.stops) {
      routeData.stops.forEach((s) => { map[s.nodeId] = s; });
    }
    return map;
  }, [routeData]);

  // Edges for the current floor (2D view)
  const floorEdges = useMemo(() => {
    return EDGES
      .filter(([a, b]) => floorNodeSet.has(a) && floorNodeSet.has(b))
      .map(([a, b]) => {
        const key = [a, b].sort().join("|");
        const na = NODE_MAP[a], nb = NODE_MAP[b];
        const activeSegKeys = journeyMode ? journeySegmentKeys : routeSegmentKeys;
        return {
          a, b,
          isRoute: activeSegKeys ? activeSegKeys.has(key) : routeSegmentKeys.has(key),
          isCrossFloor: na?.floor !== nb?.floor,
        };
      });
  }, [activeFloor, floorNodeSet, routeSegmentKeys, journeyMode, journeySegmentKeys]);

  const handleNodeClick = (node) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  };

  const selectedStopInfo = selectedNode ? routeStopInfo[selectedNode.id] : null;
  const selectedStopNum = selectedNode ? stopIndex[selectedNode.id] : null;

  // Journey: current and target node
  const journeyCurrentId = journeyMode ? route[journeyStopIndex] : null;
  const journeyDim = (nodeId) => {
    if (!journeyMode) return false;
    if (journeyStep === "done") return false;
    if (journeyStep === "at-exhibit") return nodeId !== journeyCurrentId;
    // travelling: dim everything except current target and previous
    return nodeId !== journeyCurrentId;
  };

  // ─── 3D View ───────────────────────────────────────────────────────────────
  const render3D = () => {
    const allFloors = FLOOR_3D;

    // All edges across all 4 floors projected
    const allEdges3D = EDGES.map(([a, b]) => {
      const na = NODE_MAP[a], nb = NODE_MAP[b];
      if (!na || !nb) return null;
      // Skip "Out" floor in 3D
      if (na.floor === "Out" || nb.floor === "Out") return null;
      const key = [a, b].sort().join("|");
      const posA = proj3D(na.x, na.y, na.floor);
      const posB = proj3D(nb.x, nb.y, nb.floor);
      const activeSegKeys = journeyMode ? journeySegmentKeys : routeSegmentKeys;
      const isRoute = activeSegKeys ? activeSegKeys.has(key) : routeSegmentKeys.has(key);
      return { a, b, posA, posB, isRoute, isCrossFloor: na.floor !== nb.floor };
    }).filter(Boolean);

    // All route stop nodes projected
    const allNodes3D = NODES
      .filter((n) => n.floor !== "Out" && FLOOR_LEVELS[n.floor] !== undefined)
      .map((node) => {
        const pos = proj3D(node.x, node.y, node.floor);
        return { node, ...pos };
      });

    return (
      <svg
        viewBox="30 10 1000 720"
        style={{ width: "100%", height: "auto", display: "block", maxHeight: 560 }}
        onClick={(e) => { if (e.currentTarget === e.target) setSelectedNode(null); }}
      >
        <rect x={30} y={10} width={1000} height={720} fill="#f8f7f4" />

        {/* Floor band backgrounds and labels */}
        {allFloors.map(({ id, level, label, color }) => {
          const { top, bottom } = floor3DYRange(id);
          const xOffset = (level - 1) * 22;
          return (
            <g key={`band-${id}`}>
              <rect
                x={40 + xOffset}
                y={top}
                width={940}
                height={bottom - top}
                rx={6}
                fill={color}
                opacity={0.04}
                stroke={color}
                strokeWidth={0.8}
                strokeOpacity={0.2}
              />
              <text
                x={44 + xOffset}
                y={top + 14}
                fontSize={11}
                fill={color}
                fontFamily="DM Sans,sans-serif"
                fontWeight={600}
                opacity={0.7}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Separator lines between floors */}
        {allFloors.slice(0, -1).map(({ id }) => {
          const { bottom } = floor3DYRange(id);
          return (
            <line
              key={`sep-${id}`}
              x1={40} y1={bottom + 16}
              x2={960} y2={bottom + 16}
              stroke="#e5e5e0"
              strokeWidth={1}
              strokeDasharray="6 4"
              opacity={0.6}
            />
          );
        })}

        {/* Vertical connector indicators at lift positions */}
        {["lift_hintze", "earth_hall"].map((gId) => {
          const gNode = NODE_MAP[gId];
          if (!gNode) return null;
          const floors = ["F2", "F1", "G", "LG"];
          const positions = floors.map((f) => {
            if (FLOOR_LEVELS[f] === undefined) return null;
            return proj3D(gNode.x, gNode.y, f);
          }).filter(Boolean);
          if (positions.length < 2) return null;
          return (
            <line
              key={`vert-${gId}`}
              x1={positions[0].px} y1={positions[0].py}
              x2={positions[positions.length - 1].px} y2={positions[positions.length - 1].py}
              stroke="#bbb"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.5}
            />
          );
        })}

        {/* Non-route edges (faint) */}
        {allEdges3D
          .filter((e) => !e.isRoute)
          .map(({ a, b, posA, posB, isCrossFloor }) => (
            <line
              key={`e3d-${a}-${b}`}
              x1={posA.px} y1={posA.py}
              x2={posB.px} y2={posB.py}
              stroke="#ccc"
              strokeWidth={isCrossFloor ? 1 : 1.5}
              strokeDasharray={isCrossFloor ? "3 3" : undefined}
              opacity={0.4}
            />
          ))}

        {/* Route path edges (amber) */}
        {allEdges3D
          .filter((e) => e.isRoute)
          .map(({ a, b, posA, posB, isCrossFloor }) => (
            <line
              key={`r3d-${a}-${b}`}
              x1={posA.px} y1={posA.py}
              x2={posB.px} y2={posB.py}
              stroke="#C67A1E"
              strokeWidth={isCrossFloor ? 3 : 3.5}
              strokeLinecap="round"
              strokeDasharray={isCrossFloor ? "5 3" : undefined}
              opacity={0.85}
            />
          ))}

        {/* Non-route nodes */}
        {allNodes3D
          .filter(({ node }) => stopIndex[node.id] === undefined)
          .map(({ node, px, py }) => {
            const isSelected = selectedNode?.id === node.id;
            const color = ZONE_COLORS[node.zone] || "#888";
            const dimmed = journeyDim(node.id);
            return (
              <g
                key={`n3d-${node.id}`}
                onClick={(e) => { e.stopPropagation(); handleNodeClick(node); }}
                style={{ cursor: "pointer" }}
              >
                {isSelected && (
                  <circle cx={px} cy={py} r={14} fill="none" stroke="#C67A1E" strokeWidth={2} opacity={0.4} />
                )}
                <circle
                  cx={px} cy={py} r={6}
                  fill={isSelected ? color : "#fff"}
                  stroke={isSelected ? "#C67A1E" : color}
                  strokeWidth={isSelected ? 2 : 1.5}
                  opacity={dimmed ? 0.2 : 0.8}
                />
              </g>
            );
          })}

        {/* Route stop nodes */}
        {route.map((id) => {
          const node = NODE_MAP[id];
          if (!node || node.floor === "Out" || FLOOR_LEVELS[node.floor] === undefined) return null;
          const { px, py } = proj3D(node.x, node.y, node.floor);
          const stopNum = stopIndex[id];
          const isSelected = selectedNode?.id === id;
          const color = ZONE_COLORS[node.zone] || "#888";
          const isFirst = stopNum === 1;
          const isLast = stopNum === route.length;
          const fillColor = isFirst ? "#22863a" : isLast ? "#B03028" : color;
          const isCurrent = journeyMode && id === journeyCurrentId;
          const dimmed = journeyDim(id);

          return (
            <g
              key={`s3d-${id}`}
              onClick={(e) => { e.stopPropagation(); handleNodeClick(node); }}
              style={{ cursor: "pointer" }}
            >
              {isCurrent && (
                <>
                  <style>{`
                    @keyframes nhm-pulse3d {
                      0%, 100% { r: 20; opacity: 0.3; }
                      50% { r: 26; opacity: 0.1; }
                    }
                  `}</style>
                  <circle cx={px} cy={py} r={20} fill="#C67A1E" opacity={0.25}>
                    <animate attributeName="r" values="18;24;18" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
              {isSelected && (
                <circle cx={px} cy={py} r={18} fill="none" stroke="#C67A1E" strokeWidth={2} opacity={0.5} />
              )}
              <circle
                cx={px} cy={py} r={11}
                fill={isCurrent ? "#C67A1E" : fillColor}
                stroke="#fff"
                strokeWidth={2}
                opacity={dimmed ? 0.2 : 1}
              />
              <text
                x={px} y={py + 4}
                textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff"
                fontFamily="DM Sans,sans-serif"
                opacity={dimmed ? 0.2 : 1}
              >
                {stopNum}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // ─── 2D View ────────────────────────────────────────────────────────────────
  const render2D = () => (
    <svg
      viewBox="0 0 1000 650"
      style={{ width: "100%", height: "auto", display: "block", maxHeight: 480 }}
      onClick={(e) => { if (e.currentTarget === e.target) setSelectedNode(null); }}
    >
      <rect x={0} y={0} width={1000} height={650} fill="#f8f7f4" />

      <text x={16} y={30} fontSize={14} fill="#ccc" fontFamily="DM Sans,sans-serif" fontWeight={600}>
        {FLOOR_LABELS[activeFloor] || activeFloor}
      </text>

      {/* ── SVG floor plan background ── */}
      {activeFloor === "G" && (
        <g>
          {/* Main building shell */}
          <rect x={60} y={120} width={890} height={350} fill="#f9f8f6" stroke="#2a2a2a" strokeWidth={2} />

          {/* Zone tints */}
          <rect x={60}  y={120} width={230} height={350} fill={ZONE_COLORS.orange} opacity={0.05} />
          <rect x={290} y={120} width={270} height={350} fill={ZONE_COLORS.blue}   opacity={0.05} />
          <rect x={560} y={120} width={200} height={350} fill={ZONE_COLORS.green}  opacity={0.05} />
          <rect x={760} y={120} width={190} height={350} fill={ZONE_COLORS.red}    opacity={0.05} />

          {/* Major zone dividers */}
          <line x1={290} y1={120} x2={290} y2={470} stroke="#c0bfbc" strokeWidth={1.5} />
          <line x1={560} y1={120} x2={560} y2={470} stroke="#c0bfbc" strokeWidth={1.5} />
          <line x1={760} y1={120} x2={760} y2={470} stroke="#c0bfbc" strokeWidth={1.5} />

          {/* Blue zone internal walls */}
          <line x1={420} y1={120} x2={420} y2={470} stroke="#ddd" strokeWidth={1} />
          <line x1={290} y1={235} x2={560} y2={235} stroke="#ddd" strokeWidth={1} />
          <line x1={290} y1={310} x2={560} y2={310} stroke="#ddd" strokeWidth={1} />
          <line x1={290} y1={420} x2={420} y2={420} stroke="#ddd" strokeWidth={1} />

          {/* Green zone internal walls */}
          <line x1={660} y1={120} x2={660} y2={470} stroke="#ddd" strokeWidth={1} />
          <line x1={560} y1={220} x2={660} y2={220} stroke="#ddd" strokeWidth={1} />
          <line x1={560} y1={308} x2={660} y2={308} stroke="#ddd" strokeWidth={1} />
          <line x1={560} y1={400} x2={660} y2={400} stroke="#ddd" strokeWidth={1} />

          {/* Red zone internal wall */}
          <line x1={760} y1={280} x2={875} y2={280} stroke="#ddd" strokeWidth={1} />

          {/* Orange zone shelf divider */}
          <line x1={60} y1={378} x2={290} y2={378} stroke="#ddd" strokeWidth={1} />

          {/* Darwin Centre — cocoon oval (distinctive spiral building) */}
          <ellipse cx={195} cy={232} rx={56} ry={92} fill="#f0ede8" stroke="#999" strokeWidth={1.5} strokeDasharray="5 2.5" />
          <ellipse cx={195} cy={232} rx={38} ry={65} fill="none"    stroke="#bbb" strokeWidth={0.8} strokeDasharray="3 2" />
          <ellipse cx={195} cy={232} rx={20} ry={40} fill="none"    stroke="#ccc" strokeWidth={0.5} strokeDasharray="2 2" />

          {/* Cromwell Road entrance protrusion (south) */}
          <rect x={432} y={470} width={116} height={82} fill="#f9f8f6" stroke="#2a2a2a" strokeWidth={2} />
          <polygon points="490,548 477,530 503,530" fill="#444" opacity={0.5} />

          {/* Wildlife Garden — separate to SW */}
          <rect x={28} y={492} width={162} height={108} rx={6} fill="#edf5ed" stroke="#aaa" strokeWidth={1} />
          <ellipse cx={80} cy={548} rx={28} ry={20} fill="#cde8f2" stroke="#9bc" strokeWidth={0.8} />
          <text x={135} y={530} fontSize={8} fill="#888" fontFamily="DM Sans,sans-serif">Wildlife</text>
          <text x={135} y={542} fontSize={8} fill="#888" fontFamily="DM Sans,sans-serif">Garden</text>

          {/* Zone labels */}
          {[
            { x: 175, label: "ORANGE", color: ZONE_COLORS.orange },
            { x: 425, label: "BLUE",   color: ZONE_COLORS.blue   },
            { x: 660, label: "GREEN",  color: ZONE_COLORS.green  },
            { x: 855, label: "RED",    color: ZONE_COLORS.red    },
          ].map(({ x, label, color }) => (
            <text key={label} x={x} y={136} textAnchor="middle" fontSize={8}
              fill={color} opacity={0.4} fontFamily="DM Sans,sans-serif"
              fontWeight={700} letterSpacing={2}>{label}</text>
          ))}

          {/* Key space labels */}
          <text x={475} y={416} textAnchor="middle" fontSize={7.5} fill="#bbb" fontFamily="DM Sans,sans-serif" fontStyle="italic">Hintze Hall</text>
          <text x={855} y={293} textAnchor="middle" fontSize={7.5} fill="#bbb" fontFamily="DM Sans,sans-serif" fontStyle="italic">Earth Hall</text>
          <text x={196} y={230} textAnchor="middle" fontSize={6.5} fill="#bbb" fontFamily="DM Sans,sans-serif" fontStyle="italic">Cocoon</text>

          {/* Wall notches for side entrances */}
          <rect x={50}  y={279} width={10} height={32} fill="#888" rx={1} opacity={0.35} />
          <rect x={940} y={279} width={10} height={32} fill="#888" rx={1} opacity={0.35} />

          {/* Courtyard label */}
          <text x={175} y={110} textAnchor="middle" fontSize={8} fill="#ccc" fontFamily="DM Sans,sans-serif">Courtyard</text>
        </g>
      )}

      {activeFloor === "LG" && (
        <g>
          <rect x={60} y={120} width={890} height={350} fill="#f9f8f6" stroke="#2a2a2a" strokeWidth={1.5} strokeDasharray="8 4" opacity={0.5} />
          <text x={500} y={108} textAnchor="middle" fontSize={10} fill="#ccc" fontFamily="DM Sans,sans-serif">Lower Ground Floor</text>
        </g>
      )}

      {/* Non-route edges */}
      {floorEdges
        .filter((e) => !e.isRoute)
        .map(({ a, b, isCrossFloor }) => {
          const na = NODE_MAP[a], nb = NODE_MAP[b];
          if (!na || !nb) return null;
          return (
            <line
              key={`edge-${a}-${b}`}
              x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke="#ccc" strokeWidth={1.5}
              strokeDasharray={isCrossFloor ? "4 3" : undefined}
              opacity={0.6}
            />
          );
        })}

      {/* Route path edges */}
      {floorEdges
        .filter((e) => e.isRoute)
        .map(({ a, b, isCrossFloor }) => {
          const na = NODE_MAP[a], nb = NODE_MAP[b];
          if (!na || !nb) return null;
          return (
            <line
              key={`route-${a}-${b}`}
              x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke="#C67A1E" strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={isCrossFloor ? "6 4" : undefined}
              opacity={0.85}
            />
          );
        })}

      {/* Gateway markers */}
      {activeFloor !== "G" &&
        (FLOOR_GATEWAYS[activeFloor] || []).map((gId) => {
          const gn = NODE_MAP[gId];
          if (!gn) return null;
          if (stopIndex[gId] !== undefined) return null;
          return (
            <g key={`gw-${gId}`}>
              <circle cx={gn.x} cy={gn.y} r={18} fill="none" stroke="#bbb" strokeWidth={1.5} strokeDasharray="5 3" />
              <text x={gn.x} y={gn.y + 4} textAnchor="middle" fontSize={12} fill="#bbb" fontFamily="DM Sans,sans-serif">↕</text>
              <text x={gn.x} y={gn.y - 24} textAnchor="middle" fontSize={9} fill="#ccc" fontFamily="DM Sans,sans-serif">via Ground</text>
            </g>
          );
        })}

      {/* Non-route nodes */}
      {floorNodes
        .filter((n) => stopIndex[n.id] === undefined)
        .map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const color = ZONE_COLORS[node.zone] || "#888";
          const isFacility = node.zone === "facility";
          const isEntrance = node.zone === "entrance";
          const r = isFacility ? 6 : 9;
          const dimmed = journeyDim(node.id);
          const cScore = congestionScores[node.id];
          const cColor = cScore != null ? getCongestionColor(cScore) : null;
          const cLevel = cScore != null ? getCongestionLevel(cScore) : null;

          return (
            <g key={node.id} onClick={(e) => { e.stopPropagation(); handleNodeClick(node); }} style={{ cursor: "pointer" }}>
              {isSelected && (
                <circle cx={node.x} cy={node.y} r={r + 7} fill="none" stroke="#C67A1E" strokeWidth={2} opacity={0.4} />
              )}
              {isEntrance ? (
                <polygon
                  points={`${node.x},${node.y - 9} ${node.x - 8},${node.y + 6} ${node.x + 8},${node.y + 6}`}
                  fill={isSelected ? "#C67A1E" : color}
                  stroke="#fff" strokeWidth={1.5}
                  opacity={dimmed ? 0.15 : 0.75}
                />
              ) : (
                <circle
                  cx={node.x} cy={node.y} r={r}
                  fill={isSelected ? color : "#fff"}
                  stroke={isSelected ? "#C67A1E" : color}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  opacity={dimmed ? 0.15 : (isFacility ? 0.6 : 0.8)}
                />
              )}
              {/* Congestion indicator dot (top-right of node) */}
              {!isFacility && !isEntrance && !dimmed && cColor && cLevel !== "low" && (
                <circle
                  cx={node.x + r - 1} cy={node.y - r + 1} r={3.5}
                  fill={cColor} stroke="#fff" strokeWidth={1}
                  opacity={0.9}
                />
              )}
              {!isFacility && !dimmed && (
                <text x={node.x} y={node.y - r - 4} textAnchor="middle" fontSize={9} fill="#aaa" fontFamily="DM Sans,sans-serif">
                  {node.name.length > 20 ? node.name.slice(0, 19) + "…" : node.name}
                </text>
              )}
              {isFacility && !dimmed && (
                <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={8} fill="#aaa">
                  {node.name.toLowerCase().includes("café") || node.name.toLowerCase().includes("grill") ? "☕" : "🛍"}
                </text>
              )}
            </g>
          );
        })}

      {/* Route stop nodes */}
      {route
        .filter((id) => {
          const n = NODE_MAP[id];
          return n && (n.floor === activeFloor || (FLOOR_GATEWAYS[activeFloor] || []).includes(id));
        })
        .map((id) => {
          const node = NODE_MAP[id];
          if (!node) return null;
          const stopNum = stopIndex[id];
          const isSelected = selectedNode?.id === id;
          const color = ZONE_COLORS[node.zone] || "#888";
          const isFirst = stopNum === 1;
          const isLast = stopNum === route.length;
          const fillColor = isFirst ? "#22863a" : isLast ? "#B03028" : color;
          const isCurrent = journeyMode && id === journeyCurrentId;
          const dimmed = journeyDim(id);

          const cScore = congestionScores[id];
          const cColor = cScore != null ? getCongestionColor(cScore) : null;

          return (
            <g key={`stop-${id}`} onClick={(e) => { e.stopPropagation(); handleNodeClick(node); }} style={{ cursor: "pointer" }}>
              {/* Congestion ring behind the stop circle */}
              {!dimmed && cColor && getCongestionLevel(cScore) !== "low" && (
                <circle
                  cx={node.x} cy={node.y} r={19}
                  fill="none" stroke={cColor} strokeWidth={2.5}
                  opacity={0.55}
                />
              )}
              {isCurrent && (
                <>
                  <style>{`
                    @keyframes nhm-pulse {
                      0%, 100% { opacity: 0.3; }
                      50% { opacity: 0.1; }
                    }
                  `}</style>
                  <circle cx={node.x} cy={node.y} fill="#C67A1E" opacity={0.25}>
                    <animate attributeName="r" values="20;28;20" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
              {isSelected && (
                <circle cx={node.x} cy={node.y} r={22} fill="none" stroke="#C67A1E" strokeWidth={2.5} opacity={0.5} />
              )}
              <circle
                cx={node.x} cy={node.y} r={15}
                fill={isCurrent ? "#C67A1E" : fillColor}
                stroke="#fff" strokeWidth={2.5}
                opacity={dimmed ? 0.2 : 1}
              />
              <text
                x={node.x} y={node.y + 5}
                textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff" fontFamily="DM Sans,sans-serif"
                opacity={dimmed ? 0.2 : 1}
              >
                {stopNum}
              </text>
              {!dimmed && (
                <text x={node.x} y={node.y - 20} textAnchor="middle" fontSize={10} fontWeight={600} fill="#333" fontFamily="DM Sans,sans-serif">
                  {node.name.length > 18 ? node.name.slice(0, 17) + "…" : node.name}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>

      {/* Toolbar row: floor tabs (left) + 3D toggle (right) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        {/* Floor tabs — hidden in 3D mode */}
        {!view3D ? (
          <div style={{ display: "flex", borderBottom: "2px solid #e5e5e0", flex: 1, overflowX: "auto" }}>
            {FLOOR_TABS.map((tab) => {
              const hasStops = routeFloors.has(tab.id);
              const isActive = activeFloor === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveFloor(tab.id); setSelectedNode(null); }}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    borderBottom: isActive ? "2px solid #C67A1E" : "2px solid transparent",
                    marginBottom: -2,
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#C67A1E" : "#666",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    transition: "color 0.15s",
                  }}
                >
                  {tab.label}
                  {hasStops && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#C67A1E", flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ flex: 1, height: 34, display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#aaa" }}>All floors — 3D overview</span>
          </div>
        )}

        {/* 3D toggle button */}
        <button
          onClick={() => { setView3D((v) => !v); setSelectedNode(null); }}
          style={{
            marginLeft: 6,
            padding: "6px 12px",
            borderRadius: 8,
            border: `1px solid ${view3D ? "#C67A1E" : "#ddd"}`,
            background: view3D ? "#FFF8F0" : "transparent",
            cursor: "pointer",
            fontSize: 12,
            color: view3D ? "#C67A1E" : "#666",
            fontFamily: "inherit",
            fontWeight: view3D ? 600 : 400,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {view3D ? "🏢 3D" : "🏢 3D View"}
        </button>
      </div>

      {/* SVG Map container */}
      <div
        style={{
          background: "#f8f7f4",
          borderRadius: 12,
          border: "1px solid #e5e5e0",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {view3D ? render3D() : render2D()}

        {/* Legend */}
        <div
          style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(255,255,255,0.92)",
            borderRadius: 8, border: "1px solid #e5e5e0",
            padding: "8px 10px", fontSize: 11, color: "#666",
            display: "flex", flexDirection: "column", gap: 5,
          }}
        >
          {route.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 22, height: 3, background: "#C67A1E", borderRadius: 2 }} />
              <span>Your route</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#22863a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 8, fontWeight: 700 }}>S</div>
            <span>Start</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#B03028", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 8, fontWeight: 700 }}>E</div>
            <span>End</span>
          </div>
          {!view3D && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", border: "1.5px solid #888" }} />
              <span>Other exhibit</span>
            </div>
          )}
          {/* Congestion key */}
          <div style={{ borderTop: "1px solid #eee", marginTop: 2, paddingTop: 5, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Now</span>
            {[
              { color: "#B03028", label: "Busy" },
              { color: "#C67A1E", label: "Moderate" },
              { color: "#22863a", label: "Quiet" },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exhibit info panel */}
      {selectedNode && (
        <div
          style={{
            marginTop: 16, background: "#fff", borderRadius: 12,
            border: "1px solid #e5e5e0", boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
            padding: "20px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: ZONE_COLORS[selectedNode.zone] || "#888", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {ZONE_LABELS[selectedNode.zone]} · {FLOOR_LABELS[selectedNode.floor] || selectedNode.floor}
                </span>
                {selectedStopNum != null && (
                  <span style={{
                    background: selectedStopNum === 1 ? "#22863a" : selectedStopNum === route.length ? "#B03028" : "#C67A1E",
                    color: "#fff", borderRadius: 6, padding: "1px 8px", fontSize: 11, fontWeight: 700,
                  }}>
                    Stop {selectedStopNum} of {route.length}
                  </span>
                )}
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#1a1a1a" }}>
                {selectedNode.name}
              </h3>
              <p style={{ margin: "0 0 8px", fontSize: 14, color: "#555", lineHeight: 1.5 }}>
                {selectedNode.desc}
              </p>
              {selectedNode.dur > 0 && (
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 10 }}>
                  ⏱ ~{selectedNode.dur} min suggested visit
                </div>
              )}
              {selectedStopInfo && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  <div style={{ background: "#FFF8F0", borderLeft: "3px solid #C67A1E", borderRadius: "0 6px 6px 0", padding: "8px 12px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#C67A1E", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Why it's on your route</div>
                    <div style={{ fontSize: 13, color: "#444", lineHeight: 1.45 }}>{selectedStopInfo.reason}</div>
                  </div>
                  {selectedStopInfo.tip && (
                    <div style={{ background: "#f8f8f6", borderLeft: "3px solid #aaa", borderRadius: "0 6px 6px 0", padding: "8px 12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tip</div>
                      <div style={{ fontSize: 13, color: "#444", lineHeight: 1.45 }}>{selectedStopInfo.tip}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ccc", fontSize: 18, padding: 4, lineHeight: 1, flexShrink: 0 }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!selectedNode && (
        <p style={{ textAlign: "center", fontSize: 12, color: "#ccc", marginTop: 10 }}>
          {view3D
            ? "3D view — tap any exhibit to learn more"
            : "Tap any exhibit to learn more · Switch floors using the tabs above"}
        </p>
      )}
    </div>
  );
}
