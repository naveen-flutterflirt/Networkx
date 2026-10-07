"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import MobileNavMenu from "./MobileNavMenu";

type LocalImageProps = React.ComponentPropsWithoutRef<"img"> & {
  priority?: boolean;
};

// Same local-preview <img> shim used on the home page — avoids depending
// on the Cloudflare Images binding, which is only available in the
// hosted runtime.
function Image({ priority, ...props }: LocalImageProps) {
  return <img {...props} fetchPriority={priority ? "high" : undefined} />;
}

// Real, shared site header — extracted verbatim from the home page's
// inline markup, which was the only place with the actual header (about/
// pricing had none at all; insights used a separate, different
// InsightsHeader component). Uses relative anchors (#top, #solutions,
// etc.) for same-page sections on the home page itself; on other pages
// these correctly navigate back to the home page's sections since they
// resolve relative to whatever page is currently rendered — no change
// needed there, Next.js/browser anchor resolution handles it.
export default function Header() {
  const pathname = usePathname() || "";
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    setActiveHash(window.location.hash);
    const handleHashChange = () => setActiveHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  
  return (
    <header
      className="site-header"
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "10px 40px",
        background: "#fffcf8",
        width: "100%",
        boxSizing: "border-box",
        position: "fixed",
        top: 0,
        zIndex: 100,
        borderBottom: "1px solid rgba(163, 109, 66, 0.1)",
        boxShadow: "0 4px 30px rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          maxWidth: "1300px",
        }}
      >
        <a href="/" className="logo-link" aria-label="NetworkX home">
          <div style={{ display: "flex", alignItems: "center" }}>
            <Image
              src="/brand/networkx-logo-header.png"
              alt="NetworkX Logo"
              style={{ height: "40px", width: "auto", filter: "invert(1) hue-rotate(180deg)" }}
              className="header-logo-image"
            />
          </div>
        </a>
        <nav
          className="desktop-nav hidden md:flex"
          aria-label="Primary navigation"
          style={{ gap: "32px", fontWeight: "500", fontSize: "15px", alignItems: "center" }}
        >
          <Link
            href="/about"
            style={{
              color: "#131b23",
              boxShadow: pathname.includes("/about") ? "0 2px 0 0 #a86e45" : "none",
              paddingBottom: "4px",
              transition: "box-shadow 0.2s"
            }}
          >
            About
          </Link>
          <Link
            href="/#solutions"
            style={{
              color: "#131b23",
              boxShadow: pathname === "/" && activeHash === "#solutions" ? "0 2px 0 0 #a86e45" : "none",
              paddingBottom: "4px",
              transition: "box-shadow 0.2s"
            }}
          >
            Solutions
          </Link>
          <Link
            href="/#community"
            style={{
              color: "#131b23",
              boxShadow: pathname === "/" && activeHash === "#community" ? "0 2px 0 0 #a86e45" : "none",
              paddingBottom: "4px",
              transition: "box-shadow 0.2s"
            }}
          >
            Community
          </Link>
          <Link
            href="/resources"
            style={{
              color: "#131b23",
              boxShadow: pathname.includes("/resources") ? "0 2px 0 0 #a86e45" : "none",
              paddingBottom: "4px",
              transition: "box-shadow 0.2s"
            }}
          >
            Resources
          </Link>
          <Link
            href="/pricing"
            style={{
              color: "#131b23",
              boxShadow: pathname.includes("/pricing") ? "0 2px 0 0 #a86e45" : "none",
              paddingBottom: "4px",
              transition: "box-shadow 0.2s"
            }}
          >
            Pricing
          </Link>
          <Link
            href="/#contact"
            style={{
              color: "#131b23",
              boxShadow: pathname === "/" && activeHash === "#contact" ? "0 2px 0 0 #a86e45" : "none",
              paddingBottom: "4px",
              transition: "box-shadow 0.2s"
            }}
          >
            Contact
          </Link>
        </nav>
        <div
          className="header-actions hidden md:flex"
          style={{ alignItems: "center", gap: "12px" }}
        >
          <a
            className="login-link"
            href="/login"
            style={{
              color: "#131b23",
              background: "#e9dbcf",
              border: "none",
              padding: "6px 18px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              transition: "background 0.2s",
            }}
          >
            Log in
          </a>
          <Link
            className="button button-small"
            href="/pricing"
            style={{
              background: "#131b23",
              color: "#fff",
              border: "none",
              padding: "6px 20px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "600",
              transition: "background 0.2s",
            }}
          >
            Join NetworkX
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      </div>
      <MobileNavMenu />
    </header>
  );
}
