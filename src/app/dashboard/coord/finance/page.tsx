"use client";

const PAYMENTS = [
  {
    name: "Rohit Arora",
    plan: "Yearly",
    amount: "₹1,50,000",
    due: "Apr 1, 2027",
    status: "paid",
  },
  {
    name: "Vijay Mehta",
    plan: "Yearly",
    amount: "₹1,50,000",
    due: "Jun 1, 2026",
    status: "due-soon",
  },
  {
    name: "Sunita Verma",
    plan: "Yearly",
    amount: "₹1,50,000",
    due: "Mar 1, 2026",
    status: "overdue",
  },
  {
    name: "Priya Khanna",
    plan: "Yearly",
    amount: "₹1,50,000",
    due: "Sep 1, 2026",
    status: "paid",
  },
  {
    name: "Deepak Jain",
    plan: "Yearly",
    amount: "₹0",
    due: "—",
    status: "free",
  },
  {
    name: "Kavya Sharma",
    plan: "Yearly",
    amount: "₹1,50,000",
    due: "Jun 1, 2026",
    status: "due-soon",
  },
  {
    name: "Nitin Sood",
    plan: "Yearly",
    amount: "₹1,50,000",
    due: "Sep 1, 2026",
    status: "paid",
  },
];

export default function CoordFinancePage() {
  return (
    <div className="page">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Finance Overview</h2>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          Track member payment status — coordinators view only, not manage
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { l: "Total Collected", v: "₹6,00,000", c: "#10b981" },
          { l: "Overdue", v: "₹1,50,000", c: "#ef4444" },
          { l: "Due This Month", v: "₹3,00,000", c: "#f59e0b" },
          { l: "Free Members", v: 0, c: "#9ca3af" },
        ].map((s) => (
          <div key={s.l} className="stat-card">
            <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>
              {s.v}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            fontWeight: 700,
            fontSize: 14,
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Member Payment Status
          <button
            className="btn btn-g btn-sm"
            onClick={() => alert("Sending payment reminders...")}
          >
            📢 Send Reminders
          </button>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              {[
                "Member",
                "Plan",
                "Amount",
                "Renewal Date",
                "Status",
                "Action",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PAYMENTS.map((p, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{p.plan}</td>
                <td style={{ fontWeight: 600 }}>{p.amount}</td>
                <td style={{ fontSize: 12, color: "#9ca3af" }}>{p.due}</td>
                <td>
                  <span
                    className={`badge ${p.status === "paid" ? "b-green" : p.status === "overdue" ? "b-red" : p.status === "due-soon" ? "b-yellow" : "b-gray"}`}
                  >
                    {p.status === "due-soon"
                      ? "Due Soon"
                      : p.status === "free"
                        ? "Free"
                        : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </td>
                <td>
                  {p.status !== "paid" && p.status !== "free" && (
                    <button
                      className="btn btn-xs btn-g"
                      onClick={() => alert("Reminder sent to " + p.name)}
                    >
                      Remind
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
