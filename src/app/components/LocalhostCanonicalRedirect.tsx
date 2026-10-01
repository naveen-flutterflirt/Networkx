"use client";

import { useEffect } from "react";

export default function LocalhostCanonicalRedirect() {
  useEffect(() => {
    if (window.location.hostname !== "127.0.0.1") return;

    const canonicalUrl = new URL(window.location.href);
    canonicalUrl.hostname = "localhost";
    window.location.replace(canonicalUrl.toString());
  }, []);

  return null;
}
