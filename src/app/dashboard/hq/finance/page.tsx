"use client";
import { Loading } from "@/components/shared/States";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faSackDollar,
  faStar,
  faCreditCard,
  faTriangleExclamation,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useRef } from "react";
import { PaymentsAPI, TerritoriesAPI, MembersAPI } from "@/lib/api";
import UserSearchPicker from "@/components/ui/UserSearchPicker";

export default function HQFinancePage() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState<any | null>(null);
  const [territories, setTerritories] = useState<any[]>([]);
  const [outstanding, setOutstanding] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [showRecord, setShowRecord] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payForm, setPayForm] = useState({
    user_id: "",
    user_name: "",
    amount: 150000,
    plan: "yearly",
    payment_method: "upi",
    notes: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [t, o, h] = await Promise.all([
        TerritoriesAPI.list({ page: 1, page_size: 50 }),
        PaymentsAPI.outstanding({ page: 1 }),
        PaymentsAPI.history({ page: 1, page_size: 20 }),
      ]);
      setTerritories(t.items || t);
      setOutstanding(o.items || o);
      setHistory(h.items || h);

      // Try to get payment stats
      try {
        const s = await PaymentsAPI.stats();
        setStats(s);
      } catch {
        // Stats endpoint may fail if no payments yet — derive from history
        const total = (h.items || h).reduce(
          (a: number, p: any) => a + (p.amount || 0),
          0,
        );
        setStats({
          total_collected: total,
          total_payments: (h.items || h).length,
          pending_amount: 0,
          pending_count: 0,
        });
      }
    } catch (e: any) {
      setError(e.message || "Failed to load finance data");
    } finally {
      setLoading(false);
    }
  };

  // Real fix (idempotency): the backend now requires an idempotency_key
  // for manual entries (auto-verified immediately, so a double-click or a
  // retry after a dropped response used to record — and revenue-count —
  // the same payment twice). Generated once per "Record Payment" attempt
  // and reused as-is on any retry of that same click; only cleared after
  // a real success or when the form is dismissed, so a genuinely new
  // recording gets a fresh key.
  const recordIdemKey = useRef<string | null>(null);

  const recordPayment = async () => {
    if (!payForm.user_id || !payForm.amount) return;
    if (!recordIdemKey.current) recordIdemKey.current = crypto.randomUUID();
    setSaving(true);
    try {
      // manual_entry:true — backend auto-verifies and marks as success immediately
      await PaymentsAPI.createOrder({
        user_id: payForm.user_id,
        amount: payForm.amount,
        plan: payForm.plan,
        payment_method: payForm.payment_method,
        notes: payForm.notes,
        manual_entry: true,
        idempotency_key: recordIdemKey.current,
      });
      recordIdemKey.current = null;
      setShowRecord(false);
      setPayForm({
        user_id: "",
        user_name: "",
        amount: 150000,
        plan: "yearly",
        payment_method: "upi",
        notes: "",
      });
      setMsg(
        `✅ Payment of ₹${payForm.amount.toLocaleString()} recorded for ${payForm.user_name}`,
      );
      fetchAll();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const sendReminder = async (id: string, name?: string) => {
    try {
      await PaymentsAPI.remind(id);
      setMsg(`✅ Reminder sent${name ? " to " + name : ""}`);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  const totalCollected = stats
    ? Math.round((stats.total_collected || 0) / 100000)
    : 0;
  const totalPending = stats
    ? Math.round((stats.pending_amount || 0) / 100000)
    : 0;
  const territoryRevenue = territories.reduce(
    (a, t) => a + (t.monthly_collection || 0),
    0,
  );

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
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Finance Control</h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            National collections, royalties and financial reporting
          </p>
        </div>
        <button className="btn btn-p" onClick={() => setShowRecord(true)}>
          + Record Payment
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

      {/* If all zeros — explain why */}
      {!loading && stats && stats.total_payments === 0 && (
        <div
          style={{
            background: "rgba(255,75,10,.1)",
            border: "1px solid rgba(255,75,10,.3)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 14,
            fontSize: 13,
            color: "#fbc568",
          }}
        >
          <strong>ℹ️ Why is Finance showing ₹0?</strong>
          <br />
          No payments have been recorded yet in the system. Payments are created
          when:
          <ul style={{ margin: "6px 0 0 16px", lineHeight: 1.8 }}>
            <li>A member enrolls and pays online (Razorpay/UPI)</li>
            <li>
              You manually record a payment using{" "}
              <strong>+ Record Payment</strong> above
            </li>
          </ul>
          Territory revenue shown below is from member count estimates, not
          actual payments.
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {loading
          ? [...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: 80,
                  background: "rgba(255,255,255,.06)",
                  borderRadius: 12,
                }}
              />
            ))
          : [
              {
                l: "Total Collected",
                v: `₹${totalCollected}L`,
                c: "#ff4b0a",
                sub: "From recorded payments",
              },
              {
                l: "Total Payments",
                v: stats?.total_payments || 0,
                c: "#10b981",
                sub: "Successful transactions",
              },
              {
                l: "Pending Amount",
                v: `₹${totalPending}L`,
                c: "#ef4444",
                sub: `${stats?.pending_count || 0} overdue`,
              },
              {
                l: "Territories",
                v: territories.length,
                c: "#6366f1",
                sub: `₹${Math.round(territoryRevenue / 100000)}L est. monthly`,
              },
            ].map((s) => (
              <div
                key={s.l}
                style={{
                  background: `linear-gradient(135deg,${s.c},${s.c}cc)`,
                  borderRadius: 12,
                  padding: "16px",
                  boxShadow: `0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`,
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
                  {s.v}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,.7)",
                    marginTop: 2,
                  }}
                >
                  {s.l}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,.5)",
                    marginTop: 2,
                  }}
                >
                  {s.sub}
                </div>
              </div>
            ))}
      </div>

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
          { id: "overview", l: "Overview" },
          { id: "territories", l: "Territory Revenue" },
          { id: "history", l: "Payment History" },
          { id: "outstanding", l: "Outstanding Dues" },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab-btn${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              <FontAwesomeIcon icon={faSackDollar} className="mr-1.5" />
              Payment Summary
            </div>
            {loading ? (
              <Loading compact label="Loading…" />
            ) : (
              [
                ["Total Collected", `₹${totalCollected}L`],
                ["Total Transactions", stats?.total_payments || 0],
                [
                  "Avg Payment",
                  `₹${Math.round(stats?.avg_payment || 0).toLocaleString()}`,
                ],
              ].map(([l, v]) => (
                <div
                  key={String(l)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "9px 0",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{l}</span>
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}
                  >
                    {v}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              <FontAwesomeIcon icon={faChartBar} className="mr-1.5" />
              Collection Status
            </div>
            {loading ? (
              <Loading compact label="Loading…" />
            ) : (
              [
                ["Collected", `₹${totalCollected}L`, "#10b981"],
                ["Pending", `₹${totalPending}L`, "#ef4444"],
                ["Transactions", stats?.total_payments || 0, "#6366f1"],
              ].map(([l, v, c]) => (
                <div
                  key={String(l)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "9px 0",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{l}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: c as string,
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Territory Revenue */}
      {tab === "territories" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                {[
                  "Territory",
                  "City",
                  "Country",
                  "Members",
                  "Monthly Est.",
                  "Royalty 15%",
                  "Net Est.",
                  "Status",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(4)].map((_, i) => (
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
                : territories.map((t) => {
                    const monthly = t.monthly_collection || 0;
                    const royalty = monthly * ((t.royalty_pct || 15) / 100);
                    const net = monthly - royalty;
                    return (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td>{t.city}</td>
                        <td>
                          <span
                            className={`badge ${t.country === "India" ? "b-blue" : "b-purple"}`}
                            style={{ fontSize: 10 }}
                          >
                            {t.country}
                          </span>
                        </td>
                        <td>{t.members_count || 0}</td>
                        <td style={{ fontWeight: 600, color: "#10b981" }}>
                          ₹{Math.round(monthly / 100000)}L
                        </td>
                        <td style={{ fontWeight: 600, color: "#6366f1" }}>
                          ₹{Math.round(royalty / 100000)}L
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ₹{Math.round(net / 100000)}L
                        </td>
                        <td>
                          <span
                            className={`badge ${t.status === "active" ? "b-green" : "b-yellow"}`}
                          >
                            {t.status || "active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment History */}
      {tab === "history" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700 }}>Payment History</div>
            <button
              className="btn btn-p btn-sm"
              onClick={() => setShowRecord(true)}
            >
              + Record Payment
            </button>
          </div>
          {history.length === 0 && !loading ? (
            <div
              className="card"
              style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>
                <FontAwesomeIcon icon={faCreditCard} />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                No payments recorded yet
              </div>
              <div style={{ fontSize: 13, marginBottom: 16 }}>
                Use "+ Record Payment" to log membership payments manually
              </div>
              <button
                className="btn btn-p btn-sm"
                onClick={() => setShowRecord(true)}
              >
                Record First Payment
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    {[
                      "Member",
                      "Amount",
                      "Plan",
                      "Method",
                      "Date",
                      "Status",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [...Array(4)].map((_, i) => (
                        <tr key={i}>
                          {[...Array(6)].map((_, j) => (
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
                    : history.map((p, i) => (
                        <tr key={p.id || i}>
                          <td style={{ fontWeight: 600 }}>
                            {p.user?.name || p.user_id?.slice(0, 12) || "—"}
                          </td>
                          <td style={{ fontWeight: 700, color: "#10b981" }}>
                            ₹{(p.amount || 0).toLocaleString()}
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
                                textTransform: "capitalize",
                              }}
                            >
                              {p.plan || "—"}
                            </span>
                          </td>
                          <td
                            style={{
                              fontSize: 12,
                              textTransform: "capitalize",
                            }}
                          >
                            {p.payment_method || "—"}
                          </td>
                          <td style={{ fontSize: 11, color: "#9ca3af" }}>
                            {p.created_at
                              ? new Date(p.created_at).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>
                            <span
                              className={`badge ${p.status === "paid" || p.status === "success" ? "b-green" : "b-yellow"}`}
                            >
                              {p.status || "pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Outstanding Dues */}
      {tab === "outstanding" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="mr-1.5"
              />
              Outstanding Dues
            </div>
            <button
              className="btn btn-g btn-sm"
              onClick={() =>
                outstanding.forEach((p) => sendReminder(p.id, p.user?.name))
              }
            >
              Send All Reminders
            </button>
          </div>
          {outstanding.length === 0 && !loading ? (
            <div
              className="card"
              style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}
            >
              <FontAwesomeIcon icon={faStar} className="mr-1.5" />
              No outstanding dues
            </div>
          ) : (
            outstanding.map((p, i) => (
              <div
                key={p.id || i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "var(--nx-panel)",
                  borderRadius: 10,
                  marginBottom: 8,
                  border: "1px solid var(--nx-line)",
                  boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {p.user?.name || p.user_id?.slice(0, 14) || "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span
                    style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}
                  >
                    ₹{(p.amount || 0).toLocaleString()}
                  </span>
                  <button
                    className="btn btn-xs btn-g"
                    onClick={() => sendReminder(p.id, p.user?.name)}
                  >
                    Send Reminder
                  </button>
                  <button
                    className="btn btn-xs btn-p"
                    onClick={() => {
                      setPayForm({
                        ...payForm,
                        user_id: p.user_id || "",
                        user_name: p.user?.name || "",
                        amount: p.amount || 150000,
                      });
                      setShowRecord(true);
                    }}
                  >
                    Record Payment
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── RECORD PAYMENT MODAL ─────────────────────────────────────── */}
      {showRecord && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowRecord(false)}
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              + Record Payment
            </h3>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
              Manually record a membership payment received offline or via bank
              transfer
            </p>
            <UserSearchPicker
              label="Member"
              required
              placeholder="Search member by name, email or city…"
              value={payForm.user_id}
              onChange={(id, user) =>
                setPayForm({
                  ...payForm,
                  user_id: id,
                  user_name: user?.name || "",
                })
              }
            />
            <div className="form-grid">
              <div className="fg">
                <label>Membership Plan</label>
                <select
                  value={payForm.plan}
                  onChange={(e) =>
                    setPayForm({
                      ...payForm,
                      plan: e.target.value,
                      amount: e.target.value === "yearly" ? 150000 : 420000,
                    })
                  }
                >
                  <option value="yearly">Yearly — ₹1,50,000</option>
                  <option value="three_year">3-Year — ₹4,20,000</option>
                </select>
              </div>
              <div className="fg">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  value={payForm.amount}
                  onChange={(e) =>
                    setPayForm({ ...payForm, amount: Number(e.target.value) })
                  }
                />
              </div>
              <div className="fg">
                <label>Payment Method</label>
                <select
                  value={payForm.payment_method}
                  onChange={(e) =>
                    setPayForm({ ...payForm, payment_method: e.target.value })
                  }
                >
                  <option value="upi">UPI</option>
                  <option value="neft">NEFT / Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>
            <div className="fg">
              <label>Notes (optional)</label>
              <input
                value={payForm.notes}
                onChange={(e) =>
                  setPayForm({ ...payForm, notes: e.target.value })
                }
                placeholder="UTR number, cheque number, reference…"
              />
            </div>
            {payForm.user_name && (
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
                <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5" />
                Recording ₹{payForm.amount.toLocaleString()} payment from{" "}
                <strong>{payForm.user_name}</strong> via{" "}
                {payForm.payment_method.toUpperCase()}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={recordPayment}
                disabled={saving || !payForm.user_id}
              >
                {saving ? "Recording…" : "Record Payment"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => {
                  recordIdemKey.current = null;
                  setShowRecord(false);
                }}
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
