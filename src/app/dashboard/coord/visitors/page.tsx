"use client";
import { useState } from "react";

const VISITORS = [
  {
    id: 1,
    name: "Arjun Patel",
    mobile: "+91 98001 11111",
    referredBy: "Rohit Arora",
    business: "Software Export",
    date: "Apr 20, 2026",
    status: "pending",
  },
  {
    id: 2,
    name: "Kavya Sharma",
    mobile: "+91 98001 22222",
    referredBy: "Vijay Mehta",
    business: "CA Firm",
    date: "Apr 18, 2026",
    status: "approved",
  },
  {
    id: 3,
    name: "Rohit Jain",
    mobile: "+91 98001 33333",
    referredBy: "Sunita Verma",
    business: "Property Developer",
    date: "Apr 15, 2026",
    status: "approved",
  },
  {
    id: 4,
    name: "Sunita Nair",
    mobile: "+91 98001 44444",
    referredBy: "Priya Khanna",
    business: "Digital Agency",
    date: "Apr 10, 2026",
    status: "converted",
  },
];

export default function CoordVisitorsPage() {
  const [showForm, setShowForm] = useState(false);
  const [visitors, setVisitors] = useState(VISITORS);

  const approve = (id: number) =>
    setVisitors((v) =>
      v.map((x) => (x.id === id ? { ...x, status: "approved" } : x)),
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
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Visitors</h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Manage visitor registrations and approvals
          </p>
        </div>
        <button className="btn btn-p" onClick={() => setShowForm(true)}>
          + Register Visitor
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { l: "This Month", v: 4, c: "#6366f1" },
          { l: "Pending Approval", v: 1, c: "#f59e0b" },
          { l: "Converted to Member", v: 1, c: "#10b981" },
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
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>
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

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="tbl">
          <thead>
            <tr>
              {[
                "Name",
                "Mobile",
                "Referred By",
                "Business",
                "Date",
                "Status",
                "Action",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visitors.map((v) => (
              <tr key={v.id}>
                <td style={{ fontWeight: 600 }}>{v.name}</td>
                <td style={{ fontSize: 12 }}>{v.mobile}</td>
                <td style={{ fontSize: 12 }}>{v.referredBy}</td>
                <td style={{ fontSize: 12 }}>{v.business}</td>
                <td style={{ fontSize: 12, color: "#9ca3af" }}>{v.date}</td>
                <td>
                  <span
                    className={`badge ${v.status === "approved" ? "b-green" : v.status === "converted" ? "b-purple" : "b-yellow"}`}
                    style={{ textTransform: "capitalize" }}
                  >
                    {v.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    {v.status === "pending" && (
                      <button
                        className="btn btn-xs btn-p"
                        onClick={() => approve(v.id)}
                      >
                        Approve
                      </button>
                    )}
                    <button
                      className="btn btn-xs btn-g"
                      onClick={() => alert("Following up with " + v.name)}
                    >
                      Follow Up
                    </button>
                    {v.status === "approved" && (
                      <button
                        className="btn btn-xs btn-g"
                        onClick={() =>
                          alert("Convert " + v.name + " to member")
                        }
                      >
                        Convert
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              Register Visitor
            </h3>
            <div className="form-grid">
              <div className="fg">
                <label>Visitor Name</label>
                <input placeholder="Full name" />
              </div>
              <div className="fg">
                <label>Mobile</label>
                <input placeholder="+91 98765 43210" />
              </div>
              <div className="fg">
                <label>Business</label>
                <input placeholder="Business type" />
              </div>
              <div className="fg">
                <label>Referred By</label>
                <select>
                  <option>-- Select Member --</option>
                  {[
                    "Rohit Arora",
                    "Vijay Mehta",
                    "Sunita Verma",
                    "Aakash Gupta",
                    "Priya Khanna",
                    "Deepak Jain",
                    "Kavya Sharma",
                    "Nitin Sood",
                  ].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="fg">
              <label>Meeting Date</label>
              <input type="date" />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={() => {
                  alert("✅ Visitor registered!");
                  setShowForm(false);
                }}
              >
                Register
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
    </div>
  );
}
