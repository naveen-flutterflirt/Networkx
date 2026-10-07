"use client";
import { useState, useEffect, useCallback } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BASE = `${BASE_URL}/v1`;

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nia_access_token");
}

function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nia_refresh_token");
}

function saveTokens(access: string, refresh: string) {
  localStorage.setItem("nia_access_token", access);
  localStorage.setItem("nia_refresh_token", refresh);
}

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const d = data?.data ?? data;
    if (d.access_token) {
      saveTokens(d.access_token, d.refresh_token ?? refresh);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function apiFetch(
  path: string,
  opts: RequestInit = {},
  retry = true,
): Promise<any> {
  const t = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) || {}),
  };
  if (t) headers["Authorization"] = `Bearer ${t}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch(path, opts, false);
    // Refresh failed — redirect to login
    localStorage.removeItem("nia_access_token");
    localStorage.removeItem("nia_refresh_token");
    localStorage.removeItem("nia_one_user");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.detail || data?.message || "Request failed");
  return data?.data ?? data;
}

export function useFetch<T = any>(path: string | null, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((x) => x + 1), []);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    if (!getToken()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch(path)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps]);

  return { data, loading, error, refetch };
}
