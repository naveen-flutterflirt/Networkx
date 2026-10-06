"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { AttendanceAPI, MeetingsAPI, TokenStore } from "@/lib/api";
import UserSearchPicker from "@/components/ui/UserSearchPicker";
import { Loading, ApiError, Empty } from "@/components/shared/States";

type MarkForm = { meeting_id: string; user_id: string; user: any };
type MarkErrors = Partial<Record<"meeting_id" | "user_id", string>>;

function validateMark(f: MarkForm): MarkErrors {
  const errors: MarkErrors = {};
  if (!f.meeting_id) errors.meeting_id = "Select a meeting";
  if (!f.user_id) errors.user_id = "Select a member";
  return errors;
}

export default function AttendancePage() {
  const me = TokenStore.getUser();
  const canManage = ["franchise", "hq_admin", "super_admin"].includes(me?.role);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [myStats, setMyStats] = useState<any | null>(null);

  const [showMark, setShowMark] = useState(false);
  const [markableMeetings, setMarkableMeetings] = useState<any[]>([]);
  const [markForm, setMarkForm] = useState<MarkForm>({
    meeting_id: "",
    user_id: "",
    user: null,
  });
  const [markErrors, setMarkErrors] = useState<MarkErrors>({});
  const [saving, setSaving] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await AttendanceAPI.leaderboard(
        me?.group_id ? { group_id: me.group_id } : undefined,
      );
      setLeaderboard(res.items || res || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    if (!canManage && me?.id) {
      AttendanceAPI.userStats(me.id)
        .then(setMyStats)
        .catch(() => {});
    }
  }, []);

  const openMark = async () => {
    setMarkForm({ meeting_id: "", user_id: "", user: null });
    setMarkErrors({});
    setShowMark(true);
    try {
      const res = await MeetingsAPI.list({ page: 1 });
      const items = res.items || res || [];
      setMarkableMeetings(
        items.filter(
          (m: any) => m.status === "upcoming" || m.status === "live",
        ),
      );
    } catch {
      setMarkableMeetings([]);
    }
  };

  const submitMark = async () => {
    const errs = validateMark(markForm);
    setMarkErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await AttendanceAPI.mark({
        meeting_id: markForm.meeting_id,
        user_id: markForm.user_id,
      });
      setMsg("✅ Attendance marked for " + (markForm.user?.name || "member"));
      setShowMark(false);
      fetchLeaderboard();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Stats derived only from real leaderboard fields — nothing fabricated
  const avgPct = leaderboard.length
    ? Math.round(
        leaderboard.reduce((s, a) => s + (a.attendance_pct || 0), 0) /
          leaderboard.length,
      )
    : 0;
  const onWarning = leaderboard.filter((a) => a.status === "warning").length;
  const inactive = leaderboard.filter((a) => a.status === "inactive").length;

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
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Attendance</h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Track meeting attendance for your group
          </p>
        </div>
        {canManage && (
          <button className="btn btn-p" onClick={openMark}>
            Mark Attendance
          </button>
        )}
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

      {/* Self check-in pointer — real GPS/code check-in lives on the Meetings page */}
      {!canManage && (
        <div
          className="alert-info"
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>
            <FontAwesomeIcon icon={faLocationDot} className="mr-1.5" />
            To check yourself in for a live meeting, use GPS check-in or enter
            the meeting code on the Meetings page.
          </span>
          <button
            className="btn btn-p btn-sm"
            onClick={() => (window.location.href = "/dashboard/meetings")}
          >
            Go to Meetings
          </button>
        </div>
      )}

      {!canManage && myStats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            {
              l: "My Attendance",
              v: `${myStats.attendance_pct}%`,
              c: "#10b981",
            },
            {
              l: "Meetings Attended",
              v: `${myStats.present}/${myStats.total_meetings}`,
              c: "#6366f1",
            },
            { l: "Best Streak", v: myStats.max_streak, c: "#f59e0b" },
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
      )}

      {canManage && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            { l: "Members Tracked", v: leaderboard.length, c: "#6366f1" },
            { l: "Avg Attendance", v: `${avgPct}%`, c: "#10b981" },
            {
              l: "On Warning / Inactive",
              v: `${onWarning} / ${inactive}`,
              c: "#f59e0b",
            },
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
      )}

      {/* Leaderboard table — real data from AttendanceAPI.leaderboard() */}
      <div
        className="card"
        style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #f3f4f6",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Attendance Leaderboard
        </div>
        {loading ? (
          <Loading label="Loading leaderboard…" />
        ) : error ? (
          <ApiError message={error} onRetry={fetchLeaderboard} />
        ) : leaderboard.length === 0 ? (
          <Empty label="No attendance records yet" />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                {[
                  "Rank",
                  "Member",
                  "Attendance %",
                  "Referrals Given",
                  "Referrals Received",
                  "Status",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...leaderboard]
                .sort(
                  (a, b) => (b.attendance_pct || 0) - (a.attendance_pct || 0),
                )
                .map((a, i) => (
                  <tr key={a.id}>
                    <td
                      style={{
                        fontWeight: 800,
                        color:
                          i === 0
                            ? "#f59e0b"
                            : i === 1
                              ? "#9ca3af"
                              : i === 2
                                ? "#cd7c3e"
                                : "#cbd5e1",
                      }}
                    >
                      #{i + 1}
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
                          className="av"
                          style={{
                            width: 30,
                            height: 30,
                            fontSize: 10,
                            background: "#6366f1",
                          }}
                        >
                          {a.user?.name?.charAt(0) || "?"}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {a.user?.name || "—"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div className="prog" style={{ width: 50 }}>
                          <div
                            className="prog-fill"
                            style={{
                              width: (a.attendance_pct || 0) + "%",
                              background:
                                a.attendance_pct >= 80
                                  ? "#10b981"
                                  : a.attendance_pct >= 60
                                    ? "#f59e0b"
                                    : "#ef4444",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color:
                              a.attendance_pct >= 80
                                ? "#10b981"
                                : a.attendance_pct >= 60
                                  ? "#f59e0b"
                                  : "#ef4444",
                          }}
                        >
                          {a.attendance_pct || 0}%
                        </span>
                      </div>
                    </td>
                    <td>{a.refs_given ?? 0}</td>
                    <td>{a.refs_received ?? 0}</td>
                    <td>
                      <span
                        className={`badge ${a.status === "active" ? "b-green" : a.status === "warning" ? "b-yellow" : "b-red"}`}
                      >
                        {a.status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MARK ATTENDANCE MODAL (franchise+) ────────────────────── */}
      {showMark && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowMark(false)}
        >
          <div className="modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              Mark Attendance
            </h3>
            <div className="fg">
              <label>Meeting *</label>
              <select
                value={markForm.meeting_id}
                onChange={(e) =>
                  setMarkForm({ ...markForm, meeting_id: e.target.value })
                }
              >
                <option value="">— Select meeting —</option>
                {markableMeetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {(m.type || "meeting").replace(/_/g, " ")} · {m.date}{" "}
                    {m.time}
                  </option>
                ))}
              </select>
              {markErrors.meeting_id && (
                <div className="field-error">{markErrors.meeting_id}</div>
              )}
              {markableMeetings.length === 0 && (
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  No upcoming or live meetings found for your group.
                </div>
              )}
            </div>
            <UserSearchPicker
              label="Member"
              required
              value={markForm.user_id}
              onChange={(id, user) =>
                setMarkForm({ ...markForm, user_id: id, user })
              }
              placeholder="Search member name, email or city…"
            />
            {markErrors.user_id && (
              <div className="field-error">{markErrors.user_id}</div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={submitMark}
                disabled={saving}
              >
                {saving ? "Marking…" : "Mark Present"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setShowMark(false)}
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
