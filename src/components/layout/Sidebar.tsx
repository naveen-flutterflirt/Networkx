"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser, logout } from "@/lib/auth";
import { useEffect, useState } from "react";
import { Role } from "@/lib/data";
import { NotificationsAPI } from "@/lib/api";
import { profileCompletionPct } from "@/lib/profileCompletion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faTableCells,
  faMagnifyingGlass,
  faUsers,
  faArrowsRotate,
  faCalendarDays,
  faVideo,
  faBookOpen,
  faPlane,
  faComment,
  faBuilding,
  faBullseye,
  faGift,
  faRocket,
  faShirt,
  faUser,
  faCreditCard,
  faStar,
  faBell,
  faGear,
  faLandmark,
  faTicket,
  faSackDollar,
  faChartBar,
  faTrophy,
  faMap,
  faCompass,
  faCircleCheck,
  faCity,
  faClipboard,
  faFolderOpen,
  faLock,
  faUserLock,
  faShieldHalved,
  faScrewdriverWrench,
  faRightFromBracket,
  faShareNodes,
  faChevronLeft,
  faChevronRight,
  faHandshake,
} from "@fortawesome/free-solid-svg-icons";

interface NavItem {
  icon: IconDefinition;
  label: string;
  path: string;
  roles: Role[];
  badgeKey?: "messages" | "notifications";
  badge?: number;
  isNew?: boolean;
}

const MEMBER_EMOJI: Record<string, string> = {
  Dashboard: "🧭",
  Notifications: "🔔",
  Messages: "💬",
  "Explore NetworkX": "🧿",
  "My Network": "👥",
  Referrals: "🤝",
  Events: "📅",
  "Travel Connect": "✈️",
  "AI Travel Connect": "✈️",
  "Learning Ground": "🎓",
  "Business Hub": "🏢",
  "Deals Corner": "🎁",
  "Growth Vault": "🚀",
  "Badges & Rewards": "🏆",
  "Digital Meetings": "🎥",
  "AI Matchmaking": "🧠",
  "Funding & Founders": "🤝",
  "NetworkX Store": "🛍️",
  "My Profile": "👤",
  Payments: "💳",
  Membership: "⭐",
  Settings: "⚙️",
};

// MEMBER nav — Notifications moved to top (right after Dashboard) per request
const MEMBER_NAV: NavItem[] = [
  {
    icon: faTableCells,
    label: "Dashboard",
    path: "/dashboard",
    roles: ["member"],
  },
  {
    icon: faComment,
    label: "Messages",
    path: "/dashboard/messages",
    roles: ["member"],
    badgeKey: "messages",
  },
  {
    icon: faBell,
    label: "Notifications",
    path: "/dashboard/notifications",
    roles: ["member"],
    badgeKey: "notifications",
  },
  {
    icon: faBullseye,
    label: "AI Matchmaking",
    path: "/dashboard/AIMatching",
    roles: ["member"],
    isNew: true,
  },
  {
    icon: faPlane,
    label: "AI Travel Connect",
    path: "/dashboard/travel",
    roles: ["member"],
    isNew: true,
  },
  {
    icon: faHandshake,
    label: "Funding & Founders",
    path: "/dashboard/funding-cofounders",
    roles: ["member"],
    isNew: true,
  },
  {
    icon: faRocket,
    label: "Growth Vault",
    path: "/dashboard/opportunities",
    roles: ["member"],
  },
  {
    icon: faMagnifyingGlass,
    label: "Explore NetworkX",
    path: "/dashboard/discover",
    roles: ["member"],
  },
  {
    icon: faUsers,
    label: "My Network",
    path: "/dashboard/network",
    roles: ["member"],
  },
  {
    icon: faArrowsRotate,
    label: "Referrals",
    path: "/dashboard/referrals",
    roles: ["member"],
  },
  {
    icon: faCalendarDays,
    label: "Events",
    path: "/dashboard/events",
    roles: ["member"],
  },
  {
    icon: faGift,
    label: "Deals Corner",
    path: "/dashboard/dealhub",
    roles: ["member"],
  },
  {
    icon: faBookOpen,
    label: "Learning Ground",
    path: "/dashboard/learning",
    roles: ["member"],
  },
  {
    icon: faTrophy,
    label: "Badges & Rewards",
    path: "/dashboard/badges-rewards",
    roles: ["member"],
  },
  {
    icon: faVideo,
    label: "Digital Meetings",
    path: "/dashboard/meetings",
    roles: ["member"],
  },
  {
    icon: faShirt,
    label: "NetworkX Store",
    path: "/dashboard/merch",
    roles: ["member"],
  },
  {
    icon: faUser,
    label: "My Profile",
    path: "/dashboard/profile",
    roles: ["member"],
  },
  {
    icon: faCreditCard,
    label: "Payments",
    path: "/dashboard/payments",
    roles: ["member"],
  },
  {
    icon: faStar,
    label: "Membership",
    path: "/dashboard/membership",
    roles: ["member"],
  },
  {
    icon: faGear,
    label: "Settings",
    path: "/dashboard/settings",
    roles: ["member"],
  },
];

