"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faArrowsRotate,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { ReferralsAPI, GroupsAPI } from "@/lib/api";
import UserSearchPicker from "@/components/ui/UserSearchPicker";

import PipelineStepper from "@/components/ui/PipelineStepper";

// Mirrors referrals/service.py::ALLOWED_TRANSITIONS on the backend — kept
// here too so this admin table can show the right "next stage" action
// without an extra round trip. The backend is what actually enforces it;
// this is just to avoid rendering a button the API would reject.
const TRANSITIONS: Record<string, string[]> = {
  pending: ["accepted", "declined"],
  accepted: ["contacted", "lost"],
  contacted: ["meeting", "lost"],
  meeting: ["qualified", "lost"],
  qualified: ["won", "lost"],
  won: [],
  lost: [],
  declined: [],
};
const LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  contacted: "Contacted",
  meeting: "Meeting",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

export default function HQReferralsPage() {
  const [refs, setRefs] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Modals
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [showGive, setShowGive] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);

  // Forms
  const [giveForm, setGiveForm] = useState({
    receiver_id: "",
    group_id: "",
    business_desc: "",
    amount: 0,
  });

  useEffect(() => {
    fetchRefs(1);
    GroupsAPI.list({ page: 1, page_size: 100 })
      .then((res) => setGroups(res.items || res))
      .catch(() => {});
  }, []);

  const fetchRefs = async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const [res, s] = await Promise.all([
        ReferralsAPI.list({ page: p, page_size: 20 }),
        ReferralsAPI.stats(),
      ]);
      setRefs(res.items || res);
      setHasMore(res.has_more || false);
      setStats(s);
      setPage(p);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const giveReferral = async () => {
    if (!giveForm.receiver_id || !giveForm.business_desc) return;
    setSaving(true);
    try {
      await ReferralsAPI.give(giveForm);
      setShowGive(false);
      setGiveForm({
        receiver_id: "",
        group_id: "",
        business_desc: "",
        amount: 0,
      });
      setMsg("✅ Referral given!");
      fetchRefs(1);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await ReferralsAPI.updateStatus(editing.id, {
        status: editing.status,
        notes: editing.notes,
      });
      setEditing(null);
      setMsg("✅ Referral updated!");
      fetchRefs(page);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await ReferralsAPI.updateStatus(id, { status });
      setMsg(`✅ Referral marked as ${status}`);
      fetchRefs(page);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  const deleteRef = async (id: string, giver: string) => {
    if (
      !confirm(`Delete this referral from ${giver}?\n\nThis cannot be undone.`)
    )
      return;
    try {
      await ReferralsAPI.delete(id);
      setMsg("✅ Referral deleted");
      fetchRefs(page);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Referrals</h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            All referrals across the platform
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-g btn-sm" onClick={() => fetchRefs(page)}>
            <FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5" />
            Refresh
          </button>
          <button className="btn btn-p" onClick={() => setShowGive(true)}>
            + Give Referral
          </button>
        </div>
      </div>

      {/* Message */}
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

      {/* Stats Cards */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            ["Total", stats.total || 0, "#6366f1"],
            ["Pending", stats.by_status?.pending || 0, "#ff9a3c"],
            ["Won", stats.by_status?.won || 0, "#10b981"],
            [
              "Lost/Declined",
              (stats.by_status?.lost || 0) + (stats.by_status?.declined || 0),
              "#ef4444",
            ],
          ].map(([l, v, c]) => (
            <div
              key={String(l)}
              style={{
                background: `linear-gradient(135deg,${c},${c}cc)`,
                borderRadius: 12,
                padding: "14px 16px",
                boxShadow: `0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${c}66, inset 0 1px 0 rgba(255,255,255,.18)`,
              }}
            >
              <div
                className="stat-num"
                style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}
              >
                {v}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,.85)",
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                {l}
              </div>
            </div>
          ))}
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
          {error}{" "}
          <button className="btn btn-xs btn-g" onClick={() => fetchRefs(page)}>
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div
        className="card"
        style={{ padding: 0, overflow: "hidden", marginBottom: 12 }}
      >
        <table className="tbl">
          <thead>
            <tr>
              {[
                "Giver",
                "Receiver",
                "Business",
                "Amount",
                "Status",
                "Date",
                "Actions",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
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
            ) : refs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}
                >
                  No referrals found
                </td>
              </tr>
            ) : (
              refs.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>
                    {r.user?.name || r.giver_id?.slice(0, 10) || "—"}
                  </td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>
                    {r.receiver?.name || r.receiver_id?.slice(0, 10) || "—"}
                  </td>
                  <td
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      maxWidth: 160,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.business_desc || "—"}
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>
                    ₹{(r.amount || 0).toLocaleString()}
                  </td>
                  <td>
                    <PipelineStepper status={r.status} compact />
                  </td>
                  <td style={{ fontSize: 11, color: "#9ca3af" }}>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {/* View — always visible */}
                      <button
                        className="btn btn-xs btn-g"
                        onClick={() => setViewing(r)}
                      >
                        View
                      </button>
                      {/* Edit — always visible */}
                      <button
                        className="btn btn-xs btn-g"
                        style={{ color: "#6366f1" }}
                        onClick={() =>
                          setEditing({ ...r, notes: r.notes || "" })
                        }
                      >
                        Edit
                      </button>
                      {/* Stage actions — driven by the same transition graph the backend enforces */}
                      {(TRANSITIONS[r.status] || [])
                        .filter((t) => t !== "lost" && t !== "declined")
                        .map((target) => (
                          <button
                            key={target}
                            className="btn btn-xs btn-g"
                            style={{ color: "#10b981" }}
                            onClick={() => updateStatus(r.id, target)}
                          >
                            <FontAwesomeIcon
                              icon={faArrowRight}
                              className="mr-1.5"
                            />
                            {LABELS[target]}
                          </button>
                        ))}
                      {(TRANSITIONS[r.status] || []).includes("lost") && (
                        <button
                          className="btn btn-xs btn-g"
                          style={{ color: "#f59e0b" }}
                          onClick={() => updateStatus(r.id, "lost")}
                        >
                          Mark Lost
                        </button>
                      )}
                      {/* Delete — always visible */}
                      <button
                        className="btn btn-xs btn-g"
                        style={{ color: "#ef4444" }}
                        onClick={() =>
                          deleteRef(r.id, r.user?.name || "member")
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        <button
          className="btn btn-g btn-sm"
          disabled={page === 1}
          onClick={() => fetchRefs(page - 1)}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-1.5" />
          Prev
        </button>
        <span style={{ padding: "6px 12px", fontSize: 13, color: "#9ca3af" }}>
          Page {page}
        </span>
        <button
          className="btn btn-g btn-sm"
          disabled={!hasMore}
          onClick={() => fetchRefs(page + 1)}
        >
          Next <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
        </button>
      </div>

      {/* ── VIEW MODAL ───────────────────────────────────────────────── */}
      {viewing && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setViewing(null)}
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              Referral Detail
            </h3>
            <div className="form-grid" style={{ marginBottom: 14 }}>
              {[
                ["Giver", viewing.user?.name || viewing.giver_id?.slice(0, 16)],
                ["Receiver ID", viewing.receiver_id?.slice(0, 16) || "—"],
                ["Status", LABELS[viewing.status] || viewing.status || "—"],
                ["Amount", `₹${(viewing.amount || 0).toLocaleString()}`],
                [
                  "Date Given",
                  viewing.created_at
                    ? new Date(viewing.created_at).toLocaleDateString()
                    : "—",
                ],
                [
                  "Closed At",
                  viewing.closed_at
                    ? new Date(viewing.closed_at).toLocaleDateString()
                    : "—",
                ],
                ["Group ID", viewing.group_id?.slice(0, 16) || "—"],
                ["Notes", viewing.notes || "—"],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <div
                    style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}
                  >
                    {k}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {String(v)}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                background: "rgba(255,255,255,.04)",
                borderRadius: 10,
                padding: 12,
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                Business Description
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                {viewing.business_desc || "—"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-g btn-sm"
                onClick={() => {
                  setEditing({ ...viewing, notes: viewing.notes || "" });
                  setViewing(null);
                }}
              >
                Edit Referral
              </button>
              {(TRANSITIONS[viewing.status] || [])
                .filter((t) => t !== "lost" && t !== "declined")
                .map((target) => (
                  <button
                    key={target}
                    className="btn btn-g btn-sm"
                    style={{ color: "#10b981" }}
                    onClick={() => {
                      updateStatus(viewing.id, target);
                      setViewing(null);
                    }}
                  >
                    <FontAwesomeIcon icon={faArrowRight} className="mr-1.5" />
                    {LABELS[target]}
                  </button>
                ))}
              {(TRANSITIONS[viewing.status] || []).includes("lost") && (
                <button
                  className="btn btn-g btn-sm"
                  style={{ color: "#f59e0b" }}
                  onClick={() => {
                    updateStatus(viewing.id, "lost");
                    setViewing(null);
                  }}
                >
                  Mark Lost
                </button>
              )}
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setViewing(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ───────────────────────────────────────────────── */}
      {editing && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Edit Referral
            </h3>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
              From: {editing.user?.name || editing.giver_id?.slice(0, 16)}
            </p>
            <div className="form-grid">
              <div className="fg">
                <label>Status</label>
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value })
                  }
                >
                  {Object.keys(LABELS).map((s) => (
                    <option key={s} value={s}>
                      {LABELS[s]}
                    </option>
                  ))}
                </select>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--nx-muted)",
                    marginTop: 4,
                  }}
                >
                  Super Admin can set any stage directly here — everyone else
                  moves through the pipeline in order (see the stepper on each
                  row).
                </p>
              </div>
              <div className="fg">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  value={editing.amount || 0}
                  onChange={(e) =>
                    setEditing({ ...editing, amount: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="fg">
              <label>Business Description</label>
              <textarea
                rows={3}
                value={editing.business_desc || ""}
                onChange={(e) =>
                  setEditing({ ...editing, business_desc: e.target.value })
                }
                placeholder="Describe the business opportunity…"
              />
            </div>
            <div className="fg">
              <label>Notes / Follow-up</label>
              <textarea
                rows={2}
                value={editing.notes || ""}
                onChange={(e) =>
                  setEditing({ ...editing, notes: e.target.value })
                }
                placeholder="Add notes or follow-up details…"
              />
            </div>
            {/* Read-only info */}
            <div
              style={{
                background: "rgba(255,255,255,.04)",
                borderRadius: 10,
                padding: 12,
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
                Read-only fields
              </div>
              <div className="form-grid">
                {[
                  [
                    "Giver",
                    editing.user?.name || editing.giver_id?.slice(0, 16),
                  ],
                  ["Receiver ID", editing.receiver_id?.slice(0, 16) || "—"],
                  [
                    "Date Given",
                    editing.created_at
                      ? new Date(editing.created_at).toLocaleDateString()
                      : "—",
                  ],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      {String(v)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GIVE REFERRAL MODAL — MEMBER + GROUP DROPDOWNS ─────────── */}
      {showGive && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowGive(false)}
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              + Give Referral
            </h3>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
              Select the member receiving this referral and the group it was
              made in
            </p>

            {/* Receiver — live search */}
            <UserSearchPicker
              label="Receiver (Member)"
              required
              placeholder="Search member by name, email or city…"
              value={giveForm.receiver_id}
              onChange={(id) => setGiveForm({ ...giveForm, receiver_id: id })}
            />

            {/* Group dropdown */}
            <div className="fg">
              <label>Group (where referral was made)</label>
              <select
                value={giveForm.group_id}
                onChange={(e) =>
                  setGiveForm({ ...giveForm, group_id: e.target.value })
                }
              >
                <option value="">— Select group (optional) —</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} · {g.city || "—"}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="fg">
                <label>Est. Business Value (₹)</label>
                <input
                  type="number"
                  value={giveForm.amount}
                  onChange={(e) =>
                    setGiveForm({ ...giveForm, amount: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="fg">
              <label>Business Description *</label>
              <textarea
                rows={3}
                value={giveForm.business_desc}
                onChange={(e) =>
                  setGiveForm({ ...giveForm, business_desc: e.target.value })
                }
                placeholder="Describe the business opportunity — what does the receiver do, what is needed…"
              />
            </div>

            {/* Preview */}
            {giveForm.receiver_id &&
              giveForm.business_desc &&
              (() => {
                const g = groups.find((x: any) => x.id === giveForm.group_id);
                return (
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
                    <FontAwesomeIcon icon={faRotate} className="mr-1.5" />
                    Referral selected
                    {g ? ` · Group: "${g.name}"` : ""}
                    {giveForm.amount > 0
                      ? ` · Est. value ₹${giveForm.amount.toLocaleString()}`
                      : ""}
                  </div>
                );
              })()}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={giveReferral}
                disabled={
                  saving || !giveForm.receiver_id || !giveForm.business_desc
                }
              >
                {saving ? "Giving…" : "Give Referral"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setShowGive(false)}
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
