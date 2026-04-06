import { useState, useMemo } from "react";

const ACCENT = "#1a1a1a";
const BORDER = "#e5e5e0";
const BG = "#fafaf7";

const ALL_STEPS = [
  {
    id: "visitStyle",
    question: "How would you like to explore today?",
    type: "single",
    options: [
      { value: "guided", label: "I know what I want", emoji: "🎯", desc: "You have specific exhibits in mind" },
      { value: "explore", label: "Surprise me", emoji: "🧭", desc: "Show me what the museum has to offer" },
      { value: "mixed", label: "A bit of both", emoji: "✨", desc: "Some must-sees plus hidden discoveries" },
    ],
  },
  {
    id: "specificExhibits",
    question: "Which exhibits are you hoping to see?",
    subtitle: "Enter names or keywords — e.g. 'blue whale, moon rocks, T-Rex' (optional)",
    type: "text",
    optional: true,
    placeholder: "Type exhibit names or keywords…",
    // Only shown when visitStyle is guided or mixed
    showWhen: (answers) => answers.visitStyle === "guided" || answers.visitStyle === "mixed",
  },
  {
    id: "duration",
    question: "How long do you have to explore?",
    type: "single",
    options: [
      { value: "1 hour", label: "1 hour", emoji: "⚡", desc: "Quick highlights tour" },
      { value: "2 hours", label: "2 hours", emoji: "🕐", desc: "A solid look around" },
      { value: "3-4 hours", label: "3–4 hours", emoji: "🌟", desc: "Deep dive exploration" },
      { value: "4+ hours", label: "Half a day +", emoji: "🏛️", desc: "Full immersive experience" },
    ],
  },
  {
    id: "interests",
    question: "What excites you most?",
    subtitle: "Pick as many as you like",
    type: "multi",
    options: [
      { value: "Dinosaurs & fossils", label: "Dinosaurs & fossils", emoji: "🦕" },
      { value: "Human evolution & biology", label: "Human evolution & biology", emoji: "🧬" },
      { value: "Marine life & oceans", label: "Marine life & oceans", emoji: "🌊" },
      { value: "Earth sciences & geology", label: "Earth sciences & geology", emoji: "🌍" },
      { value: "Insects & wildlife", label: "Insects & wildlife", emoji: "🦋" },
      { value: "Gems & minerals", label: "Gems & minerals", emoji: "💎" },
      { value: "A bit of everything", label: "A bit of everything", emoji: "✨" },
    ],
  },
  {
    id: "group",
    question: "Who are you visiting with?",
    type: "single",
    options: [
      { value: "Just me", label: "Just me", emoji: "🧑" },
      { value: "Partner or friends", label: "Partner or friends", emoji: "👫" },
      { value: "Family with young children (under 8)", label: "Young family (kids under 8)", emoji: "👨‍👩‍👦" },
      { value: "Family with older children or teens", label: "Older kids or teens", emoji: "👨‍👩‍👧‍👦" },
    ],
  },
  {
    id: "entrance",
    question: "Which entrance will you use?",
    type: "single",
    options: [
      { value: "entrance_cromwell", label: "Cromwell Road", emoji: "🚪", desc: "Main south entrance" },
      { value: "entrance_queens", label: "Queen's Gate", emoji: "🚪", desc: "West side" },
      { value: "entrance_exhibition", label: "Exhibition Road", emoji: "🚪", desc: "East side" },
    ],
  },
  {
    id: "accessibility",
    question: "Any accessibility requirements?",
    type: "single",
    options: [
      { value: "standard", label: "Standard access", emoji: "🚶", desc: "Stairs are fine" },
      { value: "step_free", label: "Step-free preferred", emoji: "♿", desc: "Prefer lifts & ramps" },
    ],
  },
  {
    id: "specialRequests",
    question: "Any special requests or notes?",
    subtitle: "Optional — e.g. 'my child loves whales', 'avoid busy areas'",
    type: "text",
    optional: true,
    placeholder: "Type here… (or skip)",
  },
];

