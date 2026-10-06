"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getUser, logout } from "@/lib/auth";
import {
  initAutoRefresh,
  stopAutoRefresh,
  TokenStore,
  ProfileAPI,
  UsersAPI,
  GroupsAPI,
  EventsAPI,
  OpportunitiesAPI,
  NotificationsAPI,
} from "@/lib/api";
import { User } from "@/lib/data";
import Sidebar from "@/components/layout/Sidebar";
import ResponsiveTables from "@/components/layout/ResponsiveTables";
import { DashboardProfileProvider } from "@/components/layout/DashboardProfileContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserSecret,
  faBars,
  faMagnifyingGlass,
  faBell,
  faUsers,
  faLandmark,
  faCalendarDays,
  faRocket,
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import "./dashboard-globals.css";
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/verify-email": "Verify Your Email",
  "/dashboard/discover": "Discover Members",
  "/dashboard/network": "My Network",
  "/dashboard/network/circle": "Circle Directory",
  "/dashboard/hq/circles": "Circles",
  "/dashboard/referrals": "Referrals",
  "/dashboard/groups": "Groups",
  "/dashboard/attendance": "Attendance",
  "/dashboard/events": "Events",
  "/dashboard/meetings": "Digital Meetings",
  "/dashboard/learning": "Learning Ground",
  "/dashboard/travel": "AI Travel Connect",
  "/dashboard/messages": "Messages",
  "/dashboard/bizhub": "Business Hub",
  "/dashboard/matching": "AI Matchmaking",
  "/dashboard/AIMatching": "AI Matchmaking",
  "/dashboard/funding-cofounders": "Funding / Co-Founders",
  "/dashboard/profile": "My Profile",
  "/dashboard/payments": "Payments",
  "/dashboard/notifications": "Notifications",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
  "/dashboard/merch": "NetworkX Store",
  "/dashboard/dealhub": "Deals Corner",
  "/dashboard/coord/members": "Members",
  "/dashboard/coord/visitors": "Visitors",
  "/dashboard/coord/analytics": "Performance Analytics",
  "/dashboard/coord/surveys": "Surveys",
  "/dashboard/coord/finance": "Finance Overview",
  "/dashboard/coord/awards": "Awards",
  "/dashboard/coord/directory": "Directory & Roster",
  "/dashboard/coord/meetings": "Meeting Control",
  "/dashboard/coord/alerts": "Alerts",
  "/dashboard/coord/reports": "Reports",
  "/dashboard/franchise/meetings": "Meeting Management",
  "/dashboard/franchise/events": "Events Control",
  "/dashboard/franchise/expansion": "Expansion Engine",
  "/dashboard/hq/expansion": "Expansion Engine",
  "/dashboard/franchise/groups": "Groups",
  "/dashboard/franchise/members": "Members",
  "/dashboard/franchise/finance": "Finance",
  "/dashboard/franchise/reports": "Reports",
  "/dashboard/franchise/crm": "CRM",
  "/dashboard/franchise/awards": "Awards",
  "/dashboard/hq": "HQ Control",
  "/dashboard/hq/regions": "Regions",
  "/dashboard/hq/groups": "Groups",
  "/dashboard/hq/members": "Members",
  "/dashboard/hq/referrals": "Referrals",
  "/dashboard/hq/tiers": "Membership Tiers",
  "/dashboard/hq/verification": "Verification Queue",
  "/dashboard/hq/franchise-applications": "Franchise Applications",
  "/dashboard/hq/master-data": "Master Data",
  "/dashboard/hq/awards": "Points & Awards",
  "/dashboard/hq/finance": "Finance Control",
  "/dashboard/hq/surveys": "Surveys",
  "/dashboard/hq/directory": "Directory",
  "/dashboard/hq/settings": "System Settings",
  "/dashboard/hq/admin": "Admin Controls",
  "/dashboard/super/users": "User Management",
  "/dashboard/super/audit": "Audit Logs",
  "/dashboard/super/health": "System Health",
  "/dashboard/super/toggles": "Feature Toggles",
  "/dashboard/super/social-automation": "Social Automation",
  "/dashboard/super/social-automation/new": "New Post",
  "/dashboard/super/social-automation/draft": "Review Post",
  "/dashboard/super/social-automation/connections": "Social Connections",
  "/dashboard/super/social-automation/approvals": "Approval Queue",
  "/dashboard/super/social-automation/history": "Publish History",
  "/dashboard/super/social-automation/blogs": "Blog Posts",
  "/dashboard/super/social-automation/blogs/new": "New Blog Post",
  "/dashboard/super/social-automation/blogs/review": "Review Blog Post",
  "/dashboard/super/social-automation/campaign": "Auto Campaign",
  "/dashboard/super/social-automation/campaign/approvals": "Campaign Approvals",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("Dashboard");
  const [impersonating, setImpersonating] = useState(false);
  const [origName, setOrigName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gateChecking, setGateChecking] = useState(false);
  const pathname = usePathname();

  // Client-side navigation keeps this layout mounted, so anything derived
  // from the URL has to follow it: close the phone drawer once a menu link
  // is tapped (it used to stay open over the new page), and keep the topbar
  // title on the page you're actually viewing.
  useEffect(() => {
    setSidebarOpen(false);
    const path = (pathname || "").replace(/\/$/, "");
    setTitle(PAGE_TITLES[path] || "Dashboard");
  }, [pathname]);
  // Was its own separate ProfileAPI.get() call, on top of Sidebar.tsx's
  // own independent one — the two ran together on every single
  // dashboard-family page load, each minting a fresh signed avatar URL
  // server-side. Now fetched once here and passed down to Sidebar as a
  // prop instead of Sidebar re-fetching it itself.
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cachedUser = getUser();
    if (!cachedUser) {
      window.location.href = "/login";
      return;
    }
    let u = cachedUser;
    const path = window.location.pathname.replace(/\/$/, "");
    let cancelled = false;
    // Where (if anywhere) this user must be sent instead of `path`.
    const blockedRedirect = (x: any): string | null => {
      if (
        x.role === "member" &&
        x.email_verified === false &&
        path !== "/dashboard/verify-email"
      )
        return "/dashboard/verify-email";
      if (
        x.membership_status &&
        x.membership_status !== "active" &&
        path !== "/dashboard/membership"
      )
        return "/dashboard/membership";
      return null;
    };
    // Real gap fix: register_member() issues a real token immediately
    // regardless of email_verified, and until now nothing on the
    // dashboard side ever checked it — only a later login attempt did
    // (login_with_email/verify_otp). A brand-new registration (free
    // signups especially, already "active" with no payment step) got
    // full dashboard access with an unverified email and never had to
    // verify unless they happened to log out and back in. Checked before
    // the payment gate below — identity should be confirmed before
    // anything else matters. Scoped to role==='member' as extra
    // insurance: this reads the exact same field the existing login gate
    // already trusts for every role, so if staff/HQ accounts survive
    // that gate they survive this one too, but member-only keeps it
    // consistent with how every other tier/feature gate in this app is
    // scoped, in case any staff doc is ever missing the field.
    // (Both gates below now go through blockedRedirect(), and a "blocked"
    // verdict is confirmed with the server first — see the check further down.)
    // Same gate login/page.tsx applies on sign-in, repeated here so
    // typing /dashboard directly (or reloading a tab left open from
    // before payment) doesn't skip it. Cached membership_status is kept
    // fresh by login and by a successful payment (both patch it
    // immediately) — an account predating this feature simply has no
    // membership_status field at all, which is falsy here, so it's never
    // blocked by a value that was never set. Sent INTO the dashboard
    // shell (not back out to the public /pricing page) so Sidebar can
    // show every other page as visibly locked instead of just bouncing —
    // the membership page itself is the one exception, or this would
    // redirect-loop.
    //
    // Real bug fix: both gates read the copy of the user cached in THIS
    // browser at login. Verify email (or pay) on desktop and a phone that
    // logged in earlier still holds email_verified:false / "pending", so a
    // refresh there bounced back to the verify screen forever. A cached
    // "blocked" verdict is therefore only trusted after asking the server
    // (TokenStore.refreshUser also rewrites the cache). If the server can't
    // be reached we fall back to the cached verdict, as before.
    const initialRedirect = blockedRedirect(u);
    if (initialRedirect) {
      setGateChecking(true);
      // Don't leave a blank page if the connection is slow — after 6s fall
      // back to the cached verdict (same as an unreachable server).
      Promise.race([
        TokenStore.refreshUser(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
      ]).then((fresh: any) => {
        if (cancelled) return;
        const target = blockedRedirect(fresh || u);
        if (target) {
          window.location.href = target;
          return;
        }
        if (fresh) {
          u = fresh;
          setUser(fresh);
        }
        setGateChecking(false);
      });
    }
    setUser(u);
    const fetchProfile = () =>
      ProfileAPI.get()
        .then((p: any) => {
          setProfile(p);
          setAvatarUrl(p?.avatar_url || "");
        })
        .catch(() => {});
    fetchProfile();
    setTitle(PAGE_TITLES[path] || "Dashboard");

    setImpersonating(TokenStore.isImpersonating());
    try {
      const orig = JSON.parse(localStorage.getItem("nia_orig_user") || "null");
      if (orig?.name) setOrigName(orig.name);
    } catch {}

    // Start automatic token refresh — refreshes 2min before expiry (15min tokens)
    initAutoRefresh(15);

    // Real fix: this shared `profile` state (feeds the topbar avatar/name
    // and Sidebar's profile-completion bar) was fetched once on mount and
    // never refreshed — saving an edit on /dashboard/profile only updated
    // that page's own local state, so the sidebar kept showing pre-edit
    // completion% until a full reload. Same 'nia:*-updated' event pattern
    // notifications already uses; ProfilePage.save() dispatches this.
    window.addEventListener("nia:profile-updated", fetchProfile);

    // Cleanup on unmount
    return () => {
      cancelled = true;
      stopAutoRefresh();
      window.removeEventListener("nia:profile-updated", fetchProfile);
    };
  }, []);

  useEffect(() => {
    // Real fix: this fetched the unread count exactly once on mount and
    // never again — the sidebar's own count (Sidebar.tsx) already polls
    // every 30s, listens for tab visibility, and listens for the real
    // 'nia:notifications-updated' event the notifications page dispatches
    // on mark-read/mark-all-read/delete, but this topbar bell count never
    // picked up any of that, so the two counts could show different
    // numbers until the whole page reloaded. Same pattern, here too.
    const fetchCount = () => {
      NotificationsAPI.count()
        .then((result: any) => setUnreadCount(result.count || 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("nia:notifications-updated", fetchCount);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("nia:notifications-updated", fetchCount);
    };
  }, []);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      )
        setSearchOpen(false);
      if (
        actionsRef.current &&
        !actionsRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(
          () => searchRef.current?.querySelector("input")?.focus(),
          0,
        );
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  useEffect(() => {
    const query = search.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(async () => {
      // Real fix: groups/events used to fetch only the first 50 records
      // (no server-side search existed for either) and filter client-side
      // in the browser — a genuine match outside that first page of 50
      // silently never appeared in search results. Both now take a real
      // `q` param and search server-side over the actual full scoped set
      // (main code/backend/app/modules/{groups,events}/service.py).
      const settled = await Promise.allSettled([
        UsersAPI.search({ q: query, limit: 4 }),
        GroupsAPI.list({ q: query, page_size: 5 }),
        EventsAPI.list({ q: query, page_size: 5 }),
        OpportunitiesAPI.list({ q: query }),
      ]);
      const value = (index: number) =>
        settled[index].status === "fulfilled"
          ? (settled[index] as PromiseFulfilledResult<any>).value
          : { items: [] };
      const members = (value(0).items || value(0) || [])
        .slice(0, 4)
        .map((item: any) => ({
          type: "Members",
          icon: faUsers,
          title: item.name || item.email || "Member",
          sub: item.profession || item.city || item.email,
          path: "/dashboard/discover",
        }));
      const groups = (value(1).items || value(1) || [])
        .slice(0, 3)
        .map((item: any) => ({
          type: "Groups",
          icon: faLandmark,
          title: item.name || "Group",
          sub: item.city || item.territory?.name,
          path: "/dashboard/groups",
        }));
      const events = (value(2).items || value(2) || [])
        .slice(0, 3)
        .map((item: any) => ({
          type: "Events",
          icon: faCalendarDays,
          title: item.title || item.name || "Event",
          sub: item.city || item.event_type,
          path: "/dashboard/events",
        }));
      const opportunities = (value(3).items || value(3) || [])
        .slice(0, 3)
        .map((item: any) => ({
          type: "Opportunities",
          icon: faRocket,
          title: item.title || "Opportunity",
          sub: item.category || item.industry,
          path: "/dashboard/opportunities",
        }));
      setSearchResults([...members, ...groups, ...events, ...opportunities]);
      setSearching(false);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [search]);

  const toggleNotifications = async () => {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    setProfileOpen(false);
    if (next) {
      try {
        const [list, count] = await Promise.all([
          NotificationsAPI.list({ page: 1, page_size: 5 }),
          NotificationsAPI.count(),
        ]);
        setNotifications(list.items || list || []);
        setUnreadCount(count.count || 0);
      } catch {
        setNotifications([]);
      }
    }
  };

  const exitImpersonation = () => {
    TokenStore.exitImpersonation();
    window.location.href = "/dashboard/super/users";
  };

  // Always render same shell on server and client — no conditional structure
  return (
    <DashboardProfileProvider value={profile}>
      <div className="shell" suppressHydrationWarning>
        <div
          className={`sb-backdrop${sidebarOpen ? " open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />
        <Sidebar mobileOpen={sidebarOpen} profile={profile} />
        <div className="main" suppressHydrationWarning>
          {impersonating && (
            <div
              style={{
                background: "#7c2d12",
                color: "#fff",
                padding: "8px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              <span>
                <FontAwesomeIcon icon={faUserSecret} className="mr-1.5" />
                Logged in as <strong>{user?.name}</strong> (impersonating
                {origName ? ` — real account: ${origName}` : ""}). This session
                is fully audited and expires automatically.
              </span>
              <button
                onClick={exitImpersonation}
                style={{
                  background: "var(--nx-panel)",
                  color: "#7c2d12",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Exit to my account
              </button>
            </div>
          )}
          <div className="topbar" suppressHydrationWarning>
            {user ? (
              <>
                <button
                  className="sb-toggle"
                  onClick={() => setSidebarOpen((o) => !o)}
                  aria-label="Toggle menu"
                >
                  <FontAwesomeIcon icon={faBars} />
                </button>
                <div className="topbar-page-title">{title}</div>
                <div className="global-search" ref={searchRef}>
                  <span className="global-search-icon">
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </span>
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSearchOpen(true);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Search members, groups, events and opportunities…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const q = search.trim().toLowerCase();
                        if (!q) return;
                        if (
                          ["member", "members", "people", "network"].some((k) =>
                            q.includes(k),
                          )
                        )
                          window.location.href = "/dashboard/discover";
                        else if (
                          ["group", "groups", "chapter"].some((k) =>
                            q.includes(k),
                          )
                        )
                          window.location.href = "/dashboard/groups";
                        else if (
                          ["referral", "referrals", "refer"].some((k) =>
                            q.includes(k),
                          )
                        )
                          window.location.href = "/dashboard/referrals";
                        else if (
                          ["event", "events", "meet", "meeting"].some((k) =>
                            q.includes(k),
                          )
                        )
                          window.location.href = "/dashboard/events";
                        else if (
                          ["pay", "payment", "invoice", "renew"].some((k) =>
                            q.includes(k),
                          )
                        )
                          window.location.href = "/dashboard/payments";
                        else if (
                          ["learn", "course", "training"].some((k) =>
                            q.includes(k),
                          )
                        )
                          window.location.href = "/dashboard/learning";
                        else if (
                          ["travel", "trip", "visit"].some((k) => q.includes(k))
                        )
                          window.location.href = "/dashboard/travel";
                        else if (
                          ["message", "chat", "inbox"].some((k) =>
                            q.includes(k),
                          )
                        )
                          window.location.href = "/dashboard/messages";
                        else if (
                          ["business", "hub", "opportunity"].some((k) =>
                            q.includes(k),
                          )
                        )
                          window.location.href = "/dashboard/opportunities";
                        else if (
                          ["notif", "notification", "alert"].some((k) =>
                            q.includes(k),
                          )
                        )
                          window.location.href = "/dashboard/notifications";
                        else window.location.href = "/dashboard/discover";
                      }
                    }}
                  />
                  <kbd>⌘ K</kbd>
                  {searchOpen && search.trim().length >= 2 && (
                    <div className="global-search-results">
                      <div className="global-search-results-head">
                        <span>Search results</span>
                        <small>
                          {searching
                            ? "Searching…"
                            : `${searchResults.length} found`}
                        </small>
                      </div>
                      {!searching && searchResults.length === 0 ? (
                        <div className="global-search-empty">
                          No matching members, groups, events or opportunities.
                        </div>
                      ) : (
                        searchResults.map((result, index) => (
                          <button
                            key={`${result.type}-${index}`}
                            onClick={() => (window.location.href = result.path)}
                          >
                            <span>
                              <FontAwesomeIcon icon={result.icon} />
                            </span>
                            <div>
                              <small>{result.type}</small>
                              <strong>{result.title}</strong>
                              {result.sub && <em>{result.sub}</em>}
                            </div>
                          </button>
                        ))
                      )}
                      <button
                        className="global-search-all"
                        onClick={() =>
                          (window.location.href = "/dashboard/discover")
                        }
                      >
                        Explore all NetworkX members →
                      </button>
                    </div>
                  )}
                </div>
                <div className="topbar-actions" ref={actionsRef}>
                  <button
                    className="topbar-notification"
                    onClick={toggleNotifications}
                    aria-label="Notifications"
                    aria-expanded={notificationsOpen}
                  >
                    <span className="topbar-bell-emoji" aria-hidden="true">
                      🔔
                    </span>
                    {unreadCount > 0 && (
                      <span className="topbar-unread-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {notificationsOpen && (
                    <div className="topbar-popover notifications-popover">
                      <div className="topbar-popover-head">
                        <strong>Notifications</strong>
                        <span>{unreadCount} unread</span>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="topbar-popover-empty">
                          <span>
                            <FontAwesomeIcon icon={faBell} />
                          </span>
                          <strong>You’re all caught up</strong>
                          <p>
                            New activity and important updates will appear here.
                          </p>
                        </div>
                      ) : (
                        notifications.map((item: any) => (
                          <button
                            key={item.id}
                            onClick={() =>
                              (window.location.href =
                                "/dashboard/notifications")
                            }
                            className={!item.is_read ? "unread" : ""}
                          >
                            <span className="notification-dot" />
                            <div>
                              <strong>{item.title || "Notification"}</strong>
                              <p>{item.message || item.body || ""}</p>
                            </div>
                          </button>
                        ))
                      )}
                      <button
                        className="topbar-popover-footer"
                        onClick={() =>
                          (window.location.href = "/dashboard/notifications")
                        }
                      >
                        View all notifications <span>→</span>
                      </button>
                    </div>
                  )}
                  <button
                    className="topbar-profile"
                    aria-expanded={profileOpen}
                    onClick={() => {
                      setProfileOpen(!profileOpen);
                      setNotificationsOpen(false);
                    }}
                  >
                    <div className="av">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={profile?.name || user.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        (profile?.name || user.name).charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <strong>
                        {(profile?.name || user.name).split(" ")[0]}
                      </strong>
                      <span>{user.role.replace("_", " ")}</span>
                    </div>
                    <FontAwesomeIcon icon={faChevronDown} />
                  </button>
                  {profileOpen && (
                    <div className="topbar-popover profile-popover">
                      <div className="profile-popover-user">
                        <div className="av">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" />
                          ) : (
                            (profile?.name || user.name).charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <strong>{profile?.name || user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          (window.location.href = "/dashboard/profile")
                        }
                      >
                        <span className="profile-menu-emoji blue">👤</span>
                        <span className="profile-menu-copy">
                          <strong>My Profile</strong>
                          <small>View and update your details</small>
                        </span>
                        <FontAwesomeIcon
                          className="profile-menu-arrow"
                          icon={faChevronRight}
                        />
                      </button>
                      <button
                        onClick={() =>
                          (window.location.href = "/dashboard/payments")
                        }
                      >
                        <span className="profile-menu-emoji green">💳</span>
                        <span className="profile-menu-copy">
                          <strong>Payments</strong>
                          <small>Billing and transaction history</small>
                        </span>
                        <FontAwesomeIcon
                          className="profile-menu-arrow"
                          icon={faChevronRight}
                        />
                      </button>
                      <button
                        onClick={() =>
                          (window.location.href = "/dashboard/settings")
                        }
                      >
                        <span className="profile-menu-emoji purple">⚙️</span>
                        <span className="profile-menu-copy">
                          <strong>Settings</strong>
                          <small>Account preferences</small>
                        </span>
                        <FontAwesomeIcon
                          className="profile-menu-arrow"
                          icon={faChevronRight}
                        />
                      </button>
                      <button
                        className="profile-membership"
                        onClick={() =>
                          (window.location.href = "/dashboard/membership")
                        }
                      >
                        <span className="profile-menu-emoji gold">⭐</span>
                        <span className="profile-menu-copy">
                          <strong>Membership</strong>
                          <small>Plan and member benefits</small>
                        </span>
                        <FontAwesomeIcon
                          className="profile-menu-arrow"
                          icon={faChevronRight}
                        />
                      </button>
                      <button
                        className="profile-logout"
                        onClick={() => {
                          logout();
                          window.location.href = "/login";
                        }}
                      >
                        <span className="profile-menu-emoji red">↪️</span>
                        <span className="profile-menu-copy">
                          <strong>Logout</strong>
                          <small>Securely end this session</small>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ height: 56 }} />
            )}
          </div>
          <ResponsiveTables />
          <div className="content" suppressHydrationWarning>
            {gateChecking ? null : children}
          </div>
        </div>
      </div>
    </DashboardProfileProvider>
  );
}
