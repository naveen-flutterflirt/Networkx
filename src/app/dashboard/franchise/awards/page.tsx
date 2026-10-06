"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faMedal, faMagnet } from "@fortawesome/free-solid-svg-icons";

export default function FranchiseAwardsPage() {
  return (
    <div className="page">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Awards</h2>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          City-level awards and top performers across Delhi Territory
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { l: "Star Performers (City)", v: 12, c: "#ff4b0a" },
          { l: "Top Group", v: "Delhi NCR Elite", c: "#10b981" },
          { l: "City Rank", v: "#2", c: "#f59e0b" },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              background: `linear-gradient(135deg,${s.c},${s.c}cc)`,
              borderRadius: 12,
              padding: "14px 12px",
              boxShadow: `0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
              {s.v}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,.75)",
                marginTop: 4,
              }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
          <FontAwesomeIcon icon={faTrophy} className="mr-1.5" />
          City Top Performers — April 2026
        </div>
        {[
          {
            rank: 1,
            name: "Rohit Arora",
            group: "Delhi NCR Elite",
            award: "City Champion",
            score: 94,
            icon: faMedal,
          },
          {
            rank: 2,
            name: "Meena Iyer",
            group: "Delhi NCR Elite",
            award: "Gold Connector",
            score: 91,
            icon: faMedal,
          },
          {
            rank: 3,
            name: "Anita Singh",
            group: "Delhi North",
            award: "Deal Maker",
            score: 88,
            icon: faMedal,
          },
          {
            rank: 4,
            name: "Rahul Verma",
            group: "Delhi South",
            award: "Rising Star",
            score: 85,
            icon: "⭐",
          },
          {
            rank: 5,
            name: "Deepa Rao",
            group: "Noida Business",
            award: "Network Magnet",
            score: 78,
            icon: faMagnet,
          },
        ].map((m) => (
          <div
            key={m.rank}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 0",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <div style={{ fontSize: 22, flexShrink: 0 }}>
              {typeof m.icon === "string" ? (
                m.icon
              ) : (
                <FontAwesomeIcon icon={m.icon} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>{m.group}</div>
            </div>
            <span className="badge b-purple">{m.award}</span>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--nx-orange)",
                minWidth: 40,
                textAlign: "right",
              }}
            >
              {m.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
