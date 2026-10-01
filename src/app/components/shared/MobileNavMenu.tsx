"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

// The phone menu is a <details> element, which stays open after a link is
// tapped (it never learns that navigation happened) and sat on top of the
// page being navigated to. Close it on any link tap, on a tap outside it,
// and on Escape.
export default function MobileNavMenu() {
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => { if (ref.current) ref.current.open = false; };

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details className="mobile-menu" ref={ref}>
      <summary aria-label="Open navigation"><i /><i /></summary>
      <nav onClick={(e) => { if ((e.target as HTMLElement).closest("a")) close(); }}>
        <a href="/#top">Home</a>
        <Link href="/about">About</Link>
        <a href="/#solutions">Solutions</a>
        <a href="/#community">Community</a>
        <Link href="/resources">Resources</Link>
        <Link href="/pricing">Pricing</Link>
        <a href="/#contact">Contact</a>
        <a className="mobile-login" href="/login">Log in</a>
        <Link className="mobile-join" href="/pricing">Join NetworkX</Link>
      </nav>
    </details>
  );
}
