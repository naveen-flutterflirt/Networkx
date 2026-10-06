"use client";
import { useState, useEffect } from "react";
import PublicProfileView from "./PublicProfileView";

// Static export (no SSR) — there is no server to match dynamic path
// segments like /profile/[username] at request time, only whatever
// paths were pre-built, which is impossible for usernames that don't
// exist until runtime. So the identifier is a query param, not a path
// segment: /profile?u=<username>. ?id=<doc id> is still read as a
// fallback so links shared before this fix keep working.
export default function PublicProfileRoute() {
  const [identifier, setIdentifier] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIdentifier(params.get("u") || params.get("id"));
  }, []);
  if (identifier === null) return null;
  return <PublicProfileView identifier={identifier || ""} />;
}