const MEMBER_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Core",
    items: MEMBER_NAV.filter((i) =>
      ["Dashboard", "Messages", "Notifications"].includes(i.label),
    ),
  },
  {
    label: "AI Intelligence",
    items: MEMBER_NAV.filter((i) =>
      [
        "AI Matchmaking",
        "AI Travel Connect",
        "Funding & Founders",
        "Growth Vault",
      ].includes(i.label),
    ),
  },
  {
    label: "Network",
    items: MEMBER_NAV.filter((i) =>
      ["Explore NetworkX", "My Network", "Referrals", "Events"].includes(
        i.label,
      ),
    ),
  },
  {
    label: "Growth",
    items: MEMBER_NAV.filter((i) =>
      ["Deals Corner", "Learning Ground", "Badges & Rewards"].includes(i.label),
    ),
  },
  {
    label: "Resources",
    items: MEMBER_NAV.filter((i) =>
      ["Digital Meetings", "NetworkX Store"].includes(i.label),
    ),
  },
];

// FRANCHISE nav — matches real nia.invizag.com City Partner Portal; Notifications moved to top
const FRANCHISE_NAV: NavItem[] = [
  {
    icon: faTableCells,
    label: "City Dashboard",
    path: "/dashboard",
    roles: ["franchise"],
  },
  {
    icon: faBell,
    label: "Notifications",
    path: "/dashboard/notifications",
    roles: ["franchise"],
    badgeKey: "notifications",
  },
  {
    icon: faLandmark,
    label: "Groups",
    path: "/dashboard/franchise/groups",
    roles: ["franchise"],
  },
  {
    icon: faUsers,
    label: "Members",
    path: "/dashboard/franchise/members",
    roles: ["franchise"],
  },
  {
    icon: faCalendarDays,
    label: "Meeting Management",
    path: "/dashboard/meetings",
    roles: ["franchise"],
  },
  {
    icon: faTicket,
    label: "Events Control",
    path: "/dashboard/franchise/events",
    roles: ["franchise"],
  },
  {
    icon: faRocket,
    label: "Expansion Engine",
    path: "/dashboard/franchise/expansion",
    roles: ["franchise"],
  },
  {
    icon: faBullseye,
    label: "CRM",
    path: "/dashboard/franchise/crm",
    roles: ["franchise"],
  },
  {
    icon: faRocket,
    label: "Growth Vault",
    path: "/dashboard/opportunities",
    roles: ["franchise"],
    isNew: true,
  },
  {
    icon: faSackDollar,
    label: "Finance",
    path: "/dashboard/franchise/finance",
    roles: ["franchise"],
  },
  {
    icon: faGift,
    label: "Deals Corner",
    path: "/dashboard/dealhub",
    roles: ["franchise"],
  },
  {
    icon: faShirt,
    label: "NetworkX Store",
    path: "/dashboard/merch",
    roles: ["franchise"],
  },
  {
    icon: faChartBar,
    label: "Reports",
    path: "/dashboard/franchise/reports",
    roles: ["franchise"],
  },
  {
    icon: faTrophy,
    label: "Awards",
    path: "/dashboard/franchise/awards",
    roles: ["franchise"],
  },
  {
    icon: faGear,
    label: "Settings",
    path: "/dashboard/settings",
    roles: ["franchise"],
  },
];

