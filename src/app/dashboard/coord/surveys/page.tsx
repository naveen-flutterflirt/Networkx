"use client";
import { useState } from "react";

export default function CoordSurveysPage() {
  const [active, setActive] = useState<number | null>(null);
  const SURVEYS = [
    {
      id: 1,
      title: "Q1 Meeting Satisfaction Survey",
      responses: 28,
      total: 38,
      status: "active",
      due: "Apr 30, 2026",
    },
    {
      id: 2,
      title: "Annual Group Health Check",
      responses: 38,
      total: 38,
      status: "completed",
      due: "Mar 31, 2026",
    },
    {
      id: 3,
      title: "Preferred Meeting Timings Poll",
      responses: 15,
      total: 38,
      status: "active",
      due: "May 5, 2026",
    },
  ];
  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Surveys</h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Create and manage group surveys and polls
          </p>
        </div>
        <button
          className="btn btn-p"
          onClick={() => alert("Survey creation coming soon!")}
        >
          + Create Survey
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SURVEYS.map((s) => (
          <div key={s.id} className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
              <span
                className={`badge ${s.status === "active" ? "b-green" : "b-gray"}`}
              >
                {s.status}
              </span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div className="prog">
                <div
                  className="prog-fill"
                  style={{
                    width: Math.round((s.responses / s.total) * 100) + "%",
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                {s.responses}/{s.total} responses · Due {s.due}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="btn btn-p btn-sm"
                onClick={() => setActive(s.id)}
              >
                View Results
              </button>
              {s.status === "active" && (
                <button
                  className="btn btn-g btn-sm"
                  onClick={() => alert("Reminder sent!")}
                >
                  Send Reminder
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {active && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setActive(null)}
        >
          <div className="modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              Survey Results
            </h3>
            {[
              {
                q: "How satisfied are you with meeting quality?",
                a: ["Very Satisfied: 62%", "Satisfied: 28%", "Neutral: 10%"],
              },
              {
                q: "Would you recommend NIA to a colleague?",
                a: ["Yes: 89%", "Maybe: 8%", "No: 3%"],
              },
            ].map((q, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  {q.q}
                </div>
                {q.a.map((a, j) => (
                  <div
                    key={j}
                    style={{ fontSize: 12, color: "#6b7280", padding: "4px 0" }}
                  >
                    {a}
                  </div>
                ))}
              </div>
            ))}
            <button
              className="btn btn-g"
              style={{ width: "100%" }}
              onClick={() => setActive(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
