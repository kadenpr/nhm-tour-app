import { useState } from "react";

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

/** Shown after route generation – lets you enter a ticket code to save the route */
export function TicketEntry({ routeData, onActivate, onSkip }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleActivate = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter your ticket code.");
      return;
    }
    onActivate(trimmed);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafaf7",
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <TicketCard routeData={routeData}>
        {/* Code entry section */}
        <div style={{ padding: "20px 24px 24px" }}>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 14, textAlign: "center", lineHeight: 1.5 }}>
            Enter the code printed on your NHM ticket to save this route and track your visit.
          </div>

          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleActivate()}
            placeholder="e.g. NHM-2026-XKQR"
            maxLength={20}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: `1.5px solid ${error ? "#B03028" : "#e5e5e0"}`,
              fontSize: 16,
              fontFamily: FONT,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textAlign: "center",
              outline: "none",
              boxSizing: "border-box",
              background: "#fafaf7",
              color: "#1a1a1a",
              marginBottom: error ? 6 : 14,
            }}
            autoFocus
          />

          {error && (
            <div style={{ fontSize: 12, color: "#B03028", marginBottom: 12, textAlign: "center" }}>
              {error}
            </div>
          )}

          <button
            onClick={handleActivate}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 10,
              border: "none",
              background: "#C67A1E",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: FONT,
              marginBottom: 10,
            }}
          >
            🎟️ Activate Ticket
          </button>

          <button
            onClick={onSkip}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 10,
              border: "1px solid #e5e5e0",
              background: "transparent",
              color: "#aaa",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            Continue without saving
          </button>
        </div>
      </TicketCard>

      <p style={{ fontSize: 11, color: "#ccc", marginTop: 16, textAlign: "center" }}>
        Your route is valid until midnight today
      </p>
    </div>
  );
}

/** Shown on app load when a previously saved ticket exists */
export function SavedTicketScreen({ ticket, routeData, onResume, onNew }) {
  const isExpired = ticket.status === "expired";
  const isCompleted = ticket.status === "completed";
  const isDone = isExpired || isCompleted;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafaf7",
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {isDone ? (
        /* Expired or completed — greyed-out ticket */
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎟️</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>
            {isCompleted ? "Visit Complete" : "Ticket Expired"}
          </div>
          <div style={{ fontSize: 14, color: "#888", maxWidth: 320, lineHeight: 1.5 }}>
            {isCompleted
              ? `Your visit with ticket ${ticket.code} is complete. We hope you enjoyed it!`
              : `Your ticket ${ticket.code} was for ${formatDate(ticket.date)} and has expired.`}
          </div>
        </div>
      ) : (
        /* Valid ticket found */
        <>
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 13, color: "#C67A1E", fontWeight: 600, marginBottom: 4 }}>
              Welcome back!
            </div>
          </div>
          <TicketCard routeData={routeData} code={ticket.code} active>
            <div style={{ padding: "16px 24px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 14, lineHeight: 1.5 }}>
                Your saved route is valid today. Pick up where you left off!
              </div>
              <button
                onClick={onResume}
                style={{
                  width: "100%",
                  padding: "12px 0",
                  borderRadius: 10,
                  border: "none",
                  background: "#C67A1E",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: FONT,
                  marginBottom: 10,
                }}
              >
                ▶ Resume my visit
              </button>
            </div>
          </TicketCard>
        </>
      )}

      <button
        onClick={onNew}
        style={{
          marginTop: 14,
          padding: "11px 28px",
          borderRadius: 10,
          border: "1px solid #ddd",
          background: "transparent",
          color: "#666",
          fontSize: 14,
          cursor: "pointer",
          fontFamily: FONT,
          fontWeight: 500,
        }}
      >
        Plan a new route
      </button>
    </div>
  );
}

// ─── Shared ticket card visual ────────────────────────────────────────────────

function TicketCard({ routeData, code, active = false, children }) {
  const stops = routeData?.stops?.length || 0;
  const mins = routeData?.totalMinutes || 0;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 400,
        background: active ? "#fff" : "#fff",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        overflow: "hidden",
        border: active ? "2px solid #C67A1E" : "2px solid #e5e5e0",
        position: "relative",
      }}
    >
      {/* Ticket header */}
      <div
        style={{
          background: active ? "#C67A1E" : "#1a1a1a",
          padding: "18px 24px 14px",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>🏛️ NHM Tour</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
              Natural History Museum London
            </div>
          </div>
          {active && (
            <div
              style={{
                background: "rgba(255,255,255,0.2)",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              VALID TODAY
            </div>
          )}
        </div>
      </div>

      {/* Perforated tear line */}
      <TearLine />

      {/* Route summary */}
      <div style={{ padding: "16px 24px 0", display: "flex", gap: 24 }}>
        <StatBox label="Stops" value={stops} />
        <StatBox label="Duration" value={`~${mins} min`} />
        {code && <StatBox label="Ticket" value={code} mono />}
      </div>

      {/* Narrative preview */}
      {routeData?.narrative && (
        <div
          style={{
            margin: "12px 24px 0",
            padding: "10px 12px",
            background: "#fafaf7",
            borderRadius: 8,
            fontSize: 12,
            color: "#666",
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          "{routeData.narrative.slice(0, 120)}{routeData.narrative.length > 120 ? "…" : ""}"
        </div>
      )}

      {/* Bottom perforated tear line */}
      <TearLine style={{ marginTop: 14 }} />

      {/* Children (input / buttons) */}
      {children}
    </div>
  );
}

function TearLine({ style }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 0",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          borderTop: "2px dashed #e5e5e0",
          margin: "0 16px",
        }}
      />
      {/* Left notch */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fafaf7",
          border: "2px solid #e5e5e0",
          transform: "translateX(-50%)",
        }}
      />
      {/* Right notch */}
      <div
        style={{
          position: "absolute",
          right: 0,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fafaf7",
          border: "2px solid #e5e5e0",
          transform: "translateX(50%)",
        }}
      />
    </div>
  );
}

function StatBox({ label, value, mono = false }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#1a1a1a",
          fontFamily: mono ? "monospace" : FONT,
          letterSpacing: mono ? "0.08em" : 0,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long",
    });
  } catch {
    return dateStr;
  }
}
