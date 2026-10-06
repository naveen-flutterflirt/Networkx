"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsRotate,
  faDownload,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { MembersAPI, GroupsAPI, TerritoriesAPI } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function HQDirectoryPage() {
  const [tab, setTab] = useState("members");
  const [items, setItems] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]); // for group name lookup
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const router = useRouter();

  const fetchData = async (t = tab, p = 1) => {
    setLoading(true);
    setError("");
    try {
      let res: any;
      if (t === "members")
        res = await MembersAPI.list({ page: p, page_size: 20 });
      else if (t === "groups")
        res = await GroupsAPI.list({ page: p, page_size: 20 });
      else res = await TerritoriesAPI.list({ page: p, page_size: 20 });
      setItems(res.items || res);
      setHasMore(res.has_more || false);
      setPage(p);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(tab, 1);
    // Load groups for name lookup in members tab
    GroupsAPI.list({ page: 1, page_size: 100 })
      .then((res) => setGroups(res.items || res))
      .catch(() => {});
  }, [tab]);

  const getGroupName = (id: string) =>
    groups.find((g) => g.id === id)?.name || id?.slice(0, 12) || "—";

  const filtered = search
    ? items.filter((i) =>
        JSON.stringify(i).toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  const switchTab = (t: string) => {
    setTab(t);
    setSearch("");
    setPage(1);
  };

  const exportCSV = () => {
    if (filtered.length === 0) return;
    let csv = "";
    if (tab === "members") {
      csv =
        "Name,Email,City,Group,Plan,Score,Status\n" +
        filtered
          .map((m) =>
            [
              m.user?.name,
              m.user?.email,
              m.user?.city,
              getGroupName(m.group_id),
              m.plan,
              m.score,
              m.status,
            ].join(","),
          )
          .join("\n");
    } else if (tab === "groups") {
      csv =
        "Name,City,State,Country,Members,Capacity,Health,Status\n" +
        filtered
          .map((g) =>
            [
              g.name,
              g.city,
              g.state,
              g.country,
              g.members_count,
              g.capacity,
              g.health_score,
              g.status,
            ].join(","),
          )
          .join("\n");
    } else {
      csv =
        "Territory,City,State,Country,Groups,Members,Royalty,Status\n" +
        filtered
          .map((t) =>
            [
              t.name,
              t.city,
              t.state,
              t.country,
              t.groups_count,
              t.members_count,
              `${t.royalty_pct || 15}%`,
              t.status,
            ].join(","),
          )
          .join("\n");
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nia-${tab}-directory.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Directory</h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            National member, group and territory directory
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-g btn-sm" onClick={exportCSV}>
            <FontAwesomeIcon icon={faDownload} className="mr-1.5" />
            Export CSV
          </button>
          <button
            className="btn btn-g btn-sm"
            onClick={() => fetchData(tab, page)}
          >
            <FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="tab-bar">
        {[
          {
            id: "members",
            l: `Members (${tab === "members" ? items.length : "…"})`,
          },
          {
            id: "groups",
            l: `Groups (${tab === "groups" ? items.length : "…"})`,
          },
          {
            id: "territories",
            l: `Territories (${tab === "territories" ? items.length : "…"})`,
          },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab-btn${tab === t.id ? " active" : ""}`}
            onClick={() => switchTab(t.id)}
          >
            {t.l}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          placeholder={`Search ${tab}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          {filtered.length} records
        </div>
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

      {/* ── MEMBERS TABLE ────────────────────────────────────────────── */}
      {tab === "members" && (
        <div
          className="card"
          style={{ padding: 0, overflow: "hidden", marginBottom: 12 }}
        >
          <table className="tbl">
            <thead>
              <tr>
                {[
                  "Member",
                  "Email",
                  "City",
                  "Group",
                  "Renewal",
                  "Plan",
                  "Score",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(9)].map((_, j) => (
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
                : filtered.map((m, i) => (
                    <tr key={m.id || i}>
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
                              flexShrink: 0,
                            }}
                          >
                            {m.user?.name?.charAt(0) || "?"}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {m.user?.name || "—"}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: "#6366f1" }}>
                        <a
                          href={`mailto:${m.user?.email}`}
                          style={{ color: "#6366f1", textDecoration: "none" }}
                        >
                          {m.user?.email || "—"}
                        </a>
                      </td>
                      <td style={{ fontSize: 12 }}>{m.user?.city || "—"}</td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>
                        {getGroupName(m.group_id)}
                      </td>
                      <td
                        style={{
                          fontSize: 11,
                          color:
                            m.renewal_date &&
                            new Date(m.renewal_date) < new Date()
                              ? "#ef4444"
                              : "#9ca3af",
                        }}
                      >
                        {m.renewal_date
                          ? new Date(m.renewal_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 99,
                            background: "rgba(22,143,255,.1)",
                            color: "#3b82f6",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {m.plan || "—"}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 4,
                              background: "rgba(255,255,255,.06)",
                              borderRadius: 99,
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: 99,
                                background:
                                  m.score >= 80
                                    ? "#10b981"
                                    : m.score >= 60
                                      ? "#f59e0b"
                                      : "#ef4444",
                                width: `${Math.min(m.score || 0, 100)}%`,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>
                            {m.score || 0}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 99,
                            background:
                              m.status === "active"
                                ? "#dcfce7"
                                : m.status === "warning"
                                  ? "#fef3c7"
                                  : "#fee2e2",
                            color:
                              m.status === "active"
                                ? "#16a34a"
                                : m.status === "warning"
                                  ? "#92400e"
                                  : "#991b1b",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {m.status || "—"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-xs btn-g"
                          onClick={() => setSelected(m)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── GROUPS TABLE ─────────────────────────────────────────────── */}
      {tab === "groups" && (
        <div
          className="card"
          style={{ padding: 0, overflow: "hidden", marginBottom: 12 }}
        >
          <table className="tbl">
            <thead>
              <tr>
                {[
                  "Group",
                  "City",
                  "Territory",
                  "Members",
                  "Capacity",
                  "Attendance",
                  "Health",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(9)].map((_, j) => (
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
                : filtered.map((g, i) => (
                    <tr key={g.id || i}>
                      <td style={{ fontWeight: 600 }}>{g.name}</td>
                      <td style={{ fontSize: 12 }}>{g.city || "—"}</td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>
                        {g.territory_id?.slice(0, 12) || "—"}
                      </td>
                      <td>{g.members_count || 0}</td>
                      <td style={{ color: "#9ca3af" }}>{g.capacity || 0}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              width: 40,
                              height: 4,
                              background: "rgba(255,255,255,.06)",
                              borderRadius: 99,
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: 99,
                                background:
                                  g.attendance_avg >= 80
                                    ? "#10b981"
                                    : g.attendance_avg >= 60
                                      ? "#f59e0b"
                                      : "#ef4444",
                                width: `${g.attendance_avg || 0}%`,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 12 }}>
                            {g.attendance_avg || 0}%
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{g.health_score || 0}</td>
                      <td>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 99,
                            background:
                              g.status === "active" ? "#dcfce7" : "#fef3c7",
                            color:
                              g.status === "active" ? "#16a34a" : "#92400e",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {g.status || "—"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-xs btn-g"
                          onClick={() => setSelected(g)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TERRITORIES TABLE ────────────────────────────────────────── */}
      {tab === "territories" && (
        <div
          className="card"
          style={{ padding: 0, overflow: "hidden", marginBottom: 12 }}
        >
          <table className="tbl">
            <thead>
              <tr>
                {[
                  "Territory",
                  "City",
                  "State",
                  "Country",
                  "Groups",
                  "Members",
                  "Monthly",
                  "Royalty",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(10)].map((_, j) => (
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
                : filtered.map((t, i) => (
                    <tr key={t.id || i}>
                      <td style={{ fontWeight: 600 }}>{t.name}</td>
                      <td style={{ fontSize: 12 }}>{t.city || "—"}</td>
                      <td style={{ fontSize: 12 }}>{t.state || "—"}</td>
                      <td>
                        <span
                          className={`badge ${t.country === "India" ? "b-blue" : "b-purple"}`}
                          style={{ fontSize: 10 }}
                        >
                          {t.country || "India"}
                        </span>
                      </td>
                      <td>{t.groups_count || 0}</td>
                      <td>{t.members_count || 0}</td>
                      <td style={{ fontWeight: 600, color: "#10b981" }}>
                        ₹{Math.round((t.monthly_collection || 0) / 100000)}L
                      </td>
                      <td>{t.royalty_pct || 15}%</td>
                      <td>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 99,
                            background:
                              t.status === "active" ? "#dcfce7" : "#fef3c7",
                            color:
                              t.status === "active" ? "#16a34a" : "#92400e",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {t.status || "—"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-xs btn-g"
                          onClick={() => setSelected(t)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        <button
          className="btn btn-g btn-sm"
          disabled={page === 1}
          onClick={() => fetchData(tab, page - 1)}
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
          onClick={() => fetchData(tab, page + 1)}
        >
          Next <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
        </button>
      </div>

      {/* ── DETAIL MODAL ─────────────────────────────────────────────── */}
      {selected && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="modal modal-lg">
            {/* Member detail */}
            {tab === "members" && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "#6366f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: 700,
                    }}
                  >
                    {selected.user?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                      {selected.user?.name || "—"}
                    </h3>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      {selected.user?.email} · {selected.user?.city}
                    </div>
                  </div>
                </div>
                <div className="form-grid" style={{ marginBottom: 14 }}>
                  {[
                    ["Phone", selected.user?.phone || "—"],
                    ["Profession", selected.user?.profession || "—"],
                    ["Company", selected.user?.company || "—"],
                    ["Group", getGroupName(selected.group_id)],
                    ["Plan", selected.plan || "—"],
                    ["Status", selected.status || "—"],
                    ["Score", selected.score || 0],
                    ["Refs Given", selected.refs_given || 0],
                    ["Refs Received", selected.refs_received || 0],
                    ["Attendance", `${selected.attendance_pct || 0}%`],
                    [
                      "Renewal",
                      selected.renewal_date
                        ? new Date(selected.renewal_date).toLocaleDateString()
                        : "—",
                    ],
                  ].map(([k, v]) => (
                    <div key={String(k)}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          marginBottom: 2,
                        }}
                      >
                        {k}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {String(v)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* Group detail */}
            {tab === "groups" && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                  {selected.name}
                </h3>
                <div className="form-grid" style={{ marginBottom: 14 }}>
                  {[
                    ["City", selected.city || "—"],
                    ["State", selected.state || "—"],
                    ["Country", selected.country || "—"],
                    ["Territory", selected.territory_id?.slice(0, 16) || "—"],
                    ["Members", selected.members_count || 0],
                    ["Capacity", selected.capacity || 0],
                    ["Attendance", `${selected.attendance_avg || 0}%`],
                    ["Health", selected.health_score || 0],
                    ["Status", selected.status || "—"],
                  ].map(([k, v]) => (
                    <div key={String(k)}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          marginBottom: 2,
                        }}
                      >
                        {k}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {String(v)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* Territory detail */}
            {tab === "territories" && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                  {selected.name}
                </h3>
                <div className="form-grid" style={{ marginBottom: 14 }}>
                  {[
                    ["City", selected.city || "—"],
                    ["State", selected.state || "—"],
                    ["Country", selected.country || "—"],
                    ["Groups", selected.groups_count || 0],
                    ["Members", selected.members_count || 0],
                    [
                      "Monthly",
                      `₹${Math.round((selected.monthly_collection || 0) / 100000)}L`,
                    ],
                    ["Royalty", `${selected.royalty_pct || 15}%`],
                    ["Status", selected.status || "—"],
                  ].map(([k, v]) => (
                    <div key={String(k)}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          marginBottom: 2,
                        }}
                      >
                        {k}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {String(v)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {/* Navigate to edit page */}
              {tab === "members" && (
                <button
                  className="btn btn-g btn-sm"
                  onClick={() => router.push("/dashboard/hq/members")}
                >
                  Go to Members{" "}
                  <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                </button>
              )}
              {tab === "groups" && (
                <button
                  className="btn btn-g btn-sm"
                  onClick={() => router.push("/dashboard/hq/groups")}
                >
                  Go to Groups{" "}
                  <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                </button>
              )}
              {tab === "territories" && (
                <button
                  className="btn btn-g btn-sm"
                  onClick={() => router.push("/dashboard/hq/regions")}
                >
                  Go to Regions{" "}
                  <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
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
