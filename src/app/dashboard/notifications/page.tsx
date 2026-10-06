"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsRotate,
  faStar,
  faUserSlash,
  faUserCheck,
  faUserPlus,
  faHandshake,
  faCircleCheck,
  faCalendarDays,
  faClock,
  faTriangleExclamation,
  faSackDollar,
  faCreditCard,
  faCircleExclamation,
  faTrophy,
  faBullhorn,
  faGraduationCap,
  faClipboard,
  faBell,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useCallback, useMemo } from "react";
import { NotificationsAPI } from "@/lib/api";
import PageHero from "@/components/shared/PageHero";

const TYPE_ICONS: Record<string, any> = {
  WELCOME: faStar,
  NEW_MEMBER_REGISTERED: faUserPlus,
  ROLE_CHANGED: faArrowsRotate,
  MEMBER_SUSPENDED: faUserSlash,
  MEMBER_ACTIVATED: faUserCheck,
  REFERRAL_RECEIVED: faHandshake,
  REFERRAL_CLOSED: faCircleCheck,
  MEETING_CREATED: faCalendarDays,
  MEETING_REMINDER: faClock,
  MEETING_STARTED: faClock,
  ATTENDANCE_WARNING: faTriangleExclamation,
  PAYMENT_SUCCESS: faSackDollar,
  PAYMENT_DUE: faCreditCard,
  PAYMENT_OVERDUE: faCircleExclamation,
  AWARD_RECEIVED: faTrophy,
  BROADCAST: faBullhorn,
  COURSE_COMPLETED: faGraduationCap,
  VISITOR_CONVERTED: faHandshake,
  SURVEY_RECEIVED: faClipboard,
  TIER_UPGRADED: faStar,
  DEFAULT: faBell,
};

