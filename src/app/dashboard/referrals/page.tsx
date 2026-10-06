"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGift,
  faCircleCheck,
  faCircleXmark,
  faArrowRight,
  faArrowsRotate,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useRef } from "react";
import { ReferralsAPI, TokenStore } from "@/lib/api";
import UserSearchPicker from "@/components/ui/UserSearchPicker";
import PipelineStepper from "@/components/ui/PipelineStepper";
import { Loading, ApiError, Empty } from "@/components/shared/States";
import { Pagination } from "@/components/shared/Pagination";
import PageHero from "@/components/shared/PageHero";

// Real 6-stage pipeline now backed end-to-end: Pending -> Accepted ->
// Contacted -> Meeting -> Qualified -> Won, with Declined/Lost as the two
// off-ramps. See core/enums.py::ReferralStatus + referrals/service.py::
// ALLOWED_TRANSITIONS on the backend for the stage graph this renders.
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
const STATUS_BADGE: Record<string, string> = {
  pending: "b-orange",
  accepted: "b-blue",
  contacted: "b-yellow",
  meeting: "b-purple",
  qualified: "b-purple",
  won: "b-green",
  declined: "b-red",
  lost: "b-red",
};
const CATEGORIES = [
  "IT Services",
  "Finance & Insurance",
  "Real Estate",
  "CA / Finance",
  "Marketing",
  "Manufacturing",
  "Legal",
  "Solar",
  "Logistics",
  "Healthcare",
  "Events",
  "Education",
  "Other",
];
const URGENCY_BADGE: Record<string, string> = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#6b7280",
};
const FILTERS = [
  "",
  "pending",
  "accepted",
  "contacted",
  "meeting",
  "qualified",
  "won",
  "declined",
  "lost",
];

