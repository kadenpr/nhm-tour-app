import { useState } from "react";
import { getSavedRoutes, deleteRoute } from "../utils/savedRoutes";

export default function SavedRoutesScreen({ onLoad, onClose }) {
  const [routes, setRoutes] = useState(() => getSavedRoutes());

  const handleDelete = (id) => {
    deleteRoute(id);
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <>
      <style>{`
        @keyframes nhm-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes nhm-modal-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 1100,
          animation: "nhm-fade-in 0.18s ease",
        }}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(520px, calc(100vw - 32px))",
          maxHeight: "calc(100vh - 48px)",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          zIndex: 1200,
          display: "flex",
          flexDirection: "column",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
          animation: "nhm-modal-up 0.22s ease",
          overflow: "hidden",
        }}
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
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>
              📚 Saved Routes
            </div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
              {routes.length} saved on this device
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

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {routes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>No saved routes yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Generate a route and press 💾 Save to store it here
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {routes.map((entry) => {
                const stops = entry.routeData?.stops || [];
                const minutes = entry.routeData?.totalMinutes ?? 0;
                return (
                  <div
                    key={entry.id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "1px solid #e5e5e0",
                      background: "#fafaf7",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a1a", marginBottom: 2 }}>
                        {entry.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>
                        {entry.date} · {stops.length} stops · ~{minutes} min
                      </div>
                      {entry.routeData?.summary && (
                        <div
                          style={{
                            fontSize: 12, color: "#777", marginTop: 4,
                            lineHeight: 1.4,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {entry.routeData.summary}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        style={{
                          width: 32, height: 32,
                          borderRadius: 8, border: "1px solid #eee",
                          background: "#fff", cursor: "pointer",
                          color: "#ccc", fontSize: 14,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title="Delete"
                      >
                        🗑
                      </button>
                      <button
                        onClick={() => onLoad(entry)}
                        style={{
                          padding: "0 14px", height: 32,
                          borderRadius: 8, border: "none",
                          background: "#C67A1E", cursor: "pointer",
                          color: "#fff", fontSize: 13, fontWeight: 600,
                          fontFamily: "inherit",
                        }}
                      >
                        Load
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
