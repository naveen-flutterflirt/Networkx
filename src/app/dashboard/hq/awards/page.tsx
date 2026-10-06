"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faMedal,
  faClipboard,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useRef } from "react";
import { AwardsAPI } from "@/lib/api";
import UserSearchPicker from "@/components/ui/UserSearchPicker";

export default function HQAwardsPage() {
  const [tab, setTab] = useState("leaderboard");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assignForm, setAssignForm] = useState({
    user_id: "",
    user_name: "",
    award_name: "",
    category: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [lb, aw, cats] = await Promise.all([
        AwardsAPI.leaderboard(),
        AwardsAPI.list({ page: 1, page_size: 20 }),
        AwardsAPI.categories(),
      ]);
      setLeaderboard(lb.items || lb);
      setAwards(aw.items || aw);
      setCategories(cats.categories || []);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const openAssign = (category = "") => {
    setAssignForm({ user_id: "", user_name: "", award_name: "", category });
    setShowAssign(true);
  };

  const assignAward = async () => {
    if (!assignForm.user_id || !assignForm.award_name) return;
    setSaving(true);
    try {
      await AwardsAPI.assign({
        user_id: assignForm.user_id,
        award_name: assignForm.award_name,
        category: assignForm.category,
      });
      setShowAssign(false);
      setMsg(
        `✅ Award "${assignForm.award_name}" assigned to ${assignForm.user_name}!`,
      );
      fetchAll();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const RANK_COLORS = ["#f59e0b", "#9ca3af", "#cd7c3e"];
  const CAT_COLORS = [
    "#f59e0b",
    "var(--nx-orange)",
    "#6366f1",
    "#10b981",
    "#8b5cf6",
    "#ec4899",
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
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Points & Awards</h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            National leaderboard, award management and scoring
          </p>
        </div>
        <button className="btn btn-p" onClick={() => openAssign()}>
          + Assign Award
        </button>
      </div>

      {msg && (
        <div
          className="toast-in"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            borderRadius: 10,
            marginBottom: 12,
            fontSize: 13,
            background: msg.startsWith("✅")
              ? "rgba(39,216,109,.1)"
              : "rgba(255,90,90,.1)",
            color: msg.startsWith("✅") ? "#16a34a" : "#ef4444",
            border: `1px solid ${msg.startsWith("✅") ? "rgba(39,216,109,.35)" : "rgba(255,90,90,.35)"}`,
          }}
        >
          {msg}
          <button
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
            }}
            onClick={() => setMsg("")}
          >
            ✕
          </button>
        </div>
      )}
      {error && (
        <div
          style={{
            background: "rgba(255,90,90,.1)",
            border: "1px solid rgba(255,90,90,.3)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 12,
            color: "#ef4444",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div className="tab-bar">
        {[
          { id: "leaderboard", l: "Leaderboard", ic: faTrophy },
          { id: "awards", l: "Award Categories", ic: faMedal },
          { id: "history", l: "Award History", ic: faClipboard },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab-btn${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <FontAwesomeIcon icon={t.ic} className="mr-1.5" />
            {t.l}
          </button>
        ))}
      </div>

      {/* ── LEADERBOARD ────────────────────────────────────────────── */}
      {tab === "leaderboard" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                {[
                  "Rank",
                  "Member",
                  "City",
                  "Score",
                  "Referrals",
                  "Attendance",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j}>
                        <div
                          style={{
                            height: 13,
                            background: "rgba(255,255,255,.06)",
                            borderRadius: 4,
                            width: "80%",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      color: "#9ca3af",
                      padding: 32,
                    }}
                  >
                    No leaderboard data yet
                  </td>
                </tr>
              ) : (
                leaderboard.map((m, idx) => (
                  <tr key={m.id || idx}>
                    <td>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 16,
                          color:
                            idx === 0
                              ? "#f59e0b"
                              : idx === 1
                                ? "#9ca3af"
                                : idx === 2
                                  ? "#cd7c3e"
                                  : "#cbd5e1",
                        }}
                      >
                        {idx < 3 ? (
                          <FontAwesomeIcon icon={faMedal} />
                        ) : (
                          `#${idx + 1}`
                        )}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: "#6366f1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {(m.user?.name || "?").charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600 }}>
                          {m.user?.name || m.user_id?.slice(0, 8) || "—"}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>
                      {m.user?.city || "—"}
                    </td>
                    <td
                      style={{
                        fontWeight: 700,
                        color: "var(--nx-orange)",
                        fontSize: 15,
                      }}
                    >
                      {m.score || 0}
                    </td>
                    <td>{m.refs_given || 0}</td>
                    <td style={{ color: "#10b981", fontWeight: 600 }}>
                      {m.attendance_pct || 0}%
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background:
                            m.status === "active" ? "#dcfce7" : "#fef3c7",
                          color: m.status === "active" ? "#16a34a" : "#92400e",
                          fontWeight: 600,
                        }}
                      >
                        {m.status || "—"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-xs btn-p"
                        onClick={() => openAssign("")}
                      >
                        <FontAwesomeIcon icon={faTrophy} className="mr-1.5" />
                        Award
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── AWARD CATEGORIES ───────────────────────────────────────── */}
      {tab === "awards" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 12,
            }}
          >
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="card"
                  style={{ height: 120, background: "rgba(255,255,255,.06)" }}
                />
              ))
            ) : categories.length === 0 ? (
              <div
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  color: "#9ca3af",
                  padding: 40,
                }}
              >
                No categories yet
              </div>
            ) : (
              categories.map((cat, idx) => {
                const c = CAT_COLORS[idx % CAT_COLORS.length];
                // Count awards in this category
                const count = awards.filter((a) => a.category === cat).length;
                return (
                  <div
                    key={cat}
                    style={{
                      background: "var(--nx-panel)",
                      borderRadius: 12,
                      padding: 16,
                      border: `1px solid ${c}33`,
                      borderTop: `3px solid ${c}`,
                      boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                    }}
                  >
                    <div
                      style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}
                    >
                      {cat}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        marginBottom: 10,
                      }}
                    >
                      {count} award{count !== 1 ? "s" : ""} given
                    </div>
                    <button
                      className="btn btn-p btn-sm"
                      style={{ width: "100%" }}
                      onClick={() => openAssign(cat)}
                    >
                      <FontAwesomeIcon icon={faTrophy} className="mr-1.5" />
                      Assign to Member
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── AWARD HISTORY ──────────────────────────────────────────── */}
      {tab === "history" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                {["Award", "Category", "Recipient", "Assigned By", "Date"].map(
                  (h) => (
                    <th key={h}>{h}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(5)].map((_, j) => (
                        <td key={j}>
                          <div
                            style={{
                              height: 13,
                              background: "rgba(255,255,255,.06)",
                              borderRadius: 4,
                              width: "80%",
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                : awards.map((a, i) => (
                    <tr key={a.id || i}>
                      <td style={{ fontWeight: 600 }}>
                        {a.award_name || a.name || "—"}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 99,
                            background: "rgba(22,143,255,.1)",
                            color: "#3b82f6",
                            fontWeight: 600,
                          }}
                        >
                          {a.category || "—"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {a.user?.name ||
                          a.recipient_name ||
                          a.user_id?.slice(0, 8) ||
                          "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "#9ca3af" }}>
                        {a.assigned_by_user?.name ||
                          a.created_by?.slice(0, 8) ||
                          "—"}
                      </td>
                      <td style={{ fontSize: 11, color: "#9ca3af" }}>
                        {a.created_at
                          ? new Date(a.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
              {!loading && awards.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      color: "#9ca3af",
                      padding: 24,
                    }}
                  >
                    No awards assigned yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ASSIGN AWARD MODAL ─────────────────────────────────────── */}
      {showAssign && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowAssign(false)}
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              <FontAwesomeIcon icon={faTrophy} className="mr-1.5" />
              Assign Award
            </h3>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
              Search and select a member to award
            </p>

            <UserSearchPicker
              label="Search Member"
              required
              placeholder="Type name, email or city…"
              value={assignForm.user_id}
              onChange={(id, user) =>
                setAssignForm({
                  ...assignForm,
                  user_id: id,
                  user_name: user?.name || "",
                })
              }
            />

            <div className="fg">
              <label>Award Category</label>
              <select
                value={assignForm.category}
                onChange={(e) =>
                  setAssignForm({
                    ...assignForm,
                    category: e.target.value,
                    award_name: e.target.value
                      ? e.target.value
                      : assignForm.award_name,
                  })
                }
              >
                <option value="">— Select category —</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="fg">
              <label>Award Name *</label>
              <input
                value={assignForm.award_name}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, award_name: e.target.value })
                }
                placeholder="e.g. Top Referrer Q1 2026, Best Attendance March"
              />
            </div>

            {/* Preview */}
            {assignForm.user_name && assignForm.award_name && (
              <div
                style={{
                  background: "rgba(39,216,109,.1)",
                  border: "1px solid rgba(39,216,109,.3)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 14,
                  fontSize: 13,
                  color: "#15803d",
                }}
              >
                <FontAwesomeIcon icon={faTrophy} className="mr-1.5" />
                <strong>{assignForm.award_name}</strong> will be awarded to{" "}
                <strong>{assignForm.user_name}</strong>
                {assignForm.category && ` in category "${assignForm.category}"`}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={assignAward}
                disabled={
                  saving || !assignForm.user_id || !assignForm.award_name
                }
              >
                {saving ? "Assigning…" : "Assign Award"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setShowAssign(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
