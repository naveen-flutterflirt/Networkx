"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// The phone menu is a <details> element, which stays open after a link is
// tapped (it never learns that navigation happened) and sat on top of the
// page being navigated to. Close it on any link tap, on a tap outside it,
// and on Escape.
export default function MobileNavMenu() {
  const pathname = usePathname() || "";
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details className="mobile-menu" ref={ref}>
      <summary aria-label="Open navigation">
        <i />
        <i />
      </summary>
      <nav
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) close();
        }}
      >
        <Link
          href="/about"
          style={{
            boxShadow: pathname.includes("/about") ? "0 2px 0 0 #a86e45" : "none",
            paddingBottom: "4px",
            display: "inline-block",
            width: "fit-content"
          }}
        >
          About
        </Link>
        <Link
          href="/#solutions"
          style={{
            boxShadow: "none",
            paddingBottom: "4px",
            display: "inline-block",
            width: "fit-content"
          }}
        >
          Solutions
        </Link>
        <Link
          href="/#community"
          style={{
            boxShadow: "none",
            paddingBottom: "4px",
            display: "inline-block",
            width: "fit-content"
          }}
        >
          Community
        </Link>
        <Link
          href="/resources"
          style={{
            boxShadow: pathname.includes("/resources") ? "0 2px 0 0 #a86e45" : "none",
            paddingBottom: "4px",
            display: "inline-block",
            width: "fit-content"
          }}
        >
          Resources
        </Link>
        <Link
          href="/pricing"
          style={{
            boxShadow: pathname.includes("/pricing") ? "0 2px 0 0 #a86e45" : "none",
            paddingBottom: "4px",
            display: "inline-block",
            width: "fit-content"
          }}
        >
          Pricing
        </Link>
        <Link
          href="/#contact"
          style={{
            boxShadow: "none",
            paddingBottom: "4px",
            display: "inline-block",
            width: "fit-content"
          }}
        >
          Contact
        </Link>
        <Link className="mobile-login" href="/login">
          Log in
        </Link>
        <Link className="mobile-join" href="/pricing">
          Join NetworkX
        </Link>
      </nav>
    </details>
  );
}
