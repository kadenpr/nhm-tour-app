import { useState } from "react";

export default function SaveRouteModal({ routeData, onSave, onClose }) {
  const defaultName = `Visit on ${new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })}`;
  const [name, setName] = useState(defaultName);

  const stopCount = routeData?.stops?.length ?? 0;
  const minutes = routeData?.totalMinutes ?? 0;

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
          width: "min(420px, calc(100vw - 32px))",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          zIndex: 1200,
          padding: "24px 24px 20px",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
          animation: "nhm-modal-up 0.22s ease",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>💾</div>
        <div style={{ fontWeight: 700, fontSize: 17, color: "#1a1a1a", marginBottom: 4 }}>
          Save this route
        </div>
        <div style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>
          {stopCount} stops · ~{minutes} min · saved to this device
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#888", display: "block", marginBottom: 6 }}>
          Route name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && onSave(name)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1.5px solid #e5e5e0",
            fontSize: 14,
            fontFamily: "inherit",
            color: "#1a1a1a",
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 20,
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 10,
              border: "1px solid #ddd", background: "transparent",
              cursor: "pointer", fontSize: 14, color: "#666",
              fontFamily: "inherit", fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name)}
            style={{
              flex: 2, padding: "11px 0", borderRadius: 10,
              border: "none", background: "#1a1a1a",
              cursor: "pointer", fontSize: 14, color: "#fff",
              fontFamily: "inherit", fontWeight: 700,
            }}
          >
            Save route
          </button>
        </div>
      </div>
    </>
  );
}
