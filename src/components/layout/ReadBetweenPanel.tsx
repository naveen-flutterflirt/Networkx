"use client";
import { useState } from "react";

const DEMO_RESULTS = [
  {
    power: 35,
    intent:
      "Soft rejection likely. Vague language + no timeline = classic avoidance. The sender is being polite but uncommitted.",
    emotion: ["Disinterest", "Politeness", "Avoidance"],
    manipulation: ["Vague Timeline", "Non-committal"],
    strategies: [
      {
        label: "Soft",
        icon: "🤝",
        text: "Thanks for considering! Happy to share a quick case study. Can we do a 10-min call?",
      },
      {
        label: "Direct",
        icon: "🎯",
        text: "Offer valid until Friday — can we confirm either way?",
      },
      {
        label: "Firm",
        icon: "⚡",
        text: "I need to close my schedule this week. Are you in or out?",
      },
    ],
  },
  {
    power: 68,
    intent:
      "Strong buying intent. 'Definitely interested' signals genuine engagement. 'Send pricing' = comparison mode — they're evaluating options.",
    emotion: ["Excitement", "Buying Intent", "Curiosity"],
    manipulation: [],
    strategies: [
      {
        label: "Qualify First",
        icon: "🎯",
        text: "Before I send pricing — what's your timeline and key priorities?",
      },
      {
        label: "Value Anchor",
        icon: "💡",
        text: "Most clients see ROI in 60 days. Want a quick 20-min demo first?",
      },
      {
        label: "Direct Send",
        icon: "📨",
        text: "Sending packages now — Growth plan fits your use case best.",
      },
    ],
  },
  {
    power: 22,
    intent:
      "HIGH RISK. Sole discretion clause gives total control to one party. 30-day notice is dangerously short for any business operation.",
    emotion: ["Risk", "Imbalance", "Urgency"],
    manipulation: ["One-sided Power", "Inadequate Notice"],
    strategies: [
      {
        label: "Negotiate",
        icon: "📋",
        text: "Request 90-day minimum notice + written reason requirement.",
      },
      {
        label: "Counter",
        icon: "⚖️",
        text: "Limit discretion to material breach cases only.",
      },
      {
        label: "Walk Away",
        icon: "🚪",
        text: "If they won't modify this clause — it's a red flag. Seek alternatives.",
      },
    ],
  },
  {
    power: 55,
    intent:
      "Genuine networking intent. Travel announcement signals openness to new connections. Purpose-driven — not just passing through.",
    emotion: ["Openness", "Ambition", "Networking Intent"],
    manipulation: [],
    strategies: [
      {
        label: "Warm Intro",
        icon: "🤝",
        text: "Hey! I know 2 CIOs in Mumbai — happy to make intros over coffee.",
      },
      {
        label: "Value Add",
        icon: "💡",
        text: "I can connect you with our chapter president who knows everyone in your space.",
      },
      {
        label: "Direct Meet",
        icon: "📅",
        text: "Want to do a quick 30-min breakfast meet while you're here?",
      },
    ],
  },
  {
    power: 48,
    intent:
      "The bio presents credibility well but uses vague terms. Real expertise is there — but the 'looking for' angle is unclear. Good connection candidate.",
    emotion: ["Credibility", "Openness", "Ambiguity"],
    manipulation: [],
    strategies: [
      {
        label: "Common Ground",
        icon: "🤝",
        text: "We both work in B2B space — would love to explore referral opportunities.",
      },
      {
        label: "Specific Ask",
        icon: "🎯",
        text: "Do you work with manufacturing clients? I have a few who need IT solutions.",
      },
      {
        label: "Learn First",
        icon: "📖",
        text: "Would love to understand your current focus before suggesting a connect.",
      },
    ],
  },
];

interface Props {
  text: string;
  context: string;
  onClose: () => void;
}

