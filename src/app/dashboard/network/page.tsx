"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment, faClock, faUsers } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { CirclesAPI, ConnectionsAPI } from "@/lib/api";
import { Loading, ApiError, Empty } from "@/components/shared/States";
import PageHero from "@/components/shared/PageHero";

export default function NetworkPage() {
  const [data, setData] = useState<any>({
    connected: [],
    pending_sent: [],
    pending_received: [],
    counts: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<
    "connected" | "pending_received" | "pending_sent"
  >("connected");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [circles, setCircles] = useState<any[]>([]);
  const [circleError, setCircleError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    setCircleError("");
    const [connectionsResult, circlesResult] = await Promise.allSettled([
      ConnectionsAPI.list(),
      CirclesAPI.mine(),
    ]);

    if (connectionsResult.status === "fulfilled")
      setData(connectionsResult.value);
    else
      setError(
        connectionsResult.reason?.message || "Could not load your connections",
      );

    if (circlesResult.status === "fulfilled")
      setCircles(circlesResult.value.items || []);
    else {
      setCircles([]);
      setCircleError(
        circlesResult.reason?.message ||
          "Could not load your Circle membership",
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const respond = async (id: string, accept: boolean) => {
    setBusyId(id);
    try {
      accept
        ? await ConnectionsAPI.accept(id)
        : await ConnectionsAPI.decline(id);
      setMsg(accept ? "✅ Connection accepted!" : "✅ Request declined");
      fetchAll();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this connection?")) return;
    setBusyId(id);
    try {
      await ConnectionsAPI.remove(id);
      setMsg("✅ Connection removed");
      fetchAll();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusyId(null);
    }
  };

  const list = data[tab] || [];

  return (
    <div className="page">
      <PageHero
        icon={faUsers}
        kicker="Your Circle"
        title="My Network"
        description="Manage your connections and requests — accept, message, or grow your professional circle."
        stats={[
          {
            icon: faUsers,
            value: data.counts?.connected || 0,
            label: "Connections",
          },
        ]}
      />

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

      {circles.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                My Circles
              </h2>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: "3px 0 0" }}>
                Partner communities you actively belong to
              </p>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 12,
            }}
          >
            {circles.map((circle: any) => (
              <button
                key={circle.id}
                className="card"
                onClick={() =>
                  (window.location.href = `/dashboard/network/circle?circle_id=${circle.id}&circle_name=${encodeURIComponent(circle.name)}`)
                }
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  border: "1px solid var(--nx-line)",
                  background: "var(--nx-panel)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "linear-gradient(135deg,#ff5c12,#ff9f43)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 18,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {circle.logo ? (
                    <img
                      src={circle.logo}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    circle.name?.charAt(0)
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>
                    {circle.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    {circle.city}
                    {circle.state ? `, ${circle.state}` : ""}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#ff5c12",
                      marginTop: 5,
                      fontWeight: 700,
                    }}
                  >
                    {circle.active_members || 0} active members →
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {!loading && circles.length === 0 && (
        <section
          className="card"
          style={{
            marginBottom: 20,
            border: "1px solid rgba(245,158,11,.35)",
            background: "rgba(245,158,11,.06)",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 15 }}>My Circle</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 5 }}>
            {circleError
              ? "Circle membership is temporarily unavailable because the Circle API has not yet been deployed."
              : "You are not currently assigned to an active Circle."}
          </div>
        </section>
      )}

      <div className="tab-bar">
        <button
          className={`tab-btn${tab === "connected" ? " active" : ""}`}
          onClick={() => setTab("connected")}
        >
          Connections ({data.counts?.connected || 0})
        </button>
        <button
          className={`tab-btn${tab === "pending_received" ? " active" : ""}`}
          onClick={() => setTab("pending_received")}
        >
          Pending Requests ({data.counts?.pending_received || 0})
        </button>
        <button
          className={`tab-btn${tab === "pending_sent" ? " active" : ""}`}
          onClick={() => setTab("pending_sent")}
        >
          Sent ({data.counts?.pending_sent || 0})
        </button>
      </div>

      {loading ? (
        <Loading label="Loading your network…" />
      ) : error ? (
        <ApiError message={error} onRetry={fetchAll} />
      ) : list.length === 0 ? (
        <Empty
          label={
            tab === "connected"
              ? "No connections yet — head to Explore NetworkX to find members"
              : tab === "pending_received"
                ? "No pending requests"
                : "No sent requests waiting"
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((c: any) => (
            <div
              key={c.id}
              className="card"
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "#6366f1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {c.user?.avatar_url ? (
                  <img
                    src={c.user.avatar_url}
                    alt={c.user?.name || "Member"}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  c.user?.name?.charAt(0) || "?"
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {c.user?.name || "—"}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  {c.user?.city || ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {tab === "connected" && (
                  <>
                    <button
                      className="btn btn-g btn-sm"
                      onClick={() =>
                        (window.location.href = `/dashboard/messages?to=${c.other_user_id}&name=${encodeURIComponent(c.user?.name || "")}`)
                      }
                    >
                      <FontAwesomeIcon icon={faComment} className="mr-1.5" />
                      Message
                    </button>
                    <button
                      className="btn btn-g btn-sm"
                      style={{ color: "#ef4444" }}
                      onClick={() => remove(c.id)}
                      disabled={busyId === c.id}
                    >
                      Remove
                    </button>
                  </>
                )}
                {tab === "pending_received" && (
                  <>
                    <button
                      className="btn btn-p btn-sm"
                      onClick={() => respond(c.id, true)}
                      disabled={busyId === c.id}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-g btn-sm"
                      onClick={() => respond(c.id, false)}
                      disabled={busyId === c.id}
                    >
                      Decline
                    </button>
                  </>
                )}
                {tab === "pending_sent" && (
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    <FontAwesomeIcon icon={faClock} className="mr-1" />
                    Waiting for response
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
