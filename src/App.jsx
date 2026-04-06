import { useState, useEffect } from "react";
import Questionnaire from "./components/Questionnaire";
import FollowUpQuestions from "./components/FollowUpQuestions";
import NHMMap from "./components/NHMMap";
import JourneyPanel from "./components/JourneyPanel";
import EditRoute from "./components/EditRoute";
import { TicketEntry, SavedTicketScreen } from "./components/TicketGate";
import SaveRouteModal from "./components/SaveRouteModal";
import SavedRoutesScreen from "./components/SavedRoutesScreen";
import { generateRoute, refineRoute } from "./api/generateRoute";
import { loadTicket, saveTicket, updateTicket, clearTicket, ticketStatus, todayStr } from "./utils/ticket";
import { getSavedRoutes, saveRoute } from "./utils/savedRoutes";

export default function App() {
  // phases: questionnaire | generating-preview | follow-up | generating | ticket | welcome-back | result
  const [phase, setPhase] = useState("questionnaire");
  const [initialAnswers, setInitialAnswers] = useState(null);
  const [previewRoute, setPreviewRoute] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  // Ticket state
  const [ticketCode, setTicketCode] = useState(null);
  const [savedTicket, setSavedTicket] = useState(null);

  // Share state
  const [shareCopied, setShareCopied] = useState(false);

  // Save / saved routes state
  const [savingRoute, setSavingRoute] = useState(false);
  const [savedRoutesOpen, setSavedRoutesOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(() => getSavedRoutes().length);

  // Journey mode state
  const [journeyMode, setJourneyMode] = useState(false);
  const [journeyStopIndex, setJourneyStopIndex] = useState(0);
  const [journeyStep, setJourneyStep] = useState("at-exhibit");

  // Edit route state
  const [editingRoute, setEditingRoute] = useState(false);

  // On mount: check for shared route in URL hash, then saved ticket in localStorage
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#route=")) {
      try {
        const data = JSON.parse(atob(hash.slice(7)));
        if (data?.stops?.length) {
          setRouteData(data);
          setPhase("result");
          // Clean up the URL
          window.history.replaceState(null, "", window.location.pathname);
          return;
        }
      } catch {
        // Invalid hash — fall through to normal flow
      }
    }

    const ticket = loadTicket();
    const status = ticketStatus(ticket);
    if (status !== null) {
      setSavedTicket({ ...ticket, status });
      setPhase("welcome-back");
    }
  }, []);

  const handleSubmit = async (answers) => {
    setInitialAnswers(answers);
    setPhase("generating-preview");
    setProgress(0);
    setError(null);
    try {
      const data = await generateRoute(answers, (p) => setProgress(p));
      setPreviewRoute(data);
      setPhase("follow-up");
    } catch (e) {
      console.error(e);
      setError(e.message || "Something went wrong. Please try again.");
      setPhase("questionnaire");
    }
  };

  const handleFollowUpSubmit = async (followUpAnswers) => {
    if (followUpAnswers.skip.length === 0 && followUpAnswers.addGems.length === 0) {
      setRouteData(previewRoute);
      setPhase("ticket");
      return;
    }
    setPhase("generating");
    setProgress(0);
    setError(null);
    try {
      const data = await refineRoute(initialAnswers, previewRoute, followUpAnswers, (p) => setProgress(p));
      setRouteData(data);
      setPhase("ticket");
    } catch (e) {
      console.error(e);
      setError(e.message || "Something went wrong. Please try again.");
      setPhase("follow-up");
    }
  };

  // Ticket handlers
  const handleTicketActivate = (code) => {
    const ticketData = { code, date: todayStr(), routeData, completed: false };
    saveTicket(ticketData);
    setTicketCode(code);
    setPhase("result");
  };

  const handleTicketSkip = () => {
    setPhase("result");
  };

  const handleResumeSaved = () => {
    setRouteData(savedTicket.routeData);
    setTicketCode(savedTicket.code);
    setPhase("result");
  };

  const handleStartFresh = () => {
    clearTicket();
    setSavedTicket(null);
    setPhase("questionnaire");
    setInitialAnswers(null);
    setPreviewRoute(null);
    setRouteData(null);
    setError(null);
    setProgress(0);
    setJourneyMode(false);
    setJourneyStopIndex(0);
    setJourneyStep("at-exhibit");
    setEditingRoute(false);
    setTicketCode(null);
  };

  const handleReset = () => {
    clearTicket();
    setTicketCode(null);
    setSavedTicket(null);
    setPhase("questionnaire");
    setInitialAnswers(null);
    setPreviewRoute(null);
    setRouteData(null);
    setError(null);
    setProgress(0);
    setJourneyMode(false);
    setJourneyStopIndex(0);
    setJourneyStep("at-exhibit");
    setEditingRoute(false);
  };

  // Journey handlers
  const handleStartJourney = () => {
    setJourneyStopIndex(0);
    setJourneyStep("at-exhibit");
    setJourneyMode(true);
  };

  const handleJourneyArrive = () => {
    setJourneyStep("at-exhibit");
  };

  const handleJourneyNext = () => {
    const nextIdx = journeyStopIndex + 1;
    if (nextIdx >= routeData.stops.length) {
      setJourneyStep("done");
    } else {
      setJourneyStopIndex(nextIdx);
      setJourneyStep("travelling");
    }
  };

  const handleJourneyEnd = () => {
    // Mark ticket as completed when journey ends
    if (ticketCode) {
      updateTicket({ completed: true });
    }
    setJourneyMode(false);
    setJourneyStopIndex(0);
    setJourneyStep("at-exhibit");
  };

  // Edit route handler
  const handleRouteUpdate = (newStops) => {
    // Also update the saved ticket's routeData if we have one
    if (ticketCode) {
      updateTicket({ routeData: { ...routeData, stops: newStops } });
    }
    setRouteData((prev) => ({ ...prev, stops: newStops }));
    setEditingRoute(false);
  };

  // Share handler
  const handleShare = () => {
    const encoded = btoa(JSON.stringify(routeData));
    const url = `${window.location.origin}${window.location.pathname}#route=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  };

  // Save route handler
  const handleSaveRoute = (name) => {
    saveRoute(name, routeData);
    setSavedCount((c) => c + 1);
    setSavingRoute(false);
  };

  // Load a previously saved route
  const handleLoadSavedRoute = (entry) => {
    setRouteData(entry.routeData);
    setSavedRoutesOpen(false);
    setJourneyMode(false);
    setJourneyStopIndex(0);
    setJourneyStep("at-exhibit");
    setPhase("result");
  };

  // ── Phases ────────────────────────────────────────────────────────────────

  if (phase === "questionnaire") {
    return (
      <>
        <Questionnaire
          onSubmit={handleSubmit}
          error={error}
          onShowSaved={savedCount > 0 ? () => setSavedRoutesOpen(true) : null}
        />
        {savedRoutesOpen && (
          <SavedRoutesScreen
            onLoad={handleLoadSavedRoute}
            onClose={() => setSavedRoutesOpen(false)}
          />
        )}
      </>
    );
  }

  if (phase === "follow-up") {
    return <FollowUpQuestions previewRoute={previewRoute} onSubmit={handleFollowUpSubmit} />;
  }

  if (phase === "generating-preview" || phase === "generating") {
    const isRefining = phase === "generating";
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafaf7",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
          gap: 20,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 52 }}>{isRefining ? "✨" : "🏛️"}</div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#1a1a1a" }}>
          {isRefining ? "Refining your route…" : "Planning your perfect route…"}
        </h2>
        <p style={{ margin: 0, color: "#888", fontSize: 15, textAlign: "center", maxWidth: 360 }}>
          {isRefining
            ? "Applying your preferences and finding the best path."
            : "Claude is thinking about your interests and preferences to craft the ideal tour."}
        </p>
        <LoadingDots />
        {progress > 50 && (
          <p style={{ margin: 0, color: "#ccc", fontSize: 12 }}>Almost ready…</p>
        )}
      </div>
    );
  }

  if (phase === "ticket") {
    return (
      <TicketEntry
        routeData={routeData}
        onActivate={handleTicketActivate}
        onSkip={handleTicketSkip}
      />
    );
  }

  if (phase === "welcome-back") {
    return (
      <SavedTicketScreen
        ticket={savedTicket}
        routeData={savedTicket?.routeData}
        onResume={handleResumeSaved}
        onNew={handleStartFresh}
      />
    );
  }

  // ── Result phase ──────────────────────────────────────────────────────────
  const routeNodeIds = (routeData?.stops || []).map((s) => s.nodeId);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafaf7",
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 24px",
          borderBottom: "1px solid #e5e5e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
          flexShrink: 0,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏛️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", lineHeight: 1.2 }}>
              NHM Tour Planner
            </div>
            {ticketCode ? (
              <div style={{ fontSize: 11, color: "#C67A1E", fontWeight: 600 }}>
                🎟️ {ticketCode} · Valid today
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "#aaa" }}>Natural History Museum London</div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Save route button */}
          {!journeyMode && (
            <button
              onClick={() => setSavingRoute(true)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                color: "#555",
                fontFamily: "inherit",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              💾 Save
            </button>
          )}

          {/* My saved routes button */}
          {!journeyMode && savedCount > 0 && (
            <button
              onClick={() => setSavedRoutesOpen(true)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                color: "#555",
                fontFamily: "inherit",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              📚 My Routes
            </button>
          )}

          {/* Share button */}
          {!journeyMode && (
            <button
              onClick={handleShare}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: shareCopied ? "#f0faf0" : "transparent",
                cursor: "pointer",
                fontSize: 13,
                color: shareCopied ? "#358535" : "#555",
                fontFamily: "inherit",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.2s",
              }}
            >
              {shareCopied ? "✓ Link copied!" : "🔗 Share"}
            </button>
          )}

          {/* Edit Route button */}
          {!journeyMode && (
            <button
              onClick={() => setEditingRoute(true)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #C67A1E",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                color: "#C67A1E",
                fontFamily: "inherit",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              ✏️ Edit Route
            </button>
          )}

          {/* Start Journey button */}
          {!journeyMode && (
            <button
              onClick={handleStartJourney}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#C67A1E",
                cursor: "pointer",
                fontSize: 13,
                color: "#fff",
                fontFamily: "inherit",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              ▶ Start Journey
            </button>
          )}

          {/* Exit journey button */}
          {journeyMode && (
            <button
              onClick={handleJourneyEnd}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                color: "#888",
                fontFamily: "inherit",
                fontWeight: 500,
              }}
            >
              ✕ Exit Journey
            </button>
          )}

          <button
            onClick={handleReset}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
              color: "#555",
              fontFamily: "inherit",
              fontWeight: 500,
            }}
          >
            ← Plan another route
          </button>
        </div>
      </div>

      {/* Body — full-width map */}
      <div
        style={{
          flex: 1,
          padding: "16px 20px",
          overflowY: "auto",
          paddingBottom: journeyMode ? 220 : 16,
        }}
      >
        <NHMMap
          route={routeNodeIds}
          routeData={routeData}
          journeyMode={journeyMode}
          journeyStopIndex={journeyStopIndex}
          journeyStep={journeyStep}
        />
      </div>

      {/* Journey bottom panel */}
      {journeyMode && (
        <JourneyPanel
          routeData={routeData}
          currentIndex={journeyStopIndex}
          journeyStep={journeyStep}
          onArrive={handleJourneyArrive}
          onNext={handleJourneyNext}
          onEnd={handleJourneyEnd}
        />
      )}

      {/* Edit Route modal */}
      {editingRoute && (
        <EditRoute
          routeData={routeData}
          onSave={handleRouteUpdate}
          onClose={() => setEditingRoute(false)}
        />
      )}

      {/* Save Route modal */}
      {savingRoute && (
        <SaveRouteModal
          routeData={routeData}
          onSave={handleSaveRoute}
          onClose={() => setSavingRoute(false)}
        />
      )}

      {/* Saved Routes browser */}
      {savedRoutesOpen && (
        <SavedRoutesScreen
          onLoad={handleLoadSavedRoute}
          onClose={() => setSavedRoutesOpen(false)}
        />
      )}
    </div>
  );
}

function LoadingDots() {
  return (
    <>
      <style>{`
        @keyframes nhm-bounce {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div style={{ display: "flex", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: "#C67A1E",
              animation: `nhm-bounce 1.3s ease-in-out ${i * 0.22}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}