export default function Questionnaire({ onSubmit, error, onShowSaved }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    visitStyle: null,
    specificExhibits: "",
    duration: null,
    interests: [],
    group: null,
    entrance: null,
    accessibility: null,
    specialRequests: "",
  });

  // Compute active steps dynamically based on answers
  const activeSteps = useMemo(
    () => ALL_STEPS.filter((s) => !s.showWhen || s.showWhen(answers)),
    [answers.visitStyle] // only re-filter when visitStyle changes
  );

  const current = activeSteps[step];

  const select = (value) => {
    if (current.type === "single") {
      setAnswers((prev) => ({ ...prev, [current.id]: value }));
    } else {
      setAnswers((prev) => {
        const arr = prev[current.id] || [];
        return {
          ...prev,
          [current.id]: arr.includes(value)
            ? arr.filter((v) => v !== value)
            : [...arr, value],
        };
      });
    }
  };

  const isSelected = (value) => {
    const val = answers[current.id];
    if (current.type === "single") return val === value;
    return val && val.includes(value);
  };

  const canAdvance = () => {
    if (current.optional) return true;
    const val = answers[current.id];
    if (current.type === "single") return val !== null;
    return val && val.length > 0;
  };

  const handleNext = () => {
    if (step < activeSteps.length - 1) {
      setStep((s) => s + 1);
    } else {
      onSubmit(answers);
    }
  };

  const isLastStep = step === activeSteps.length - 1;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        background: BG,
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
      }}
    >
      {/* Logo / title */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🏛️</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
          NHM Tour Planner
        </h1>
        <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
          Personalised routes for the Natural History Museum London
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          background: "#fff",
          borderRadius: 16,
          border: `1px solid ${BORDER}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: "#f0f0ee" }}>
          <div
            style={{
              height: "100%",
              width: `${((step + 1) / activeSteps.length) * 100}%`,
              background: "#C67A1E",
              transition: "width 0.3s ease",
              borderRadius: 3,
            }}
          />
        </div>

        <div style={{ padding: "32px 32px 28px" }}>
          {/* Step indicator */}
          <div style={{ fontSize: 12, color: "#bbb", marginBottom: 8, fontWeight: 500 }}>
            Step {step + 1} of {activeSteps.length}
          </div>

          {/* Question */}
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", margin: "0 0 4px" }}>
            {current.question}
          </h2>
          {current.subtitle && (
            <p style={{ fontSize: 13, color: "#999", margin: "0 0 20px" }}>
              {current.subtitle}
            </p>
          )}
          {!current.subtitle && <div style={{ marginBottom: 20 }} />}

          {/* Options or text input */}
          {current.type === "text" ? (
            <textarea
              value={answers[current.id] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))}
              placeholder={current.placeholder || "Type here… (or skip)"}
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: `1.5px solid ${BORDER}`,
                fontSize: 14,
                fontFamily: "inherit",
                color: "#1a1a1a",
                background: "#fff",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
                lineHeight: 1.5,
              }}
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: current.type === "multi" ? "1fr 1fr" : "1fr",
                gap: 10,
              }}
            >
              {current.options.map((opt) => {
                const selected = isSelected(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => select(opt.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: selected ? "2px solid #C67A1E" : `1.5px solid ${BORDER}`,
                      background: selected ? "#FFF8F0" : "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      outline: "none",
                    }}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: selected ? 600 : 500,
                          color: selected ? "#C67A1E" : "#222",
                          lineHeight: 1.2,
                        }}
                      >
                        {opt.label}
                      </div>
                      {opt.desc && (
                        <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                          {opt.desc}
                        </div>
                      )}
                    </div>
                    {selected && current.type === "single" && (
                      <span style={{ color: "#C67A1E", fontSize: 16, flexShrink: 0 }}>✓</span>
                    )}
                    {selected && current.type === "multi" && (
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          background: "#C67A1E",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: 12,
                          color: "#fff",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 14px",
                borderRadius: 8,
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#B91C1C",
                fontSize: 13,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: `1px solid ${BORDER}`,
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#666",
                  fontFamily: "inherit",
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canAdvance()}
              style={{
                flex: 1,
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                background: canAdvance() ? ACCENT : "#ddd",
                color: canAdvance() ? "#fff" : "#aaa",
                cursor: canAdvance() ? "pointer" : "not-allowed",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
            >
              {isLastStep ? "✨ Generate my route" : "Next →"}
            </button>
          </div>
        </div>
      </div>

      {/* Saved routes link */}
      {onShowSaved && (
        <button
          onClick={onShowSaved}
          style={{
            marginTop: 16,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            color: "#aaa",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          📚 View saved routes
        </button>
      )}

      {/* Dots */}
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        {activeSteps.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === step ? "#C67A1E" : i < step ? "#C67A1E80" : "#ddd",
              transition: "all 0.25s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