const typeLabel = (t: string) =>
  t
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [count, setCount] = useState(0);
  const [marking, setMarking] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  // Grows as pages/filters load — there's no "list every notification
  // type this user has ever received" endpoint, so the type dropdown's
  // options are built from whatever's actually been seen so far rather
  // than a static ~100-value enum most of which would never apply to
  // any one person.
  // Seeded with a few always-relevant admin-facing types rather than
  // starting empty — the dynamic-discovery approach below means a type
  // only becomes selectable once one has actually loaded on screen, which
  // reads as "this type isn't supported" if nobody's triggered one yet
  // since this admin last opened the page (e.g. NEW_MEMBER_REGISTERED,
  // right after deploying it, before the next real signup).
  const [knownTypes, setKnownTypes] = useState<Set<string>>(
    new Set(["NEW_MEMBER_REGISTERED"]),
  );

  const fetchNotifs = useCallback(
    async (p = 1) => {
      setLoading(true);
      setError("");
      try {
        const [res, countRes] = await Promise.all([
          NotificationsAPI.list({
            page: p,
            page_size: 20,
            type: typeFilter || undefined,
            unread_only: unreadOnly || undefined,
          }),
          NotificationsAPI.count(),
        ]);
        const list = res.items || res;
        setItems(list);
        setHasMore(res.has_more || false);
        setCount(countRes.count || 0);
        setPage(p);
        setKnownTypes((prev) => {
          const next = new Set(prev);
          for (const n of list) if (n.type) next.add(n.type);
          return next;
        });
      } catch (e: any) {
        setError(e.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    },
    [typeFilter, unreadOnly],
  );

  useEffect(() => {
    fetchNotifs(1);
  }, [fetchNotifs]);

  const sortedKnownTypes = useMemo(
    () => Array.from(knownTypes).sort(),
    [knownTypes],
  );

  const markRead = async (id: string) => {
    try {
      await NotificationsAPI.markRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setCount((c) => Math.max(0, c - 1));
      // Sidebar badge polls every 30s and has no other way to know this
      // just changed — without this, "read it but count didn't zero" is
      // just the badge being stale until its next scheduled poll.
      window.dispatchEvent(new Event("nia:notifications-updated"));
    } catch {}
  };

  const markAllRead = async () => {
    setMarking(true);
    try {
      await NotificationsAPI.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setCount(0);
      window.dispatchEvent(new Event("nia:notifications-updated"));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setMarking(false);
    }
  };

  const deleteNotif = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    try {
      await NotificationsAPI.delete(id);
      const wasUnread = items.find((n) => n.id === id)?.is_read === false;
      setItems((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) {
        setCount((c) => Math.max(0, c - 1));
        window.dispatchEvent(new Event("nia:notifications-updated"));
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const unread = items.filter((n) => !n.is_read);
  const read = items.filter((n) => n.is_read);

  return (
    <div className="page">
      <PageHero
        icon={faBell}
        kicker="Stay Updated"
        title="Notifications"
        description={
          count > 0
            ? `You have ${count} unread notification${count === 1 ? "" : "s"} waiting for you.`
            : "You're all caught up — nothing new right now."
        }
        stats={[{ icon: faBell, value: count, label: "Unread" }]}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <FontAwesomeIcon
            icon={faFilter}
            style={{ color: "var(--nx-muted)", fontSize: 12 }}
          />
          <button
            className="btn btn-sm"
            onClick={() => setUnreadOnly((u) => !u)}
            style={{
              background: unreadOnly ? "var(--nx-orange)" : "var(--nx-panel2)",
              color: unreadOnly ? "#fff" : "var(--nx-ink)",
              border: "1px solid var(--nx-line)",
            }}
          >
            Unread only
          </button>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 8,
              background: "var(--nx-panel2)",
              color: "var(--nx-ink)",
              border: "1px solid var(--nx-line)",
            }}
          >
            <option value="">All types</option>
            {sortedKnownTypes.map((t) => (
              <option key={t} value={t}>
                {typeLabel(t)}
              </option>
            ))}
          </select>
          {(unreadOnly || typeFilter) && (
            <button
              className="btn btn-g btn-sm"
              onClick={() => {
                setUnreadOnly(false);
                setTypeFilter("");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {count > 0 && (
            <button
              className="btn btn-g btn-sm"
              onClick={markAllRead}
              disabled={marking}
            >
              {marking ? "Marking…" : "✓ Mark all read"}
            </button>
          )}
          <button className="btn btn-g btn-sm" onClick={() => fetchNotifs(1)}>
            <FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5" />
            Refresh
          </button>
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

      {loading ? (
        [...Array(5)].map((_, i) => (
          <div
            key={i}
            className="card"
            style={{
              marginBottom: 8,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,.06)",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: 14,
                  background: "rgba(255,255,255,.06)",
                  borderRadius: 4,
                  width: "60%",
                  marginBottom: 6,
                }}
              />
              <div
                style={{
                  height: 11,
                  background: "rgba(255,255,255,.04)",
                  borderRadius: 4,
                  width: "80%",
                }}
              />
            </div>
          </div>
        ))
      ) : items.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: "center", padding: 48, color: "var(--nx-muted)" }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            <FontAwesomeIcon icon={faBell} />
          </div>
          <div
            style={{ fontWeight: 600, marginBottom: 4, color: "var(--nx-ink)" }}
          >
            {unreadOnly || typeFilter
              ? "No notifications match this filter"
              : "No notifications yet"}
          </div>
          <div style={{ fontSize: 13 }}>
            {unreadOnly || typeFilter
              ? "Try clearing the filters above."
              : "You're all caught up!"}
          </div>
        </div>
      ) : (
        <>
          {unread.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--nx-muted)",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Unread ({unread.length})
              </div>
              {unread.map((n) => (
                <NotifCard
                  key={n.id}
                  n={n}
                  onRead={markRead}
                  onDelete={deleteNotif}
                />
              ))}
            </>
          )}
          {read.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--nx-muted)",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  margin: "16px 0 8px",
                }}
              >
                Earlier
              </div>
              {read.map((n) => (
                <NotifCard
                  key={n.id}
                  n={n}
                  onRead={markRead}
                  onDelete={deleteNotif}
                />
              ))}
            </>
          )}
          <div
            style={{
              display: "flex",
              gap: 6,
              justifyContent: "center",
              marginTop: 12,
            }}
          >
            <button
              className="btn btn-g btn-sm"
              disabled={page === 1}
              onClick={() => fetchNotifs(page - 1)}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-1.5" />
              Prev
            </button>
            <span
              style={{
                padding: "6px 12px",
                fontSize: 13,
                color: "var(--nx-muted)",
              }}
            >
              Page {page}
            </span>
            <button
              className="btn btn-g btn-sm"
              disabled={!hasMore}
              onClick={() => fetchNotifs(page + 1)}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NotifCard({ n, onRead, onDelete }: any) {
  const icon = TYPE_ICONS[n.type] || TYPE_ICONS.DEFAULT;
  const timeAgo = n.created_at ? new Date(n.created_at).toLocaleString() : "";
  return (
    <div
      onClick={() => !n.is_read && onRead(n.id)}
      className={n.is_read ? "card" : undefined}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "12px 14px",
        borderRadius: 12,
        marginBottom: 6,
        cursor: "pointer",
        // Read cards now reuse the app's own dark "card" surface (className
        // above) instead of a hardcoded solid white background, which is
        // what made read notifications render as near-invisible white
        // ghost cards against the rest of the dark-theme page.
        background: n.is_read ? undefined : "rgba(255,75,10,.1)",
        border: n.is_read ? undefined : "1px solid rgba(255,75,10,.35)",
        transition: "all .15s",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: n.is_read ? "var(--nx-panel2)" : "rgba(255,75,10,.1)",
          border: `1px solid ${n.is_read ? "var(--nx-line)" : "#fdba74"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        <FontAwesomeIcon icon={icon} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: n.is_read ? 400 : 600,
            fontSize: 13,
            color: "var(--nx-ink)",
            marginBottom: 2,
          }}
        >
          {n.title || n.type?.replace(/_/g, " ")}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--nx-muted)",
            marginBottom: 4,
            lineHeight: 1.5,
          }}
        >
          {n.body || ""}
        </div>
        <div style={{ fontSize: 11, color: "var(--nx-muted)" }}>{timeAgo}</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {!n.is_read && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--nx-orange)",
              marginTop: 4,
            }}
          />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(n.id);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--nx-muted)",
            fontSize: 16,
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