// HQ nav — HQ Admin (20) + Super Admin exclusive (4) = 24 total; Notifications moved to top
const HQ_NAV: NavItem[] = [
  {
    icon: faTableCells,
    label: "Global Dashboard",
    path: "/dashboard",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faBell,
    label: "Notifications",
    path: "/dashboard/notifications",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faMap,
    label: "Regions",
    path: "/dashboard/hq/regions",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faCompass,
    label: "Expansion Engine",
    path: "/dashboard/hq/expansion",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faLandmark,
    label: "Groups",
    path: "/dashboard/hq/groups",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faUsers,
    label: "Circles",
    path: "/dashboard/hq/circles",
    roles: ["hq_admin", "super_admin"],
    isNew: true,
  },
  {
    icon: faUsers,
    label: "Members",
    path: "/dashboard/hq/members",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faStar,
    label: "Membership Tiers",
    path: "/dashboard/hq/tiers",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faCircleCheck,
    label: "Verification Queue",
    path: "/dashboard/hq/verification",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faCity,
    label: "Franchise Applications",
    path: "/dashboard/hq/franchise-applications",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faGear,
    label: "Master Data",
    path: "/dashboard/hq/master-data",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faArrowsRotate,
    label: "Referrals",
    path: "/dashboard/hq/referrals",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faTrophy,
    label: "Points & Awards",
    path: "/dashboard/hq/awards",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faSackDollar,
    label: "Finance Control",
    path: "/dashboard/hq/finance",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faCalendarDays,
    label: "Events",
    path: "/dashboard/events",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faVideo,
    label: "Digital Meetings",
    path: "/dashboard/meetings",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faClipboard,
    label: "Surveys",
    path: "/dashboard/hq/surveys",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faFolderOpen,
    label: "Directory",
    path: "/dashboard/hq/directory",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faGear,
    label: "System Settings",
    path: "/dashboard/hq/settings",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faTrophy,
    label: "Badges & Rewards Config",
    path: "/dashboard/hq/badges-rewards-config",
    roles: ["hq_admin", "super_admin"],
    isNew: true,
  },
  {
    icon: faLock,
    label: "Admin Controls",
    path: "/dashboard/hq/admin",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faComment,
    label: "Messages",
    path: "/dashboard/messages",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faGift,
    label: "Deals Corner",
    path: "/dashboard/dealhub",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faShirt,
    label: "NetworkX Store",
    path: "/dashboard/merch",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faBookOpen,
    label: "Learning Ground",
    path: "/dashboard/learning",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faPlane,
    label: "Travel Connect",
    path: "/dashboard/travel",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faBuilding,
    label: "Business Hub",
    path: "/dashboard/bizhub",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faRocket,
    label: "Growth Vault",
    path: "/dashboard/opportunities",
    roles: ["hq_admin", "super_admin"],
    isNew: true,
  },
  {
    icon: faBullseye,
    label: "CRM",
    path: "/dashboard/franchise/crm",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faGear,
    label: "Settings",
    path: "/dashboard/settings",
    roles: ["hq_admin", "super_admin"],
  },
  {
    icon: faUserLock,
    label: "User Management",
    path: "/dashboard/super/users",
    roles: ["super_admin"],
  },
  {
    icon: faClipboard,
    label: "Audit Logs",
    path: "/dashboard/super/audit",
    roles: ["super_admin"],
  },
  {
    icon: faShieldHalved,
    label: "System Health",
    path: "/dashboard/super/health",
    roles: ["super_admin"],
  },
  {
    icon: faScrewdriverWrench,
    label: "Feature Toggles",
    path: "/dashboard/super/toggles",
    roles: ["super_admin"],
  },
  {
    icon: faShareNodes,
    label: "Social Automation",
    path: "/dashboard/super/social-automation",
    roles: ["super_admin"],
    isNew: true,
  },
];

const ROLE_LABEL: Record<string, string> = {
  member: "Member",
  franchise: "City Partner",
  hq_admin: "HQ Admin",
  super_admin: "Super Admin",
};

const PORTAL_LABEL: Record<string, string> = {
  member: "Member Portal",
  franchise: "City Partner Portal",
  hq_admin: "HQ Portal",
  super_admin: "HQ Portal",
};

function getNav(role: Role): NavItem[] {
  if (role === "franchise") return FRANCHISE_NAV;
  if (role === "hq_admin" || role === "super_admin") return HQ_NAV;
  return MEMBER_NAV;
}

