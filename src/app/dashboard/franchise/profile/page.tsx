"use client";
import { useState } from "react";
import { getUser } from "@/lib/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

export default function FranchiseProfilePage() {
  const user = getUser();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "Rajesh Gupta");
  const [mobile, setMobile] = useState("+91 98765 00001");
  const [email, setEmail] = useState(user?.email || "franchise@nia.com");
  const [city, setCity] = useState("Delhi");
  const [bio, setBio] = useState(
    "Delhi territory franchise owner since 2019. Managing 6 groups across Delhi NCR with 245+ members.",
  );
  const [company, setCompany] = useState("Gupta Enterprises");
  const [profession, setProfession] = useState("Business Consultant");

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>My Profile</h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            City Partner profile — Delhi Territory
          </p>
        </div>
        <button className="btn btn-p" onClick={() => setEditing(!editing)}>
          {editing ? (
            "Cancel"
          ) : (
            <>
              <FontAwesomeIcon icon={faPenToSquare} className="mr-1.5" />
              Edit Profile
            </>
          )}
        </button>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}
      >
        {/* Left panel */}
        <div>
          <div
            className="card"
            style={{ textAlign: "center", marginBottom: 14 }}
          >
            <div
              style={{
                position: "relative",
                width: 88,
                height: 88,
                margin: "0 auto 12px",
              }}
            >
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg,var(--nx-orange),#ff8a65)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30,
                  fontWeight: 800,
                  color: "#fff",
                  boxShadow: "0 4px 20px rgba(255,92,53,.4)",
                }}
              >
                {name
                  .split(" ")
                  .map((n: any) => n[0])
                  .join("")}
              </div>
              {editing && (
                <button
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "var(--nx-panel)",
                    border: "2px solid var(--nx-line)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                  onClick={() => alert("Upload photo")}
                >
                  📷
                </button>
              )}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{name}</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
              City Partner · Delhi Territory
            </div>
            <div
              style={{ fontSize: 12, color: "var(--nx-orange)", marginTop: 4 }}
            >
              Partner since 2019
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
              Territory Stats
            </div>
            {[
              { l: "Groups Managed", v: 6 },
              { l: "Total Members", v: 245 },
              { l: "Avg Health Score", v: "80/100" },
              { l: "Monthly Revenue", v: "₹30.6L" },
              { l: "HQ Royalty", v: "₹4.6L" },
            ].map((s) => (
              <div
                key={s.l}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{s.l}</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{s.v}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
              NIA Partner Info
            </div>
            {[
              { l: "Partner ID", v: "NIA-FO-DL-001" },
              { l: "Territory", v: "Delhi NCR" },
              { l: "Agreement", v: "5-Year (2024-29)" },
              { l: "Compliance", v: "A+ Rated" },
            ].map((s) => (
              <div
                key={s.l}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{s.l}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: s.l === "Compliance" ? "#10b981" : "#cbd5e1",
                  }}
                >
                  {s.v}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
              Personal Information
            </div>
            {editing ? (
              <div>
                <div className="form-grid">
                  <div className="fg">
                    <label>Full Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="fg">
                    <label>Mobile</label>
                    <input
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </div>
                  <div className="fg">
                    <label>Email</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="fg">
                    <label>City</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="fg">
                    <label>Company</label>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <div className="fg">
                    <label>Profession</label>
                    <input
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                    />
                  </div>
                </div>
                <div className="fg">
                  <label>Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-p"
                  onClick={() => {
                    alert("✅ Profile updated!");
                    setEditing(false);
                  }}
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="form-grid">
                {[
                  ["Full Name", name],
                  ["Mobile", mobile],
                  ["Email", email],
                  ["City", city],
                  ["Company", company],
                  ["Profession", profession],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        marginBottom: 2,
                      }}
                    >
                      {k}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
                <div style={{ gridColumn: "span 2" }}>
                  <div
                    style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}
                  >
                    Bio
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}
                  >
                    {bio}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              Recent Activity
            </div>
            {[
              {
                t: "Today 10:41 AM",
                a: "Approved new member — Arjun Patel (Delhi NCR Elite)",
              },
              { t: "Yesterday", a: "Created Delhi Business Summit event" },
              { t: "Apr 20", a: "Submitted Group request to HQ — Delhi West" },
              { t: "Apr 18", a: "Issued warning to underperforming member" },
              { t: "Apr 15", a: "Monthly royalty remitted to HQ — ₹4.59L" },
            ].map((l, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    flexShrink: 0,
                    width: 120,
                  }}
                >
                  {l.t}
                </span>
                <span style={{ fontSize: 12, color: "#cbd5e1" }}>{l.a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