export default function ReferralsPage() {
  const me = TokenStore.getUser();
  const isFranchiseUp = ["franchise", "hq_admin", "super_admin"].includes(
    me?.role,
  );

  const [referrals, setReferrals] = useState<any[]>([]);
  const [refPage, setRefPage] = useState(1);
  const [refTotal, setRefTotal] = useState<number | null>(0);
  const [refHasMore, setRefHasMore] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [pipelineMeta, setPipelineMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [direction, setDirection] = useState<"received" | "given">("received");
  const requestId = useRef(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const emptyForm = {
    receiver_id: "",
    title: "",
    category: "IT Services",
    client_name: "",
    client_company: "",
    client_mobile: "",
    client_email: "",
    business_desc: "",
    amount: "",
    urgency: "Medium",
    notes: "",
    attachment: "",
  };
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const fetchAll = async (p = 1) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      // A status filter can't be applied server-side (the API doesn't
      // support it), so real Prev/Next pagination only applies to "All".
      // With a filter active, fetch a bounded larger batch and filter
      // client-side instead — still cheap since this is one person's
      // own given+received referrals, not a platform-wide list.
      const pageSize = statusFilter ? 100 : 20; // 100 is the backend's hard cap (page_size<=100)
      const [listRes, statsRes, pipelineRes] = await Promise.all([
        ReferralsAPI.list({
          direction: !isFranchiseUp ? direction : undefined,
          page: statusFilter ? 1 : p,
          page_size: pageSize,
        }),
        ReferralsAPI.stats().catch(() => null),
        ReferralsAPI.pipeline().catch(() => null),
      ]);
      if (currentRequest !== requestId.current) return;
      setReferrals(listRes.items || listRes || []);
      setRefTotal(listRes.total ?? null);
      setRefHasMore(listRes.has_more || false);
      setRefPage(statusFilter ? 1 : p);
      setStats(statsRes);
      setPipelineMeta(pipelineRes);
    } catch (e: any) {
      if (currentRequest === requestId.current) setError(e.message);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(1);
    return () => {
      requestId.current += 1;
    };
  }, [statusFilter, direction]);

  const filtered = statusFilter
    ? referrals.filter((r) => r.status === statusFilter)
    : referrals;

  const giveReferral = async () => {
    if (!form.receiver_id || !(form.business_desc || "").trim()) {
      setMsg("❌ Select who this is for and describe the business");
      return;
    }
    setSaving(true);
    try {
      await ReferralsAPI.give({
        receiver_id: form.receiver_id,
        group_id: me?.group_id,
        title: (form.title || "").trim(),
        category: form.category,
        client_name: (form.client_name || "").trim(),
        client_company: (form.client_company || "").trim(),
        client_mobile: (form.client_mobile || "").trim(),
        client_email: (form.client_email || "").trim(),
        business_desc: (form.business_desc || "").trim(),
        amount: form.amount ? Number(form.amount) : 0,
        urgency: form.urgency,
        notes: (form.notes || "").trim(),
        attachment: (form.attachment || "").trim(),
      });
      setShowForm(false);
      setForm(emptyForm);
      setMsg("✅ Referral sent!");
      fetchAll();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const advanceStage = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await ReferralsAPI.updateStatus(id, { status });
      setMsg(`✅ Moved to ${LABELS[status] || status}`);
      setSelected(null);
      fetchAll();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusyId(null);
    }
  };

  const decide = async (id: string, accept: boolean) => {
    setBusyId(id);
    try {
      await ReferralsAPI.decide(id, accept);
      setMsg(accept ? "✅ Referral accepted" : "Referral declined");
      setSelected(null);
      fetchAll();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusyId(null);
    }
  };

  const removeReferral = async (id: string) => {
    if (!confirm("Delete this referral?")) return;
    setBusyId(id);
    try {
      await ReferralsAPI.delete(id);
      setMsg("✅ Referral deleted");
      setSelected(null);
      fetchAll();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusyId(null);
    }
  };

  const activeStats = !isFranchiseUp
    ? direction === "received"
      ? stats?.received_stats
      : stats?.given_stats
    : stats;
  const byStatus = activeStats?.by_status || {};
  const money = (value: number) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;
  // "accepted" is excluded here on purpose — that decision belongs only
  // to the receiver via Accept/Decline (canDecide below), never as a
  // generic "Move to X" stepper button. Without this, the giver could
  // self-approve their own pending referral.
  // Past "accepted", only the receiver (the one actually working the
  // deal) can advance the pipeline — matches the same backend guard.
  // Franchise+ keeps override access, same as the accept/decline gate.
  const canAdvance = selected
    ? selected.direction === "received" || isFranchiseUp
    : false;
  const forwardTargets = canAdvance
    ? (selected
        ? pipelineMeta?.transitions?.[selected.status] || []
        : []
      ).filter(
        (s: string) => s !== "lost" && s !== "declined" && s !== "accepted",
      )
    : [];
  const canMarkLost =
    canAdvance && selected
      ? (pipelineMeta?.transitions?.[selected.status] || []).includes("lost")
      : false;
  const canDecide =
    selected?.status === "pending" &&
    (selected.direction === "received" || isFranchiseUp);

  return (
    <div className="page referrals-page">
      <div className="referrals-hero">
        <PageHero
          icon={faArrowsRotate}
          kicker="Give & Grow"
          title="Referrals"
          description="Track referrals through the full pipeline — accept, work, and close."
        />
        <img
          src="/visuals/profile-referrals-3d.jpg"
          alt=""
          aria-hidden="true"
        />
        {!isFranchiseUp && (
          <button
            className="btn btn-p referrals-give-button"
            onClick={() => {
              setForm(emptyForm);
              setShowForm(true);
            }}
          >
            + Give Referral
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

      {isFranchiseUp && (
        <div className="alert-info" style={{ marginBottom: 16 }}>
          Referrals are given member-to-member — franchise sees everyone's
          activity here.
        </div>
      )}

      {!isFranchiseUp && (
        <div
          className="referrals-direction-tabs"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            padding: 6,
            marginBottom: 14,
            border: "1px solid var(--nx-border)",
            borderRadius: 14,
            background: "rgba(226,236,249,.72)",
          }}
        >
          <button
            className={`btn ${direction === "received" ? "btn-p" : "btn-g"}`}
            aria-pressed={direction === "received"}
            onClick={() => {
              setDirection("received");
              setStatusFilter("");
              setSelected(null);
            }}
          >
            Referrals Received{" "}
            <span className="badge" style={{ marginLeft: 6 }}>
              {stats?.received ?? "—"}
            </span>
          </button>
          <button
            className={`btn ${direction === "given" ? "btn-p" : "btn-g"}`}
            aria-pressed={direction === "given"}
            onClick={() => {
              setDirection("given");
              setStatusFilter("");
              setSelected(null);
            }}
          >
            Referrals Given{" "}
            <span className="badge" style={{ marginLeft: 6 }}>
              {stats?.given ?? "—"}
            </span>
          </button>
        </div>
      )}

      {stats && (
        <div
          className="referrals-stat-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {!isFranchiseUp ? (
            direction === "received" ? (
              <>
                <div
                  className="card referral-stat-card"
                  style={{ textAlign: "center" }}
                >
                  <div
                    className="stat-num"
                    style={{ fontSize: 24, fontWeight: 800, color: "#6366f1" }}
                  >
                    {activeStats?.total || 0}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Total Received
                  </div>
                </div>
                <div
                  className="card referral-stat-card"
                  style={{ textAlign: "center" }}
                >
                  <div
                    className="stat-num"
                    style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}
                  >
                    {activeStats?.awaiting_action || 0}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Awaiting Action
                  </div>
                </div>
                <div
                  className="card referral-stat-card"
                  style={{ textAlign: "center" }}
                >
                  <div
                    className="stat-num"
                    style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}
                  >
                    {activeStats?.won || 0}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>Won</div>
                </div>
                <div
                  className="card referral-stat-card"
                  style={{ textAlign: "center" }}
                >
                  <div
                    className="stat-num"
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: "var(--nx-orange)",
                    }}
                  >
                    {money(activeStats?.business_value_won)}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Business Value Won
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  className="card referral-stat-card"
                  style={{ textAlign: "center" }}
                >
                  <div
                    className="stat-num"
                    style={{ fontSize: 24, fontWeight: 800, color: "#6366f1" }}
                  >
                    {activeStats?.total || 0}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Total Given
                  </div>
                </div>
                <div
                  className="card referral-stat-card"
                  style={{ textAlign: "center" }}
                >
                  <div
                    className="stat-num"
                    style={{ fontSize: 24, fontWeight: 800, color: "#3b82f6" }}
                  >
                    {activeStats?.accepted || 0}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>Accepted</div>
                </div>
                <div
                  className="card referral-stat-card"
                  style={{ textAlign: "center" }}
                >
                  <div
                    className="stat-num"
                    style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}
                  >
                    {activeStats?.won || 0}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Won by Recipient
                  </div>
                </div>
                <div
                  className="card referral-stat-card"
                  style={{ textAlign: "center" }}
                >
                  <div
                    className="stat-num"
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: "var(--nx-orange)",
                    }}
                  >
                    {activeStats?.contribution_points || 0}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Contribution Points
                  </div>
                </div>
              </>
            )
          ) : (
            <>
              <div
                className="card referral-stat-card"
                style={{ textAlign: "center" }}
              >
                <div
                  className="stat-num"
                  style={{ fontSize: 24, fontWeight: 800, color: "#6366f1" }}
                >
                  {stats.total}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Total</div>
              </div>
              <div
                className="card referral-stat-card"
                style={{ textAlign: "center" }}
              >
                <div
                  className="stat-num"
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "var(--nx-orange)",
                  }}
                >
                  {byStatus.pending || 0}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Pending</div>
              </div>
              <div
                className="card referral-stat-card"
                style={{ textAlign: "center" }}
              >
                <div
                  className="stat-num"
                  style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}
                >
                  {byStatus.won || 0}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Won</div>
              </div>
              <div
                className="card referral-stat-card"
                style={{ textAlign: "center" }}
              >
                <div
                  className="stat-num"
                  style={{ fontSize: 24, fontWeight: 800, color: "#ef4444" }}
                >
                  {(byStatus.lost || 0) + (byStatus.declined || 0)}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  Lost/Declined
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div
        className="referrals-pipeline-filters"
        style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}
      >
        {FILTERS.map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? "btn-p" : "btn-g"}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === "" ? "All" : LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading label="Loading referrals…" />
      ) : error ? (
        <ApiError message={error} onRetry={() => fetchAll(refPage)} />
      ) : filtered.length === 0 ? (
        <Empty
          label={
            statusFilter
              ? "No referrals match this status"
              : isFranchiseUp
                ? "No referrals yet"
                : `No referrals ${direction} yet`
          }
        />
      ) : (
        <>
          <div
            className="card referrals-table-wrap"
            style={{ padding: 0, overflow: "hidden" }}
          >
            <table className="tbl referrals-table">
              <thead>
                <tr>
                  {[
                    "Title & Category",
                    "Client",
                    "Budget",
                    "Urgency",
                    "To/From",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(r)}
                  >
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {r.title || r.business_desc}
                      </div>
                      {r.category && (
                        <div style={{ fontSize: 11, color: "var(--nx-muted)" }}>
                          {r.category}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>
                        {r.client_name || "—"}
                      </div>
                      {r.client_email && (
                        <div style={{ fontSize: 11, color: "var(--nx-muted)" }}>
                          {r.client_email}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>
                      {r.amount ? `₹${r.amount.toLocaleString()}` : "—"}
                    </td>
                    <td>
                      {r.urgency && (
                        <span
                          className="badge"
                          style={{
                            background: `${URGENCY_BADGE[r.urgency] || "#6b7280"}22`,
                            color: URGENCY_BADGE[r.urgency] || "#6b7280",
                            border: `1px solid ${URGENCY_BADGE[r.urgency] || "#6b7280"}55`,
                          }}
                        >
                          {r.urgency}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {r.direction === "given"
                        ? "To "
                        : r.direction === "received"
                          ? "From "
                          : ""}
                      {r.user?.name || "—"}
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_BADGE[r.status] || "b-gray"}`}
                      >
                        {LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--nx-muted)" }}>
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="btn btn-g btn-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(r);
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!statusFilter && (
            <Pagination
              page={refPage}
              pageSize={20}
              total={refTotal}
              hasMore={refHasMore}
              loading={loading}
              onPageChange={fetchAll}
            />
          )}
        </>
      )}

      {/* ── GIVE REFERRAL MODAL ─────────────────────────────────────── */}
      {showForm && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="modal modal-lg referral-form-modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              <FontAwesomeIcon icon={faGift} className="mr-1.5" />
              Give a Referral
            </h3>
            <div className="form-grid">
              <div className="fg">
                <label>Referral Title</label>
                <input
                  placeholder="e.g. Website Development"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="fg">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <UserSearchPicker
              openToReferralsOnly
              label="Refer To"
              required
              placeholder="Search member by name, email or city…"
              value={form.receiver_id}
              onChange={(id) => setForm({ ...form, receiver_id: id })}
            />
            <div className="form-grid">
              <div className="fg">
                <label>Client Name</label>
                <input
                  placeholder="Full name"
                  value={form.client_name}
                  onChange={(e) =>
                    setForm({ ...form, client_name: e.target.value })
                  }
                />
              </div>
              <div className="fg">
                <label>Client Company</label>
                <input
                  placeholder="Company name"
                  value={form.client_company}
                  onChange={(e) =>
                    setForm({ ...form, client_company: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-grid">
              <div className="fg">
                <label>Client Mobile</label>
                <input
                  placeholder="+91 98765 43210"
                  value={form.client_mobile}
                  onChange={(e) =>
                    setForm({ ...form, client_mobile: e.target.value })
                  }
                />
              </div>
              <div className="fg">
                <label>Client Email</label>
                <input
                  type="email"
                  placeholder="client@email.com"
                  value={form.client_email}
                  onChange={(e) =>
                    setForm({ ...form, client_email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="fg">
              <label>Estimated Value (₹)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="fg">
              <label>Urgency</label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              >
                {["High", "Medium", "Low"].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="fg">
              <label>What's the business? *</label>
              <textarea
                rows={3}
                value={form.business_desc}
                onChange={(e) =>
                  setForm({ ...form, business_desc: e.target.value })
                }
                placeholder="e.g. GST audit for a 50-person manufacturing firm in Pune"
              />
            </div>
            <div className="fg">
              <label>Notes / Referral Pitch</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Context for the receiving member…"
              />
            </div>
            <div className="fg">
              <label>Attachment (URL or description)</label>
              <input
                value={form.attachment}
                onChange={(e) =>
                  setForm({ ...form, attachment: e.target.value })
                }
                placeholder="Link to brief, doc, or any supporting info"
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={giveReferral}
                disabled={saving}
              >
                {saving ? "Sending…" : "Send Referral"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAILS MODAL — full pipeline stepper + stage actions ───── */}
      {selected && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="modal modal-lg referral-details-modal">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>
                {selected.title || "Referral"}
              </h3>
              {selected.urgency && (
                <span
                  className="badge"
                  style={{
                    background: `${URGENCY_BADGE[selected.urgency] || "#6b7280"}22`,
                    color: URGENCY_BADGE[selected.urgency] || "#6b7280",
                    border: `1px solid ${URGENCY_BADGE[selected.urgency] || "#6b7280"}55`,
                  }}
                >
                  {selected.urgency} urgency
                </span>
              )}
            </div>
            {selected.category && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--nx-muted)",
                  marginBottom: 14,
                }}
              >
                {selected.category}
              </p>
            )}

            <div style={{ marginBottom: 18 }}>
              <PipelineStepper status={selected.status} />
            </div>

            {/* Referral details */}
            <div className="modal-section" style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#9ca3af",
                  marginBottom: 10,
                  letterSpacing: 0.3,
                }}
              >
                REFERRAL
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#cbd5e1",
                  marginBottom: 12,
                  lineHeight: 1.6,
                }}
              >
                {selected.business_desc}
              </div>
              <div className="form-grid">
                <div className="fg">
                  <label>
                    {selected.direction === "given" ? "Referred To" : "From"}
                  </label>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {selected.user?.name || "—"}
                  </div>
                </div>
                <div className="fg">
                  <label>Amount</label>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {selected.amount
                      ? `₹${selected.amount.toLocaleString()}`
                      : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Client details — only shown if any were captured */}
            {(selected.client_name ||
              selected.client_company ||
              selected.client_mobile ||
              selected.client_email) && (
              <div className="modal-section" style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#9ca3af",
                    marginBottom: 10,
                    letterSpacing: 0.3,
                  }}
                >
                  CLIENT
                </div>
                <div className="form-grid">
                  {selected.client_name && (
                    <div className="fg">
                      <label>Name</label>
                      <div style={{ fontSize: 14 }}>{selected.client_name}</div>
                    </div>
                  )}
                  {selected.client_company && (
                    <div className="fg">
                      <label>Company</label>
                      <div style={{ fontSize: 14 }}>
                        {selected.client_company}
                      </div>
                    </div>
                  )}
                  {selected.client_mobile && (
                    <div className="fg">
                      <label>Mobile</label>
                      <div style={{ fontSize: 14 }}>
                        {selected.client_mobile}
                      </div>
                    </div>
                  )}
                  {selected.client_email && (
                    <div className="fg" style={{ gridColumn: "1/-1" }}>
                      <label>Email</label>
                      <div style={{ fontSize: 14 }}>
                        {selected.client_email}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selected.notes && (
              <div className="fg">
                <label>Notes / Referral Pitch</label>
                <div style={{ fontSize: 13, color: "#cbd5e1" }}>
                  {selected.notes}
                </div>
              </div>
            )}
            {selected.attachment && (
              <div className="fg">
                <label>Attachment</label>
                <div style={{ fontSize: 13 }}>
                  <a
                    href={selected.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--nx-blue)" }}
                  >
                    {selected.attachment}
                  </a>
                </div>
              </div>
            )}

            {canDecide && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 8,
                  marginBottom: 8,
                }}
              >
                <button
                  className="btn btn-p"
                  style={{ flex: 1, background: "#10b981" }}
                  onClick={() => decide(selected.id, true)}
                  disabled={busyId === selected.id}
                >
                  <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5" />
                  Accept
                </button>
                <button
                  className="btn btn-g"
                  style={{ flex: 1, color: "#ef4444" }}
                  onClick={() => decide(selected.id, false)}
                  disabled={busyId === selected.id}
                >
                  <FontAwesomeIcon icon={faCircleXmark} className="mr-1.5" />
                  Decline
                </button>
              </div>
            )}

            {!canDecide &&
              !canAdvance &&
              [
                "pending",
                "accepted",
                "contacted",
                "meeting",
                "qualified",
              ].includes(selected.status) && (
                <div
                  className="modal-notice"
                  style={{ marginBottom: 8, textAlign: "center" }}
                >
                  {selected.status === "pending"
                    ? `Waiting for ${selected.user?.name || "the recipient"} to accept or decline this referral.`
                    : `${selected.user?.name || "The recipient"} is working this referral — you'll be notified as it progresses.`}
                </div>
              )}

            {!canDecide && (forwardTargets.length > 0 || canMarkLost) && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 8,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                {forwardTargets.map((target: string) => (
                  <button
                    key={target}
                    className="btn btn-p"
                    style={{ flex: 1 }}
                    onClick={() => advanceStage(selected.id, target)}
                    disabled={busyId === selected.id}
                  >
                    <FontAwesomeIcon icon={faArrowRight} className="mr-1.5" />
                    Move to {LABELS[target]}
                  </button>
                ))}
                {canMarkLost && (
                  <button
                    className="btn btn-g"
                    style={{ color: "#ef4444" }}
                    onClick={() => advanceStage(selected.id, "lost")}
                    disabled={busyId === selected.id}
                  >
                    Mark Lost
                  </button>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {(selected.direction === "given" || !selected.direction) && (
                <button
                  className="btn btn-g btn-sm"
                  style={{ color: "#ef4444" }}
                  onClick={() => removeReferral(selected.id)}
                >
                  Delete
                </button>
              )}
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
