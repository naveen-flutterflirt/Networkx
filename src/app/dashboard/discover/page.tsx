"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faLocationDot,
  faMagnifyingGlass,
  faHandshake,
  faBolt,
  faCircleCheck,
  faClock,
  faInbox,
  faCompass,
  faUsers,
  faArrowRight,
  faShieldHalved,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useCallback, useRef } from "react";
import { DiscoverAPI, ConnectionsAPI } from "@/lib/api";
import { Loading, ApiError, Empty } from "@/components/shared/States";
import { Pagination } from "@/components/shared/Pagination";
import styles from "./discover.module.css";

const COUNTRIES = [
  "India",
  "USA",
  "UK",
  "UAE",
  "Singapore",
  "Australia",
  "Canada",
];

const QUICK_FILTERS = [
  { key: "nearby", label: "Nearby (same city)", icon: faLocationDot },
  { key: "open_to_referrals", label: "Open to Referrals", icon: faHandshake },
  { key: "recently_active", label: "Recently Active", icon: faBolt },
];

export default function DiscoverPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [quick, setQuick] = useState<Record<string, boolean>>({
    nearby: false,
    open_to_referrals: false,
    recently_active: false,
  });

  const [people, setPeople] = useState<any[]>([]);
  const [total, setTotal] = useState<number | null>(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [circleId, setCircleId] = useState("");
  const [circleName, setCircleName] = useState("");
  const latestSearch = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCircleId(params.get("circle_id") || "");
    setCircleName(params.get("circle_name") || "");
  }, []);

  // Non-India countries: no real member data yet, so this shows clearly
  // labelled placeholder cards instead of hitting the real search API —
  // "Coming Soon", no Connect/Message actions, since there's nobody
  // real to connect with there yet.
  const DUMMY_COUNTRIES = COUNTRIES.filter((c) => c !== "India");
  const isDummyCountry = DUMMY_COUNTRIES.includes(country);
  const dummyPeople = Array.from({ length: 6 }, (_, i) => ({
    id: `dummy-${i}`,
    name: "Member",
    city: "",
    country,
  }));

  const search = useCallback(
    async (p = 1) => {
      if (DUMMY_COUNTRIES.includes(country)) return; // dummy path renders directly, no API call
      const searchId = ++latestSearch.current;
      setLoading(true);
      setError("");
      try {
        const res = await DiscoverAPI.search({
          q: q || undefined,
          city: city || undefined,
          category: category || undefined,
          country: country || undefined,
          looking_for: lookingFor || undefined,
          nearby: quick.nearby || undefined,
          open_to_referrals: quick.open_to_referrals || undefined,
          recently_active: quick.recently_active || undefined,
          circle_id: circleId || undefined,
          page: p,
          page_size: 12,
        });
        if (searchId !== latestSearch.current) return;
        setPeople(res.items || []);
        setTotal(res.total ?? null);
        setHasMore(res.has_more || false);
        setPage(p);
      } catch (e: any) {
        if (searchId === latestSearch.current) setError(e.message);
      } finally {
        if (searchId === latestSearch.current) setLoading(false);
      }
    },
    [q, city, category, country, lookingFor, quick, circleId],
  );

  // Fix: city/category are free-text inputs (their own onBlur handlers
  // already call search(1) — see the input fields below), but they were
  // ALSO in this effect's dependency array, directly contradicting the
  // comment right below stating free-text fields search on blur, not
  // every keystroke. Typing "Delhi" was firing 5 separate API calls (D,
  // De, Del, Delh, Delhi), and if those responses raced and arrived out
  // of order, an earlier partial-string result could render AFTER the
  // correct final one — country/quick stay here since those are
  // discrete selectors (a dropdown pick or a toggle click), not text
  // being typed character by character.
  useEffect(() => {
    search(1);
  }, [country, quick, circleId]);
  // free-text fields (q, lookingFor) search on submit/blur rather than every keystroke — see form below

  const toggleQuick = (key: string) =>
    setQuick({ ...quick, [key]: !quick[key] });

  const connect = async (userId: string) => {
    setBusyId(userId);
    try {
      await ConnectionsAPI.sendRequest(userId);
      setPeople(
        people.map((p) =>
          p.id === userId
            ? {
                ...p,
                connection_status: "pending",
                connection_direction: "sent",
              }
            : p,
        ),
      );
      setSelectedProfile((prev: any) =>
        prev && prev.id === userId
          ? {
              ...prev,
              connection_status: "pending",
              connection_direction: "sent",
            }
          : prev,
      );
      setMsg("✅ Connection request sent!");
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusyId(null);
    }
  };

  const connectLabel = (p: any) => {
    if (p.connection_status === "connected")
      return (
        <>
          <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5" />
          Connected
        </>
      );
    if (p.connection_status === "pending")
      return p.connection_direction === "sent" ? (
        <>
          <FontAwesomeIcon icon={faClock} className="mr-1.5" />
          Requested
        </>
      ) : (
        <>
          <FontAwesomeIcon icon={faInbox} className="mr-1.5" />
          Respond
        </>
      );
    return (
      <>
        <FontAwesomeIcon icon={faHandshake} className="mr-1.5" />
        Connect
      </>
    );
  };

  return (
    <div className={`page ${styles.page}`}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.kicker}>
            <FontAwesomeIcon icon={faWandMagicSparkles} /> Intelligent member
            discovery
          </span>
          <h1>
            {circleName || (
              <>
                Find people who can
                <br />
                <em>move your business forward.</em>
              </>
            )}
          </h1>
          <p>
            {circleId
              ? "Discover active NetworkX members in your Circle."
              : isDummyCountry
                ? `NetworkX is expanding member discovery to ${country}.`
                : "Search the NetworkX community by expertise, location and business intent—then connect with the people most relevant to your next goal."}
          </p>
          <div className={styles.heroActions}>
            <button
              onClick={() =>
                document
                  .getElementById("member-search")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} /> Find relevant members
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard/network")}
            >
              View my network <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
          <div className={styles.heroProof}>
            <span>
              <FontAwesomeIcon icon={faShieldHalved} /> Verified community
            </span>
            <span>
              <FontAwesomeIcon icon={faHandshake} /> Purpose-led connections
            </span>
            <span>
              <FontAwesomeIcon icon={faCompass} /> Local and global discovery
            </span>
          </div>
        </div>
        <div className={styles.heroMetric}>
          <i>
            <FontAwesomeIcon icon={faUsers} />
          </i>
          <strong>{total ?? "—"}</strong>
          <span>
            members match
            <br />
            your current view
          </span>
        </div>
      </section>

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

      <div id="member-search" className={`card ${styles.searchPanel}`}>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6b7280",
              fontSize: 14,
            }}
          />
          <input
            placeholder="Search by name, profession, company…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search(1)}
            style={{ width: "100%", paddingLeft: 38, fontSize: 14 }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 11,
                color: "#9ca3af",
                display: "block",
                marginBottom: 4,
              }}
            >
              City
            </label>
            <input
              placeholder="Any city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onBlur={() => search(1)}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: "#9ca3af",
                display: "block",
                marginBottom: 4,
              }}
            >
              Category
            </label>
            <input
              placeholder="Any category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onBlur={() => search(1)}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: "#9ca3af",
                display: "block",
                marginBottom: 4,
              }}
            >
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="">Any country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: "#9ca3af",
                display: "block",
                marginBottom: 4,
              }}
            >
              Looking for
            </label>
            <input
              placeholder="e.g. investors, clients…"
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search(1)}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-p btn-sm"
              onClick={() => search(1)}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="mr-1.5" />
              Search
            </button>
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`btn btn-sm ${quick[f.key] ? "btn-p" : "btn-g"}`}
                onClick={() => toggleQuick(f.key)}
              >
                <FontAwesomeIcon icon={f.icon} className="mr-1.5" />
                {f.label}
              </button>
            ))}
          </div>
          {(q ||
            city ||
            category ||
            country ||
            lookingFor ||
            quick.nearby ||
            quick.open_to_referrals ||
            quick.recently_active) && (
            <button
              type="button"
              className="btn btn-g btn-sm"
              onClick={() => {
                setQ("");
                setCity("");
                setCategory("");
                setCountry("");
                setLookingFor("");
                setQuick({
                  nearby: false,
                  open_to_referrals: false,
                  recently_active: false,
                });
                search(1);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {isDummyCountry ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
            gap: 14,
          }}
        >
          {dummyPeople.map((p) => (
            <div
              key={p.id}
              className="card"
              style={{ textAlign: "center", opacity: 0.6 }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#374151",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontWeight: 700,
                  fontSize: 20,
                  margin: "0 auto 10px",
                }}
              >
                ?
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Member</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                —
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>
                <FontAwesomeIcon icon={faLocationDot} className="mr-1" />
                {p.country}
              </div>
              <span
                className="badge"
                style={{
                  background: "rgba(255,255,255,.06)",
                  color: "#9ca3af",
                  border: "1px solid rgba(255,255,255,.1)",
                }}
              >
                Coming Soon
              </span>
            </div>
          ))}
        </div>
      ) : loading ? (
        <Loading label="Finding members…" />
      ) : error ? (
        <ApiError message={error} onRetry={() => search(page)} />
      ) : people.length === 0 ? (
        <Empty label="No members match these filters" />
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: 14,
            }}
          >
            {people.map((p) => (
              <div
                key={p.id}
                className="card"
                style={{ cursor: "pointer", textAlign: "center" }}
                onClick={() => setSelectedProfile(p)}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 20,
                    overflow: "hidden",
                    margin: "0 auto 10px",
                  }}
                >
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    p.name?.charAt(0) || "?"
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {p.name}
                  </span>
                  {p.verified && (
                    <span title="Active member">
                      <FontAwesomeIcon
                        icon={faCircleCheck}
                        className="text-green"
                      />
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {p.profession || "—"}
                </div>
                <div
                  style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}
                >
                  {p.company || ""}
                </div>
                <div
                  style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}
                >
                  <FontAwesomeIcon icon={faLocationDot} className="mr-1" />
                  {p.city || "—"}
                  {p.country ? `, ${p.country}` : ""}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  {p.category && (
                    <span className="badge b-blue">{p.category}</span>
                  )}
                  {p.open_to_referrals && (
                    <span className="badge b-green">Open to Referrals</span>
                  )}
                </div>
                {p.bio && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#cbd5e1",
                      margin: "6px 0",
                      textAlign: "left",
                    }}
                  >
                    {p.bio}
                  </div>
                )}
                {p.looking_for && (
                  <div
                    style={{
                      background: "rgba(255,255,255,.04)",
                      borderRadius: 8,
                      padding: "6px 8px",
                      fontSize: 11,
                      color: "#cbd5e1",
                      marginBottom: 8,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "#9ca3af" }}>
                      LOOKING FOR:{" "}
                    </span>
                    {p.looking_for}
                  </div>
                )}
                <div
                  style={{ display: "flex", gap: 6 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="btn btn-sm"
                    style={{
                      flex: 1,
                      background:
                        p.connection_status === "connected"
                          ? "rgba(39,216,109,.1)"
                          : p.connection_status === "pending"
                            ? "rgba(255,75,10,.1)"
                            : "var(--nx-orange)",
                      color: p.connection_status ? "#cbd5e1" : "#fff",
                      border: p.connection_status
                        ? "1px solid #e5e7eb"
                        : "none",
                    }}
                    disabled={
                      p.connection_status === "connected" ||
                      p.connection_status === "pending" ||
                      busyId === p.id
                    }
                    onClick={() => connect(p.id)}
                  >
                    {busyId === p.id ? "Sending…" : connectLabel(p)}
                  </button>
                  <button
                    className="btn btn-g btn-sm"
                    onClick={() =>
                      (window.location.href = `/dashboard/messages?to=${p.id}&name=${encodeURIComponent(p.name || "")}`)
                    }
                  >
                    💬
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={12}
            total={total}
            hasMore={hasMore}
            loading={loading}
            onPageChange={search}
          />
        </>
      )}

      {/* Profile popup — redesigned to match the public shared-profile
          card look (same layout as /profile?u=...), just with the
          connect/message actions instead of the public "Join" CTA. */}
      {selectedProfile && (
        <div
          className="overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setSelectedProfile(null)
          }
        >
          <div
            className="modal"
            style={{
              maxWidth: 420,
              textAlign: "center",
              background: "#fff",
              color: "#1f2937",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 16,
                marginBottom: 24,
                color: "var(--nx-navy)",
              }}
            >
              Network<span style={{ color: "var(--nx-orange)" }}>X</span>
            </div>

            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: "var(--nx-orange)",
                color: "#fff",
                fontSize: 32,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                overflow: "hidden",
              }}
            >
              {selectedProfile.avatar_url ? (
                <img
                  src={selectedProfile.avatar_url}
                  alt={selectedProfile.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                selectedProfile.name?.charAt(0) || "?"
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--nx-navy)",
                }}
              >
                {selectedProfile.name}
              </div>
              {selectedProfile.verified && (
                <span title="Active member">
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    className="text-green"
                  />
                </span>
              )}
            </div>
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 2 }}>
              {selectedProfile.profession || ""}
              {selectedProfile.company ? ` · ${selectedProfile.company}` : ""}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
              <FontAwesomeIcon icon={faLocationDot} className="mr-1" />
              {selectedProfile.city || "—"}
              {selectedProfile.country ? `, ${selectedProfile.country}` : ""}
            </div>

            <div
              style={{
                display: "flex",
                gap: 6,
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              {selectedProfile.category && (
                <span className="badge b-blue">{selectedProfile.category}</span>
              )}
              {selectedProfile.open_to_referrals && (
                <span className="badge b-green">Open to Referrals</span>
              )}
              {selectedProfile.tier && (
                <span
                  className="badge b-orange"
                  style={{ textTransform: "capitalize" }}
                >
                  {selectedProfile.tier.replace("_", " ")}
                </span>
              )}
            </div>

            {selectedProfile.bio && (
              <p
                style={{
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.7,
                  marginBottom: 16,
                  textAlign: "left",
                }}
              >
                {selectedProfile.bio}
              </p>
            )}

            {selectedProfile.looking_for && (
              <div
                style={{
                  background: "#f9fafb",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 12,
                  color: "#374151",
                  marginBottom: 20,
                  textAlign: "left",
                }}
              >
                <span style={{ fontWeight: 700, color: "#9ca3af" }}>
                  LOOKING FOR:{" "}
                </span>
                {selectedProfile.looking_for}
              </div>
            )}

            {(selectedProfile.linkedin ||
              selectedProfile.website ||
              selectedProfile.twitter ||
              selectedProfile.instagram ||
              selectedProfile.facebook) && (
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: 20,
                  fontSize: 13,
                }}
              >
                {selectedProfile.linkedin && (
                  <a
                    href={selectedProfile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--nx-blue)" }}
                  >
                    LinkedIn ↗
                  </a>
                )}
                {selectedProfile.website && (
                  <a
                    href={selectedProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--nx-blue)" }}
                  >
                    Website ↗
                  </a>
                )}
                {selectedProfile.twitter && (
                  <a
                    href={selectedProfile.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--nx-blue)" }}
                  >
                    Twitter/X ↗
                  </a>
                )}
                {selectedProfile.instagram && (
                  <a
                    href={selectedProfile.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--nx-blue)" }}
                  >
                    Instagram ↗
                  </a>
                )}
                {selectedProfile.facebook && (
                  <a
                    href={selectedProfile.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--nx-blue)" }}
                  >
                    Facebook ↗
                  </a>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                disabled={
                  selectedProfile.connection_status === "connected" ||
                  selectedProfile.connection_status === "pending" ||
                  busyId === selectedProfile.id
                }
                onClick={() => connect(selectedProfile.id)}
              >
                {busyId === selectedProfile.id
                  ? "Sending…"
                  : connectLabel(selectedProfile)}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() =>
                  (window.location.href = `/dashboard/messages?to=${selectedProfile.id}&name=${encodeURIComponent(selectedProfile.name || "")}`)
                }
              >
                <FontAwesomeIcon icon={faComment} className="mr-1.5" />
                Message
              </button>
            </div>
            <button
              className="btn btn-g"
              style={{ width: "100%", marginTop: 8 }}
              onClick={() => setSelectedProfile(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
