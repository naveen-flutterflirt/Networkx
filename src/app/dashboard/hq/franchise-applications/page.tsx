"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { FranchiseApplicationsAPI } from "@/lib/api";
import { Loading, ApiError, Empty } from "@/components/shared/States";

const STAGES = [
  { key: "submitted", label: "New", color: "#6366f1" },
  { key: "under_review", label: "Under Review", color: "#f59e0b" },
  { key: "approved", label: "Approved", color: "#10b981" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
  { key: "activated", label: "Activated", color: "#8b5cf6" },
];

export default function FranchiseApplicationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await FranchiseApplicationsAPI.list();
      setItems(res.items || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openReview = (app: any) => {
    setSelected(app);
    setReviewNotes(app.review_notes || "");
  };

  const transition = async (status: string) => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await FranchiseApplicationsAPI.transition(selected.id, {
        status,
        review_notes: reviewNotes,
      });
      setItems(items.map((i) => (i.id === selected.id ? { ...i, ...res } : i)));
      setMsg(`✅ Moved to ${STAGES.find((s) => s.key === status)?.label}`);
      setSelected(null);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const nextActions: Record<string, { status: string; label: string }[]> = {
    submitted: [
      { status: "under_review", label: "Start Review" },
      { status: "rejected", label: "Reject" },
    ],
    under_review: [
      { status: "approved", label: "Approve" },
      { status: "rejected", label: "Reject" },
    ],
    approved: [], // activation happens via Territories → Create, referencing this application
    rejected: [],
    activated: [],
  };

  return (
    <div className="page">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>
          Franchise Applications
        </h2>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          Application → Review → Approval → Activation, with a real record of
          every decision.
        </p>
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

      {loading ? (
        <Loading label="Loading applications…" />
      ) : error ? (
        <ApiError message={error} onRetry={fetchAll} />
      ) : items.length === 0 ? (
        <Empty label="No franchise applications yet" />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: 12,
          }}
        >
          {STAGES.map((stage) => (
            <div key={stage.key}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: stage.color,
                  }}
                />
                <div
                  style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af" }}
                >
                  {stage.label} (
                  {items.filter((i) => i.status === stage.key).length})
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items
                  .filter((i) => i.status === stage.key)
                  .map((app) => (
                    <div
                      key={app.id}
                      className="card"
                      style={{ padding: 12, cursor: "pointer" }}
                      onClick={() => openReview(app)}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {app.applicant_name}
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>
                        <FontAwesomeIcon
                          icon={faLocationDot}
                          className="mr-1.5"
                        />
                        {app.proposed_city}
                        {app.proposed_state ? `, ${app.proposed_state}` : ""}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              {selected.applicant_name}
            </h3>
            <span
              className="badge"
              style={{
                background: `${STAGES.find((s) => s.key === selected.status)?.color}22`,
                color: STAGES.find((s) => s.key === selected.status)?.color,
                marginBottom: 14,
                display: "inline-block",
              }}
            >
              {STAGES.find((s) => s.key === selected.status)?.label}
            </span>
            <div className="form-grid" style={{ marginBottom: 12 }}>
              <div className="fg">
                <label>Email</label>
                <div style={{ fontSize: 13 }}>{selected.applicant_email}</div>
              </div>
              <div className="fg">
                <label>Phone</label>
                <div style={{ fontSize: 13 }}>
                  {selected.applicant_phone || "—"}
                </div>
              </div>
              <div className="fg">
                <label>Proposed City</label>
                <div style={{ fontSize: 13 }}>{selected.proposed_city}</div>
              </div>
              <div className="fg">
                <label>State / Country</label>
                <div style={{ fontSize: 13 }}>
                  {selected.proposed_state || "—"}, {selected.proposed_country}
                </div>
              </div>
            </div>
            {selected.business_experience && (
              <div className="fg">
                <label>Business Experience</label>
                <div style={{ fontSize: 13, color: "#cbd5e1" }}>
                  {selected.business_experience}
                </div>
              </div>
            )}
            {selected.notes && (
              <div className="fg">
                <label>Additional Notes</label>
                <div style={{ fontSize: 13, color: "#cbd5e1" }}>
                  {selected.notes}
                </div>
              </div>
            )}
            {nextActions[selected.status]?.length > 0 && (
              <div className="fg">
                <label>Review Notes</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional — visible in the application record"
                />
              </div>
            )}
            {selected.status === "approved" && (
              <div
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  marginBottom: 12,
                  background: "rgba(255,255,255,.04)",
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              >
                Approved — to go live, create the territory under HQ → Regions
                and reference this application. That's what actually activates
                it.
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {nextActions[selected.status]?.map((a) => (
                <button
                  key={a.status}
                  className="btn btn-p"
                  style={{ flex: 1 }}
                  disabled={busy}
                  onClick={() => transition(a.status)}
                >
                  {a.label}
                </button>
              ))}
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