export default function ReadBetweenPanel({ text, context, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(typeof DEMO_RESULTS)[0] | null>(null);

  const analyse = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1600));
    // pick demo result based on context
    const idx =
      context === "contract"
        ? 2
        : context === "travel"
          ? 3
          : context === "bio"
            ? 4
            : context === "referral"
              ? 0
              : Math.random() > 0.5
                ? 1
                : 0;
    setResult(DEMO_RESULTS[idx]);
    setLoading(false);
  };

  return (
    <>
      <div className="rb-panel-backdrop" onClick={onClose} />
      <div className="rb-panel open">
        {/* Header */}
        <div className="rb-panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🧠</span>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
                ReadBetween AI
              </div>
              <div style={{ color: "#6b7280", fontSize: 11 }}>
                {context === "message"
                  ? "Message Analysis"
                  : context === "referral"
                    ? "Referral Scorer"
                    : context === "bizhub"
                      ? "Post Intent Analysis"
                      : context === "meeting"
                        ? "Transcript Analysis"
                        : context === "travel"
                          ? "Travel Post Analysis"
                          : "Bio Analysis"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="rb-panel-body">
          {/* Input text preview */}
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: 12,
              color: "#9ca3af",
              lineHeight: 1.5,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#6b7280",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: ".5px",
              }}
            >
              Analysing
            </div>
            {text.length > 180 ? text.slice(0, 180) + "…" : text}
          </div>

          {!result && !loading && (
            <button
              className="btn btn-p"
              style={{ width: "100%", padding: 12 }}
              onClick={analyse}
            >
              🧠 Analyse Now
            </button>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🧠</div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
                Analysing…
              </div>
              <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                Detecting intent & power dynamics
              </div>
            </div>
          )}

          {result && (
            <div>
              {/* Power score */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 20,
                  padding: 14,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 38,
                      fontWeight: 800,
                      background:
                        "linear-gradient(135deg,var(--nx-orange),#ff8c42)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {result.power}
                  </div>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>
                    Power Score
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}
                  >
                    {result.power > 60
                      ? "🔴 High power — they hold leverage"
                      : result.power > 40
                        ? "🟡 Balanced — equal footing"
                        : "🟢 Low power — you have leverage"}
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: 99,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: result.power + "%",
                        background:
                          result.power > 60
                            ? "#ef4444"
                            : result.power > 40
                              ? "#f59e0b"
                              : "#10b981",
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Intent */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: ".5px",
                    marginBottom: 8,
                  }}
                >
                  💡 Hidden Intent
                </div>
                <div
                  style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.6 }}
                >
                  {result.intent}
                </div>
              </div>

              {/* Emotions */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: ".5px",
                    marginBottom: 8,
                  }}
                >
                  😶 Emotion Tags
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {result.emotion.map((e) => (
                    <span
                      key={e}
                      style={{
                        padding: "3px 10px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "rgba(255,255,255,0.08)",
                        color: "#e2e8f0",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              {/* Manipulation */}
              {result.manipulation.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: ".5px",
                      marginBottom: 8,
                    }}
                  >
                    ⚠️ Patterns Detected
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {result.manipulation.map((m) => (
                      <span
                        key={m}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 600,
                          background: "rgba(239,68,68,0.15)",
                          color: "#fca5a5",
                          border: "1px solid rgba(239,68,68,0.25)",
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategies */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: ".5px",
                    marginBottom: 10,
                  }}
                >
                  📝 Response Strategies
                </div>
                {result.strategies.map((s) => (
                  <div
                    key={s.label}
                    style={{
                      marginBottom: 8,
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 8,
                      padding: "10px 12px",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.6)",
                        marginBottom: 5,
                      }}
                    >
                      {s.icon} {s.label.toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#cbd5e1",
                        lineHeight: 1.5,
                      }}
                    >
                      {s.text}
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn btn-g"
                style={{ width: "100%", marginTop: 16, fontSize: 12 }}
                onClick={() => setResult(null)}
              >
                Analyse Different Text
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
