"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMedal,
  faTrophy,
  faStar,
  faRocket,
  faHandshake,
  faMagnet,
} from "@fortawesome/free-solid-svg-icons";

const AWARDS = [
  {
    id: 1,
    name: "Vijay Mehta",
    badge: "Gold Connector",
    score: 91,
    icon: faMedal,
    color: "#f59e0b",
    desc: "Top referral giver this quarter",
  },
  {
    id: 2,
    name: "Priya Khanna",
    badge: "Rising Star",
    score: 85,
    icon: faStar,
    color: "#6366f1",
    desc: "Fastest growing member score",
  },
  {
    id: 3,
    name: "Rohit Arora",
    badge: "Referral Rockstar",
    score: 94,
    icon: faRocket,
    color: "var(--nx-orange)",
    desc: "Most referrals given — 8 this month",
  },
  {
    id: 4,
    name: "Sunita Verma",
    badge: "Deal Maker",
    score: 88,
    icon: faHandshake,
    color: "#10b981",
    desc: "Highest referral value closed",
  },
  {
    id: 5,
    name: "Deepak Jain",
    badge: "Network Magnet",
    score: 78,
    icon: faMagnet,
    color: "#8b5cf6",
    desc: "Most new connections this month",
  },
];

export default function CoordAwardsPage() {
  return (
    <div className="page">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Awards</h2>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          Track performance scores and award eligibility for the group
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { l: "STAR PERFORMERS", v: 8, sub: "Score 80+", c: "#ff4b0a" },
          { l: "AWARD ELIGIBLE", v: 12, sub: "Score 70+", c: "#6366f1" },
          { l: "GROUP RANK (CITY)", v: "#2", sub: "of 5 groups", c: "#f59e0b" },
        ].map((s) => (
          <div key={s.l} className="card">
            <div
              style={{
                fontSize: 10,
                color: "#9ca3af",
                fontWeight: 600,
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              {s.l}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.c }}>
              {s.v}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Award Types */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
          <FontAwesomeIcon icon={faTrophy} className="mr-1.5" />
          Award Categories
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            "Referral Rockstar",
            "The Deal Maker",
            "Network Magnet",
            "Gold Connector",
            "Rising Star",
            "100% Attendance",
          ].map((a) => (
            <span
              key={a}
              className="badge b-purple"
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Award winners */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
          <FontAwesomeIcon icon={faMedal} className="mr-1.5" />
          This Month's Award Winners
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {AWARDS.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px",
                background: "rgba(255,255,255,.04)",
                borderRadius: 10,
                border: `1px solid ${a.color}22`,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: a.color + "22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                <FontAwesomeIcon icon={a.icon} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{a.name}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: a.color }}>
                  {a.badge}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  {a.desc}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: a.color }}>
                  {a.score}
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>Score</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
