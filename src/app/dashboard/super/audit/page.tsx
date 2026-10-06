"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsRotate,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
// NIA Brand colors: var(--nx-orange) (primary), #6366f1 (accent), #10b981 (success)
import { useState, useEffect } from "react";
import { SuperAdminAPI } from "@/lib/api";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "#10b981",
  UPDATE: "#6366f1",
  DELETE: "#ef4444",
  SUSPEND: "#f59e0b",
  ACTIVATE: "#10b981",
  ROLE_CHANGE: "#8b5cf6",
  LOGIN: "#3b9fd8",
  LOGOUT: "#9ca3af",
  TOGGLE: "#f59e0b",
};

export default function SuperAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const MODULES = [
    "",
    "auth",
    "super_admin",
    "members",
    "franchise",
    "hq_admin",
    "payments",
    "events",
    "seed",
  ];
  const ACTIONS = [
    "",
    "CREATE",
    "UPDATE",
    "DELETE",
    "SUSPEND",
    "ACTIVATE",
    "ROLE_CHANGE",
    "LOGIN",
    "LOGOUT",
    "TOGGLE",
  ];

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const params: any = { page: p, page_size: 20 };
      if (module) params.module = module;
      if (action) params.action = action;
      const res = await SuperAdminAPI.getAuditLogs(params);
      setLogs(res.items || res);
      setHasMore(res.has_more || false);
      setPage(p);
    } catch (e: any) {
      setError(e.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [module, action]);

  return (
    <div className="page">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Audit Logs</h2>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          Every admin action logged — module, actor, before/after values, IP
        </p>
      </div>

      {/* Filters */}
      <div
        style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}
      >
        <select
          value={module}
          onChange={(e) => setModule(e.target.value)}
          style={{ width: "auto" }}
        >
          {MODULES.map((m) => (
            <option key={m} value={m}>
              {m || "All Modules"}
            </option>
          ))}
        </select>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          style={{ width: "auto" }}
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a || "All Actions"}
            </option>
          ))}
        </select>
        <button className="btn btn-g btn-sm" onClick={() => fetchLogs(1)}>
          <FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5" />
          Refresh
        </button>
        <span style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>
          {logs.length} logs on this page
        </span>
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

      <div
        className="card"
        style={{ padding: 0, overflow: "hidden", marginBottom: 12 }}
      >
        <table className="tbl">
          <thead>
            <tr>
              {[
                "Time",
                "Actor",
                "Role",
                "Action",
                "Module",
                "Entity",
                "IP",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j}>
                        <div
                          style={{
                            height: 12,
                            background: "rgba(255,255,255,.06)",
                            borderRadius: 4,
                            width: "85%",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : logs.map((l, i) => (
                  <tr
                    key={i}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(l)}
                  >
                    <td
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {l.created_at
                        ? new Date(l.created_at).toLocaleString()
                        : "—"}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>
                      {l.actor_name || l.actor_id?.slice(0, 8)}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 99,
                          background: "rgba(255,255,255,.06)",
                          color: "#cbd5e1",
                          textTransform: "capitalize",
                        }}
                      >
                        {l.actor_role || "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background:
                            (ACTION_COLORS[l.action] || "#9ca3af") + "22",
                          color: ACTION_COLORS[l.action] || "#9ca3af",
                        }}
                      >
                        {l.action}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{l.module}</td>
                    <td
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        fontFamily: "monospace",
                      }}
                    >
                      {l.entity_id?.slice(0, 12) || "—"}
                    </td>
                    <td
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        fontFamily: "monospace",
                      }}
                    >
                      {l.ip || "—"}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        <button
          className="btn btn-g btn-sm"
          disabled={page === 1}
          onClick={() => fetchLogs(page - 1)}
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
          onClick={() => fetchLogs(page + 1)}
        >
          Next <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
        </button>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              Audit Log Detail
            </h3>
            <div className="form-grid" style={{ marginBottom: 14 }}>
              {[
                [
                  "Time",
                  selected.created_at
                    ? new Date(selected.created_at).toLocaleString()
                    : "—",
                ],
                ["Actor", selected.actor_name || selected.actor_id],
                ["Role", selected.actor_role],
                ["Action", selected.action],
                ["Module", selected.module],
                ["Entity", selected.entity_id],
                ["IP", selected.ip],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <div
                    style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}
                  >
                    {k}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {String(v || "—")}
                  </div>
                </div>
              ))}
            </div>
            {selected.old_val && (
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: "#ef4444",
                  }}
                >
                  Before
                </div>
                <pre
                  style={{
                    background: "rgba(255,90,90,.1)",
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 11,
                    overflow: "auto",
                    maxHeight: 120,
                  }}
                >
                  {JSON.stringify(selected.old_val, null, 2)}
                </pre>
              </div>
            )}
            {selected.new_val && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: "#10b981",
                  }}
                >
                  After
                </div>
                <pre
                  style={{
                    background: "rgba(39,216,109,.1)",
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 11,
                    overflow: "auto",
                    maxHeight: 120,
                  }}
                >
                  {JSON.stringify(selected.new_val, null, 2)}
                </pre>
              </div>
            )}
            <button
              className="btn btn-g"
              style={{ width: "100%" }}
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
