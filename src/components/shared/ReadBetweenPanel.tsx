"use client";
import { useState } from "react";
import { RB_DEMOS } from "@/lib/data";

interface Props {
  text: string;
  context: keyof typeof RB_DEMOS;
  onClose: () => void;
}

export default function ReadBetweenPanel({ text, context, onClose }: Props) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyse = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setResult(RB_DEMOS[context] || RB_DEMOS.message);
    setLoading(false);
  };

  return (
    <>
      <div className="rb-backdrop" onClick={onClose} />
      <div className="rb-panel open">
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid rgba(255,255,255,.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🧠</span>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
                ReadBetween AI
              </div>
              <div
                style={{
                  color: "#6b7280",
                  fontSize: 11,
                  textTransform: "capitalize",
                }}
              >
                {context} Analysis
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
        <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
          <div
            style={{
              background: "rgba(255,255,255,.04)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: 12,
              color: "#9ca3af",
              lineHeight: 1.5,
              border: "1px solid rgba(255,255,255,.07)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "var(--nx-muted)",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
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
              <div style={{ color: "#fff", fontWeight: 600 }}>Analysing…</div>
              <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                Detecting intent & power dynamics
              </div>
            </div>
          )}
          {result && (
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginBottom: 18,
                  padding: 14,
                  background: "rgba(255,255,255,.04)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,.07)",
                  alignItems: "center",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div className="rb-score">{result.power}</div>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>
                    Power Score
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}
                  >
                    {result.power > 60
                      ? "🔴 High power — they hold leverage"
                      : result.power > 40
                        ? "🟡 Balanced — equal footing"
                        : "🟢 Low power — you have leverage"}
                  </div>
                  <div className="prog">
                    <div
                      className="prog-fill"
                      style={{
                        width: result.power + "%",
                        background:
                          result.power > 60
                            ? "#ef4444"
                            : result.power > 40
                              ? "#f59e0b"
                              : "#10b981",
                      }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
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
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                  }}
                >
                  😶 Emotion Tags
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {result.emotion.map((e: string) => (
                    <span key={e} className="rb-tag">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
              {result.manipulation.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}
                  >
                    ⚠️ Patterns
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {result.manipulation.map((m: string) => (
                      <span
                        key={m}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 600,
                          background: "rgba(239,68,68,.15)",
                          color: "#fca5a5",
                          border: "1px solid rgba(239,68,68,.25)",
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 8,
                  }}
                >
                  📝 Response Strategies
                </div>
                {result.strategies.map((s: any) => (
                  <div
                    key={s.label}
                    style={{
                      marginBottom: 8,
                      background: "rgba(255,255,255,.04)",
                      borderRadius: 8,
                      padding: "10px 12px",
                      border: "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "rgba(255,255,255,.6)",
                        marginBottom: 4,
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
                style={{ width: "100%", marginTop: 14, fontSize: 12 }}
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