export default function Sidebar({
  mobileOpen,
  profile,
}: { mobileOpen?: boolean; profile?: any } = {}) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  // Follows the route. This used to be read once from window.location on
  // mount, so after navigating between pages (client-side, the layout stays
  // mounted) the highlighted item stayed on the page you first opened.
  const pathname = (usePathname() || "").replace(/\/$/, "") || "/dashboard";
  const [counts, setCounts] = useState<{
    messages: number;
    notifications: number;
  }>({ messages: 0, notifications: 0 });
  const [profilePct, setProfilePct] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setCollapsed(
      window.localStorage.getItem("networkx-sidebar-collapsed") === "1",
    );
    setMounted(true);
    // TokenStore.refreshUser() rewrites the cached user after the layout's
    // server check — pick it up so the padlocks match the real state.
    const onUserUpdated = () => setUser(getUser());
    window.addEventListener("nia:user-updated", onUserUpdated);
    return () => window.removeEventListener("nia:user-updated", onUserUpdated);
  }, []);

  useEffect(() => {
    if (!mounted || !user || !profile) return;
    // Was its own independent ProfileAPI.get() call here — layout.tsx
    // (the only place Sidebar is rendered) already fetches the same
    // profile for the topbar avatar, and that call was minting a fresh
    // signed avatar URL server-side on every single dashboard page
    // load, in addition to the one layout.tsx's own fetch already
    // triggered. Reuse what the parent already fetched instead.
    setProfilePct(profileCompletionPct(profile));
    setAvatarUrl(profile?.avatar_url || "");
  }, [mounted, user, profile]);

  useEffect(() => {
    if (!mounted || !user) return;
    const fetchCounts = () => {
      if (document.visibilityState !== "visible") return;
      NotificationsAPI.badgeCounts()
        .then((r) =>
          setCounts({
            messages: r.messages || 0,
            notifications: r.notifications || 0,
          }),
        )
        .catch(() => {});
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchCounts();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("nia:notifications-updated", fetchCounts);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("nia:notifications-updated", fetchCounts);
    };
  }, [mounted, user]);

  if (!mounted) return null;
  if (!user) return null;

  const nav = getNav(user.role);
  const displayName = profile?.name || user.name;
  const initials = (displayName || "N").trim().charAt(0).toUpperCase();

  // Same gates dashboard/layout.tsx enforces on page load — repeated here
  // so a not-yet-verified or not-yet-paid member sees every other page as
  // visibly locked instead of a link that would just bounce them back on
  // click. Email verification checked first, same priority order as the
  // layout guard — identity should be confirmed before payment matters.
  // Both only ever true for a `member` role/have a membership doc at all;
  // staff/franchise/HQ/super accounts are never gated by either.
  const emailUnverified =
    user.role === "member" && user.email_verified === false;
  const paymentRequired =
    !emailUnverified &&
    !!user.membership_status &&
    user.membership_status !== "active";
  const lockedException = emailUnverified
    ? "/dashboard/verify-email"
    : "/dashboard/membership";
  const lockReason = emailUnverified
    ? "Verify your email to unlock this"
    : "Complete your payment to unlock this";

  const renderItem = (i: NavItem) => {
    const isActive =
      pathname === i.path ||
      pathname === i.path + "/" ||
      (i.path !== "/dashboard" && pathname.startsWith(i.path + "/"));
    const badgeVal = i.badgeKey ? counts[i.badgeKey] : i.badge;
    const locked =
      (emailUnverified || paymentRequired) && i.path !== lockedException;
    const icon = (
      <span
        className={`sb-item-icon${user.role === "member" ? " sb-emoji" : ""}`}
      >
        {user.role === "member" ? (
          MEMBER_EMOJI[i.label]
        ) : (
          <FontAwesomeIcon icon={i.icon} />
        )}
      </span>
    );

    if (locked) {
      return (
        <div
          key={i.path}
          title={collapsed ? i.label : lockReason}
          className="sb-item sb-item-locked"
          aria-disabled="true"
        >
          {icon}
          <span className="sb-item-label">{i.label}</span>
          <FontAwesomeIcon
            icon={faLock}
            style={{ fontSize: 11, opacity: 0.6, marginLeft: "auto" }}
          />
        </div>
      );
    }
    return (
      <Link
        key={i.path}
        href={i.path}
        title={collapsed ? i.label : undefined}
        className={`sb-item${isActive ? " active" : ""}`}
      >
        {icon}
        <span className="sb-item-label">{i.label}</span>
        {i.isNew && <span className="sb-new-badge">NEW</span>}
        {!!badgeVal && <span className="sb-count-badge">{badgeVal}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={`sidebar${mobileOpen ? " open" : ""}${collapsed ? " collapsed" : ""}`}
    >
      <div className="sb-brand">
        <div className="sb-brand-logo">
          <img
            src="/images/networkx-logo-dark-bg.png"
            alt="NetworkX"
            style={{ height: 20, width: "auto", objectFit: "contain" }}
          />
        </div>
        <div className="sb-portal-label">{PORTAL_LABEL[user.role]}</div>
        <button
          className="sb-collapse"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() =>
            setCollapsed((value) => {
              const next = !value;
              window.localStorage.setItem(
                "networkx-sidebar-collapsed",
                next ? "1" : "0",
              );
              return next;
            })
          }
        >
          <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
        </button>
      </div>

      <div className="sb-member-card">
        <div className="sb-member-row">
          <div className="av sb-member-avatar">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials
            )}
          </div>
          <div className="sb-member-copy">
            <div>{displayName}</div>
            <span>{ROLE_LABEL[user.role]}</span>
          </div>
        </div>
        <div className="sb-member-progress">
          <div className="prog">
            <div className="prog-fill" style={{ width: `${profilePct}%` }} />
          </div>
          <span>{profilePct}% profile complete</span>
        </div>
      </div>

      <nav className="sb-nav">
        {user.role === "member"
          ? MEMBER_GROUPS.map((group) => (
              <div className="sb-nav-group" key={group.label}>
                <div className="sb-section">{group.label}</div>
                {group.items.map(renderItem)}
              </div>
            ))
          : nav.map(renderItem)}
      </nav>

      {user.role !== "member" && (
        <div className="sb-account">
          <button
            className="sb-item"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            <span className="sb-item-icon">
              <FontAwesomeIcon icon={faRightFromBracket} />
            </span>
            <span className="sb-item-label">Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
