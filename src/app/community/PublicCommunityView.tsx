"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBuilding,
  faCopy,
  faCrown,
  faLocationDot,
  faShareNodes,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { CirclesAPI } from "@/lib/api";
import styles from "./community.module.css";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.networkxcircle.com"
).replace(/\/$/, "");

// Self-fetching, client-only — same pattern resource_slug/page.tsx uses for
// /resources/<slug>, and for the same reason: static export (output:'export')
// has no server to render per-request, and circles are live Firestore data
// created/edited by HQ admins at any time, so pre-rendering one HTML file per
// circle at build time (generateStaticParams) would need a full site rebuild
// every time a circle is added — not workable for an admin-managed feature.
// Mounted from two places: `/community` (reads the legacy `?c=slug` query,
// kept for old shared links/emails) and `/community_slug` (the real file
// Firebase's `/community/**` rewrite serves for the new `/community/<slug>`
// clean URLs — see firebase.json and resource_slug/page.tsx's own comment
// for how a rewrite can serve one file's content while the address bar,
// and therefore usePathname() here, still shows the real requested path).
// Real tradeoff, same one already accepted for insights: this can't produce
// server-rendered per-page <head> tags the way real SSR could — document.title
// and the meta tags below are set client-side, which helps the browser tab
// and most link-preview bots that do execute JS, but not ones that don't.
export default function PublicCommunityView() {
  const pathname = usePathname();
  const [circle, setCircle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const slug = useMemo(() => {
    if (typeof window === "undefined") return "";
    const fromQuery = new URLSearchParams(window.location.search).get("c");
    if (fromQuery) return fromQuery;
    const clean = (pathname || "").replace(/\/+$/, "");
    const parts = clean.split("/").filter(Boolean);
    // parts[0] is 'community' (or 'community_slug' via the rewrite) — the
    // slug is whatever follows it, if anything.
    return parts.length > 1 ? parts[parts.length - 1] : "";
  }, [pathname]);

  useEffect(() => {
    if (!slug) {
      setError("Community link is incomplete");
      setLoading(false);
      return;
    }
    CirclesAPI.public(slug)
      .then((data: any) => {
        setCircle(data);
        const title = `${data.name} Business Community | NetworkX`;
        const description =
          data.description ||
          `Meet ${data.active_members} active business members of ${data.name} on NetworkX.`;
        document.title = title;
        const setMeta = (selector: string, attr: string, value: string) => {
          let tag = document.querySelector(selector) as HTMLMetaElement | null;
          if (!tag) {
            tag = document.createElement("meta");
            document.head.appendChild(tag);
          }
          tag.setAttribute(attr, value);
          tag.setAttribute("content", description);
        };
        setMeta('meta[name="description"]', "name", "description");
        setMeta('meta[property="og:title"]', "property", "og:title");
        (
          document.querySelector('meta[property="og:title"]') as HTMLMetaElement
        ).content = title;
        setMeta(
          'meta[property="og:description"]',
          "property",
          "og:description",
        );
        let canonical = document.querySelector(
          'link[rel="canonical"]',
        ) as HTMLLinkElement | null;
        if (!canonical) {
          canonical = document.createElement("link");
          canonical.rel = "canonical";
          document.head.appendChild(canonical);
        }
        canonical.href = `${SITE}/community/${encodeURIComponent(data.public_slug)}`;
      })
      .catch((e: any) => setError(e.message || "Community not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  const shareUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/community/${encodeURIComponent(circle?.public_slug || slug)}`;
  const shareText = circle
    ? `Meet the members of ${circle.name} on NetworkX`
    : "NetworkX Community";
  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (loading)
    return (
      <main className={styles.state}>
        <div className={styles.spinner} />
        <span>Loading community…</span>
      </main>
    );
  if (error || !circle)
    return (
      <main className={styles.state}>
        <strong>{error || "Community not found"}</strong>
        <a href="/">Back to NetworkX</a>
      </main>
    );

  const structured = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: circle.name,
    description: circle.description,
    url: `${SITE}/community/${circle.public_slug}`,
    location: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: circle.city,
        addressRegion: circle.state,
        addressCountry: circle.country,
      },
    },
    member: circle.members.map((m: any) => ({
      "@type": "Person",
      name: m.name,
      jobTitle: m.designation || m.profession,
      worksFor: m.company
        ? { "@type": "Organization", name: m.company }
        : undefined,
    })),
  };

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }}
      />
      <nav className={styles.nav}>
        <a href="/" className={styles.brand}>
          Network<span>X</span>
        </a>
        <div className={styles.navActions}>
          <button onClick={copy}>
            <FontAwesomeIcon icon={faCopy} />
            {copied ? "Copied" : "Copy link"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faShareNodes} />
            WhatsApp
          </a>
        </div>
      </nav>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>NETWORKX PARTNER COMMUNITY</div>
          <div className={styles.titleRow}>
            {circle.logo ? (
              <img src={circle.logo} alt={`${circle.name} logo`} />
            ) : (
              <div className={styles.logoFallback}>
                {circle.name?.charAt(0)}
              </div>
            )}
            <div>
              <h1>{circle.name}</h1>
              <p>
                <FontAwesomeIcon icon={faLocationDot} />
                {[circle.city, circle.state, circle.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>
          <div className={styles.description}>
            {circle.description ||
              `A trusted community of business leaders and professionals on NetworkX.`}
          </div>
          <div className={styles.stats}>
            <FontAwesomeIcon icon={faUsers} />
            <strong>{circle.active_members}</strong> active members
          </div>
        </div>
        {circle.leader && (
          <aside className={styles.leader}>
            <div className={styles.avatar}>
              {circle.leader.avatar_url ? (
                <img
                  src={circle.leader.avatar_url}
                  alt={`${circle.leader.name}, Community Leader`}
                />
              ) : (
                circle.leader.name?.charAt(0)
              )}
            </div>
            <div>
              <span>
                <FontAwesomeIcon icon={faCrown} /> Community Leader
              </span>
              <strong>{circle.leader.name}</strong>
              <small>
                {[
                  circle.leader.designation || circle.leader.profession,
                  circle.leader.company,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </div>
          </aside>
        )}
      </header>
      <section className={styles.roster}>
        <div className={styles.sectionHead}>
          <div>
            <span>COMMUNITY ROSTER</span>
            <h2>Meet the members</h2>
          </div>
          <p>Connect with this community by joining NetworkX.</p>
        </div>
        <div className={styles.grid}>
          {circle.members.map((member: any) => (
            <article className={styles.member} key={member.id}>
              <div className={styles.memberAvatar}>
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={`${member.name} profile photo`}
                  />
                ) : (
                  member.name?.charAt(0)
                )}
              </div>
              {member.is_community_leader && (
                <span className={styles.leaderBadge}>
                  <FontAwesomeIcon icon={faCrown} /> Leader
                </span>
              )}
              <h3>{member.name}</h3>
              <p>
                {member.headline ||
                  member.designation ||
                  member.profession ||
                  "NetworkX Member"}
              </p>
              {member.company && (
                <small>
                  <FontAwesomeIcon icon={faBuilding} />
                  {member.company}
                </small>
              )}
              <small>
                <FontAwesomeIcon icon={faLocationDot} />
                {[member.city, member.country].filter(Boolean).join(", ")}
              </small>
              {member.username && (
                <a href={`/profile?u=${encodeURIComponent(member.username)}`}>
                  View profile <FontAwesomeIcon icon={faArrowRight} />
                </a>
              )}
            </article>
          ))}
        </div>
      </section>
      <section className={styles.cta}>
        <div>
          <span>GROW WITH THE COMMUNITY</span>
          <h2>Ready to join {circle.name}?</h2>
          <p>
            Join NetworkX to connect, collaborate and grow with trusted business
            communities.
          </p>
        </div>
        <div>
          <a className={styles.secondary} href="/pricing">
            Explore NetworkX
          </a>
          <a
            className={styles.primary}
            href={`/join/plans?circle=${encodeURIComponent(circle.public_slug)}`}
          >
            Join Community <FontAwesomeIcon icon={faArrowRight} />
          </a>
        </div>
      </section>
      <footer className={styles.footer}>
        NetworkX · Learn. Build. Evolve.{" "}
        <span>Public roster shows professional information only.</span>
      </footer>
    </main>
  );
}
