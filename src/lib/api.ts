// ── NIA One API Client ─────────────────────────────────────────────────────
// All calls go through here — never call fetch() directly in components

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Lightweight client-side GET cache ───────────────────────────────────────
// Server-side caching (app.core.cache on the backend) makes repeated reads
// cheap to *compute*, but the client still pays a full network round trip
// every time. This skips the request entirely for data that doesn't change
// on every call — profile/avatar, dashboard & profile summaries, and mostly-
// static reference lists (territories, tiers, master data, badges).
//
// Caches the in-flight PROMISE, not just the resolved value — so if two
// components both call the same cached endpoint in the same tick (e.g. two
// widgets mounting together), the second one reuses the first's request
// instead of firing a duplicate, with no extra wiring needed at the call site.
//
// Only ever wrap idempotent GETs. Any endpoint that's cached here and can
// go stale from a mutation gets explicitly invalidated right after that
// mutation succeeds — see clientCache.invalidate() calls below.
const _clientCache = new Map<
  string,
  { expires: number; promise: Promise<any> }
>();

const clientCache = {
  get: (
    key: string,
    ttlMs: number,
    fetcher: () => Promise<any>,
  ): Promise<any> => {
    const hit = _clientCache.get(key);
    if (hit && hit.expires > Date.now()) return hit.promise;
    const promise = fetcher().catch((err) => {
      _clientCache.delete(key);
      throw err;
    });
    _clientCache.set(key, { expires: Date.now() + ttlMs, promise });
    return promise;
  },
  // Removes every cached entry whose key starts with `prefix` — call this
  // right after a mutation that could make those entries stale.
  invalidate: (prefix: string) => {
    for (const key of _clientCache.keys()) {
      if (key.startsWith(prefix)) _clientCache.delete(key);
    }
  },
};

// ── Token Store ────────────────────────────────────────────────────────────
export const TokenStore = {
  // Real "Remember me" (was a decorative checkbox with no wiring at all —
  // checked or not, login always persisted forever via localStorage).
  // Checked -> localStorage (survives browser restart). Unchecked ->
  // sessionStorage (cleared when the tab/window closes). Reads check both,
  // since after login we don't otherwise know which one was used.
  getAccess: () =>
    localStorage.getItem("nia_access_token") ||
    sessionStorage.getItem("nia_access_token"),
  getRefresh: () =>
    localStorage.getItem("nia_refresh_token") ||
    sessionStorage.getItem("nia_refresh_token"),
  setTokens: (access: string, refresh: string, remember: boolean = true) => {
    const store = remember ? localStorage : sessionStorage;
    // Clear the other storage first so a later "remember me" toggle
    // between logins can't leave a stale copy of the token sitting in
    // both places at once.
    const other = remember ? sessionStorage : localStorage;
    other.removeItem("nia_access_token");
    other.removeItem("nia_refresh_token");
    other.removeItem("nia_user");
    store.setItem("nia_access_token", access);
    store.setItem("nia_refresh_token", refresh);
  },
  setUser: (user: object, remember: boolean = true) => {
    (remember ? localStorage : sessionStorage).setItem(
      "nia_user",
      JSON.stringify(user),
    );
  },
  getUser: () => {
    try {
      return JSON.parse(
        localStorage.getItem("nia_user") ||
          sessionStorage.getItem("nia_user") ||
          "null",
      );
    } catch {
      return null;
    }
  },
  // Pulls the server's current copy of the user (email_verified,
  // membership_status, ...) into the cache, writing back to whichever
  // storage already holds it so "remember me" behaviour is unchanged.
  // Returns the fresh user, or null if the server couldn't be reached —
  // callers should then fall back to the cached copy, not lock the user out.
  refreshUser: async () => {
    try {
      const fresh = await apiFetch("/v1/auth/me", {}, true);
      const store = localStorage.getItem("nia_user")
        ? localStorage
        : sessionStorage;
      store.setItem("nia_user", JSON.stringify(fresh));
      window.dispatchEvent(new Event("nia:user-updated"));
      return fresh;
    } catch {
      return null;
    }
  },
  clear: () => {
    for (const store of [localStorage, sessionStorage]) {
      store.removeItem("nia_access_token");
      store.removeItem("nia_refresh_token");
      store.removeItem("nia_user");
    }
  },
  // ── Impersonation ("Login As") ──────────────────────────────────────────
  // Deliberately does NOT touch the refresh token slot with a usable value
  // during impersonation — there's no refresh token for an impersonated
  // session by design (backend only issues a short-lived access token), so
  // the session can't silently renew itself into an indefinite one. When it
  // expires, exitImpersonation() below runs instead of a full logout.
  isImpersonating: () => localStorage.getItem("nia_impersonating") === "1",
  startImpersonation: (access: string, user: object) => {
    localStorage.setItem(
      "nia_orig_access",
      localStorage.getItem("nia_access_token") || "",
    );
    localStorage.setItem(
      "nia_orig_refresh",
      localStorage.getItem("nia_refresh_token") || "",
    );
    localStorage.setItem(
      "nia_orig_user",
      localStorage.getItem("nia_user") || "",
    );
    localStorage.setItem("nia_impersonating", "1");
    localStorage.setItem("nia_access_token", access);
    localStorage.removeItem("nia_refresh_token");
    localStorage.setItem("nia_user", JSON.stringify(user));
  },
  exitImpersonation: () => {
    const origAccess = localStorage.getItem("nia_orig_access");
    const origRefresh = localStorage.getItem("nia_orig_refresh");
    const origUser = localStorage.getItem("nia_orig_user");
    if (origAccess) localStorage.setItem("nia_access_token", origAccess);
    if (origRefresh) localStorage.setItem("nia_refresh_token", origRefresh);
    if (origUser) localStorage.setItem("nia_user", origUser);
    localStorage.removeItem("nia_orig_access");
    localStorage.removeItem("nia_orig_refresh");
    localStorage.removeItem("nia_orig_user");
    localStorage.removeItem("nia_impersonating");
  },
};

// ── Token refresh (called automatically on 401) ───────────────────────────
let _refreshing: Promise<boolean> | null = null; // prevent concurrent refresh calls

async function tryRefresh(): Promise<boolean> {
  // If already refreshing, wait for that to finish
  if (_refreshing) return _refreshing;
  _refreshing = (async () => {
    const refresh_token = TokenStore.getRefresh();
    if (!refresh_token) return false;
    try {
      const res = await fetch(`${BASE_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      const data = json?.data ?? json;
      if (data?.access_token) {
        TokenStore.setTokens(
          data.access_token,
          data.refresh_token ?? refresh_token,
        );
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      _refreshing = null;
    }
  })();
  return _refreshing;
}

// ── Base fetch ─────────────────────────────────────────────────────────────
// Automatically refreshes token on 401 — no manual refresh needed
async function apiFetch(
  path: string,
  options: RequestInit = {},
  withAuth = false,
  _retry = true,
  returnFull = false,
): Promise<any> {
  // FormData (e.g. CirclesAPI.previewBatch's CSV upload) must NOT get a
  // forced application/json header — the browser needs to set its own
  // multipart/form-data boundary, which a hardcoded Content-Type here
  // would override and break.
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (withAuth) {
    const token = TokenStore.getAccess();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  // Never leave the whole page on an infinite loading spinner when the API,
  // Firestore or its OAuth provider is unreachable. Preserve a caller-provided
  // abort signal while enforcing a practical application-wide upper bound.
  const controller = new AbortController();
  // Firestore can take 30–60 seconds on the first request after local startup
  // while Google credentials and gRPC channels warm up. Ninety seconds
  // still prevents an endless spinner without aborting a healthy cold login.
  const timeout = setTimeout(() => controller.abort(), 90_000);
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else
      options.signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
  }
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === "AbortError")
      throw new Error(
        "The server is taking too long to respond. Check the backend connection and try again.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  // ── Auto-refresh on 401 ────────────────────────────────────────────────
  if (res.status === 401 && withAuth && _retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // Retry the original request with new token
      return apiFetch(path, options, withAuth, false, returnFull);
    }
    // Refresh failed — during impersonation this just means the bounded
    // session expired, so return to the real super_admin session instead
    // of logging out entirely.
    if (TokenStore.isImpersonating()) {
      TokenStore.exitImpersonation();
      if (typeof window !== "undefined")
        window.location.href = "/dashboard/super/users";
      throw new Error(
        "Impersonation session expired — returned to your account.",
      );
    }
    TokenStore.clear();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please log in again.");
  }

  const json = await res.json();
  if (!res.ok) {
    // Keep the server's machine-readable code/details on the error so
    // callers can react to specific cases (e.g. EMAIL_NOT_VERIFIED on the
    // login screen) instead of pattern-matching the message text.
    const err: any = new Error(
      json?.error?.message || json?.detail || "Something went wrong",
    );
    err.code = json?.error?.code;
    err.details = json?.error?.details;
    throw err;
  }
  const method = (options.method || "GET").toUpperCase();
  if (
    withAuth &&
    !["GET", "HEAD", "OPTIONS"].includes(method) &&
    typeof window !== "undefined"
  ) {
    clientCache.invalidate("dashboard:summary");
    clientCache.invalidate("profile:");
    window.dispatchEvent(new Event("nia:dashboard-updated"));
  }
  if (returnFull) return json;
  return json.data ?? json;
}

// Same request as apiFetch, but preserves the response's `meta` (page,
// page_size, has_more) instead of discarding it — apiFetch's plain
// `json.data ?? json` unwrap drops `meta` entirely, which is fine for
// the many callers that only want the items, but leaves a real
// paginated list with no way to know if there's a next page. Returns
// {items, meta} so callers can wire up the shared Pagination component.
async function apiFetchPaginated(
  path: string,
  options: RequestInit = {},
  withAuth = false,
): Promise<{ items: any[]; meta: any }> {
  const json = await apiFetch(path, options, withAuth, true, true);
  return { items: json.data ?? [], meta: json.meta ?? {} };
}

// ── Query string helper ────────────────────────────────────────────────────
function qs(params: Record<string, any> = {}): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ── Auth API ───────────────────────────────────────────────────────────────
export const AuthAPI = {
  login: async (email: string, password: string, remember: boolean = true) => {
    const data = await apiFetch("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    TokenStore.setTokens(data.access_token, data.refresh_token, remember);
    TokenStore.setUser(data.user, remember);
    return data;
  },
  sendOtp: async (email: string) =>
    apiFetch("/v1/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verifyOtp: async (email: string, otp: string, remember: boolean = true) => {
    const data = await apiFetch("/v1/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
    TokenStore.setTokens(data.access_token, data.refresh_token, remember);
    TokenStore.setUser(data.user, remember);
    return data;
  },
  forgotPassword: async (email: string) =>
    apiFetch("/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: async (token: string, new_password: string) =>
    apiFetch("/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),
  sendVerificationEmail: () =>
    apiFetch("/v1/auth/send-verification-email", { method: "POST" }, true),
  // For someone stuck on the login screen (no session yet): needs the
  // account's password so it can't be used to email other people.
  resendVerification: (email: string, password: string) =>
    apiFetch("/v1/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  verifyEmail: (token: string) =>
    apiFetch("/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  logout: async () => {
    try {
      await apiFetch("/v1/auth/logout", { method: "POST" }, true);
    } finally {
      TokenStore.clear();
    }
  },
  me: async () => apiFetch("/v1/auth/me", {}, true),
  refresh: async () => {
    const refresh_token = TokenStore.getRefresh();
    if (!refresh_token) throw new Error("No refresh token");
    const data = await apiFetch("/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    });
    localStorage.setItem("nia_access_token", data.access_token);
    return data;
  },
};

// ── Super Admin API ────────────────────────────────────────────────────────
export const SuperAdminAPI = {
  getUsers: async (p?: {
    role?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
    search?: string;
    email_verified?: boolean;
    country?: string;
    city?: string;
  }) => apiFetch(`/v1/super-admin/users${qs(p)}`, {}, true),
  getUserStats: () => apiFetch("/v1/super-admin/users/stats", {}, true),
  getRegistrationStats: () =>
    apiFetch("/v1/super-admin/users/registration-stats", {}, true),
  getUser: (id: string) => apiFetch(`/v1/super-admin/users/${id}`, {}, true),
  createUser: (body: object) =>
    apiFetch(
      "/v1/super-admin/users",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  updateRole: (id: string, role: string, reason: string) =>
    apiFetch(
      `/v1/super-admin/users/${id}/role`,
      { method: "PATCH", body: JSON.stringify({ role, reason }) },
      true,
    ),
  updateStatus: (id: string, is_active: boolean, reason: string) =>
    apiFetch(
      `/v1/super-admin/users/${id}/status`,
      { method: "PATCH", body: JSON.stringify({ is_active, reason }) },
      true,
    ),
  forceLogout: (id: string) =>
    apiFetch(`/v1/super-admin/users/${id}/logout`, { method: "POST" }, true),
  getAuditLogs: (p?: {
    module?: string;
    action?: string;
    actor_id?: string;
    page?: number;
    page_size?: number;
  }) => apiFetch(`/v1/super-admin/audit${qs(p)}`, {}, true),
  getToggles: () => apiFetch("/v1/super-admin/toggles", {}, true),
  updateToggle: (key: string, is_enabled: boolean) =>
    apiFetch(
      `/v1/super-admin/toggles/${key}`,
      { method: "PUT", body: JSON.stringify({ is_enabled }) },
      true,
    ),
  getHealth: () => apiFetch("/v1/super-admin/health", {}, true),
  broadcast: (body: object) =>
    apiFetch(
      "/v1/super-admin/broadcast",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  impersonate: (userId: string) =>
    apiFetch(`/v1/super-admin/impersonate/${userId}`, { method: "POST" }, true),
};

// ── Social Automation API (Super Admin) ─────────────────────────────────────
export const SocialAutomationAPI = {
  getConnectionsStatus: () =>
    apiFetch("/v1/social-automation/connections/status", {}, true),
  getFacebookConnectUrl: () =>
    apiFetch("/v1/social-automation/connections/facebook/url", {}, true),
  getFacebookSessionPages: (sessionId: string) =>
    apiFetch(
      `/v1/social-automation/connections/facebook/session/${sessionId}/pages`,
      {},
      true,
    ),
  selectFacebookPage: (body: object) =>
    apiFetch(
      "/v1/social-automation/connections/facebook/select-page",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  getYoutubeConnectUrl: () =>
    apiFetch("/v1/social-automation/connections/youtube/url", {}, true),
  disconnectPlatform: (platform: string) =>
    apiFetch(
      `/v1/social-automation/connections/${platform}`,
      { method: "DELETE" },
      true,
    ),

  getVideoUploadUrl: (body: object) =>
    apiFetch(
      "/v1/social-automation/uploads/video-url",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  createDraft: (body: object) =>
    apiFetch(
      "/v1/social-automation/drafts",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  listDrafts: (p?: { status?: string; page?: number; page_size?: number }) =>
    apiFetchPaginated(`/v1/social-automation/drafts${qs(p)}`, {}, true),
  getDraft: (id: string) =>
    apiFetch(`/v1/social-automation/drafts/${id}`, {}, true),
  deleteDraft: (id: string) =>
    apiFetch(`/v1/social-automation/drafts/${id}`, { method: "DELETE" }, true),
  generateContent: (id: string, body: object) =>
    apiFetch(
      `/v1/social-automation/drafts/${id}/generate`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  updateDraftContent: (id: string, body: object) =>
    apiFetch(
      `/v1/social-automation/drafts/${id}/content`,
      { method: "PATCH", body: JSON.stringify(body) },
      true,
    ),
  submitForApproval: (id: string, body: object) =>
    apiFetch(
      `/v1/social-automation/drafts/${id}/submit`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),

  listApprovals: (p?: { status?: string; page?: number; page_size?: number }) =>
    apiFetchPaginated(`/v1/social-automation/approvals${qs(p)}`, {}, true),
  getApproval: (id: string) =>
    apiFetch(`/v1/social-automation/approvals/${id}`, {}, true),
  approveApproval: (id: string, body: object) =>
    apiFetch(
      `/v1/social-automation/approvals/${id}/approve`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  rejectApproval: (id: string, body: object) =>
    apiFetch(
      `/v1/social-automation/approvals/${id}/reject`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  cancelSchedule: (id: string, body: object = {}) =>
    apiFetch(
      `/v1/social-automation/approvals/${id}/cancel-schedule`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),

  getPublishLog: (p?: {
    platform?: string;
    draft_id?: string;
    page?: number;
    page_size?: number;
  }) =>
    apiFetchPaginated(`/v1/social-automation/publish-log${qs(p)}`, {}, true),
};

// ── Blog API ─────────────────────────────────────────────────────────────
export const BlogAPI = {
  // Public — no auth
  publicList: (p?: { page?: number; page_size?: number }) =>
    apiFetchPaginated(`/v1/blog/public${qs(p)}`, {}, false),
  publicGet: (slug: string) => apiFetch(`/v1/blog/public/${slug}`, {}, false),

  // Admin
  createDraft: (body: object) =>
    apiFetch(
      "/v1/blog/drafts",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  listDrafts: (p?: { status?: string; page?: number; page_size?: number }) =>
    apiFetchPaginated(`/v1/blog/drafts${qs(p)}`, {}, true),
  getDraft: (id: string) => apiFetch(`/v1/blog/drafts/${id}`, {}, true),
  generateContent: (id: string, body: object) =>
    apiFetch(
      `/v1/blog/drafts/${id}/generate`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  updateContent: (id: string, body: object) =>
    apiFetch(
      `/v1/blog/drafts/${id}/content`,
      { method: "PATCH", body: JSON.stringify(body) },
      true,
    ),
  approve: (id: string) =>
    apiFetch(`/v1/blog/drafts/${id}/approve`, { method: "POST" }, true),
  reject: (id: string, body: object) =>
    apiFetch(
      `/v1/blog/drafts/${id}/reject`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
};

// ── Auto Campaign API (Super Admin) ─────────────────────────────────────────
export const CampaignAPI = {
  getSettings: () => apiFetch("/v1/campaign/settings", {}, true),
  updateSettings: (body: object) =>
    apiFetch(
      "/v1/campaign/settings",
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),

  generateTopics: (body: object) =>
    apiFetch(
      "/v1/campaign/topics/generate",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  listTopics: (p?: { status?: string; page?: number; page_size?: number }) =>
    apiFetchPaginated(`/v1/campaign/topics${qs(p)}`, {}, true),
  runTopic: (body: object) =>
    apiFetch(
      "/v1/campaign/topics/run",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),

  listApprovals: (p?: { status?: string; page?: number; page_size?: number }) =>
    apiFetchPaginated(`/v1/campaign/approvals${qs(p)}`, {}, true),
  getApproval: (id: string) =>
    apiFetch(`/v1/campaign/approvals/${id}`, {}, true),
  approve: (id: string, body: object) =>
    apiFetch(
      `/v1/campaign/approvals/${id}/approve`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  reject: (id: string, body: object) =>
    apiFetch(
      `/v1/campaign/approvals/${id}/reject`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
};

// ── Territories API ────────────────────────────────────────────────────────
export const TerritoriesAPI = {
  list: (p?: { page?: number; page_size?: number }) =>
    apiFetch(`/v1/territories${qs(p)}`, {}, true),
  get: (id: string) => apiFetch(`/v1/territories/${id}`, {}, true),
  stats: (id: string) => apiFetch(`/v1/territories/${id}/stats`, {}, true),
  groups: (id: string, p?: { page?: number }) =>
    apiFetch(`/v1/territories/${id}/groups${qs(p)}`, {}, true),
  create: (body: object) =>
    apiFetch(
      "/v1/territories",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  update: (id: string, body: object) =>
    apiFetch(
      `/v1/territories/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  delete: (id: string) =>
    apiFetch(`/v1/territories/${id}`, { method: "DELETE" }, true),
  // Public — no auth, for the registration/pricing form's city dropdown
  // City dropdown for registration/pricing — HQ-configured, changes
  // rarely. Cached 10min client-side rather than re-fetched on every
  // visit to those forms.
  public: () =>
    clientCache.get("territories:public", 10 * 60_000, () =>
      apiFetch("/v1/territories/public/list", {}, false),
    ),
};

// ── Groups API ─────────────────────────────────────────────────────────────
export const GroupsAPI = {
  list: (p?: {
    q?: string;
    territory_id?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }) => apiFetch(`/v1/groups${qs(p)}`, {}, true),
  get: (id: string) => apiFetch(`/v1/groups/${id}`, {}, true),
  stats: (id: string) => apiFetch(`/v1/groups/${id}/stats`, {}, true),
  members: (id: string, p?: { page?: number; page_size?: number }) =>
    apiFetch(`/v1/groups/${id}/members${qs(p)}`, {}, true),
  meetings: (id: string, p?: { page?: number }) =>
    apiFetch(`/v1/groups/${id}/meetings${qs(p)}`, {}, true),
  referrals: (id: string, p?: { page?: number }) =>
    apiFetch(`/v1/groups/${id}/referrals${qs(p)}`, {}, true),
  create: (body: object) =>
    apiFetch(
      "/v1/groups",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  update: (id: string, body: object) =>
    apiFetch(
      `/v1/groups/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  delete: (id: string) =>
    apiFetch(`/v1/groups/${id}`, { method: "DELETE" }, true),
};

// ── Members API ────────────────────────────────────────────────────────────
export const MembersAPI = {
  me: () => apiFetch("/v1/members/me", {}, true),
  list: (p?: {
    group_id?: string;
    territory_id?: string;
    status?: string;
    tier?: string;
    page?: number;
    page_size?: number;
  }) => apiFetch(`/v1/members${qs(p)}`, {}, true),
  exportList: (p?: {
    group_id?: string;
    territory_id?: string;
    status?: string;
    tier?: string;
    country?: string;
    state?: string;
    city?: string;
    search?: string;
  }) => apiFetch(`/v1/members/export${qs(p)}`, {}, true),
  get: (id: string) => apiFetch(`/v1/members/${id}`, {}, true),
  score: (id: string) => apiFetch(`/v1/members/${id}/score`, {}, true),
  referrals: (id: string, p?: { page?: number }) =>
    apiFetch(`/v1/members/${id}/referrals${qs(p)}`, {}, true),
  attendance: (id: string, p?: { page?: number }) =>
    apiFetch(`/v1/members/${id}/attendance${qs(p)}`, {}, true),
  backfillTiers: () =>
    apiFetch("/v1/members/backfill-tiers", { method: "POST" }, true),
  enroll: (body: object) =>
    apiFetch(
      "/v1/members/enroll",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  update: (id: string, body: object) =>
    apiFetch(
      `/v1/members/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  warn: (id: string, body: object) =>
    apiFetch(
      `/v1/members/${id}/warn`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  approve: (id: string) =>
    apiFetch(`/v1/members/${id}/approve`, { method: "POST" }, true),
  // Tier/benefit config — HQ-managed, changes rarely. Cached 10min
  // client-side, invalidated on any of the admin mutations below (all
  // of which touch this same underlying data, so they share one prefix
  // with tiersPublic above).
  tiers: () =>
    clientCache.get("members:tiersPublic:tiers", 10 * 60_000, () =>
      apiFetch("/v1/members/tiers", {}, true),
    ),
  tiersPublic: () =>
    clientCache.get("members:tiersPublic", 10 * 60_000, () =>
      apiFetch("/v1/members/tiers/public", {}, false),
    ),
  // Which currency the pricing page should show — same IP-based India
  // detection register() uses to decide what's actually charged, so the
  // displayed price never drifts from the real one. Cached briefly (not
  // 10min like tiers — this is per-visitor, not shared config) purely to
  // avoid a duplicate call if both effects on the pricing page fire.
  pricingRegion: () =>
    clientCache.get("members:pricingRegion", 60_000, () =>
      apiFetch("/v1/members/pricing-region", {}, false),
    ),
  register: (body: object) =>
    apiFetch(
      "/v1/members/register",
      { method: "POST", body: JSON.stringify(body) },
      false,
    ),
  tier: (tier: string) => apiFetch(`/v1/members/tiers/${tier}`, {}, true),
  updateTier: (tier: string, body: object) =>
    apiFetch(
      `/v1/members/tiers/${tier}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("members:tiersPublic");
      return r;
    }),
  createTier: (body: object) =>
    apiFetch(
      "/v1/members/tiers",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("members:tiersPublic");
      return r;
    }),
  resetTier: (tier: string) =>
    apiFetch(`/v1/members/tiers/${tier}/reset`, { method: "POST" }, true).then(
      (r) => {
        clientCache.invalidate("members:tiersPublic");
        return r;
      },
    ),
  deleteTier: (tier: string) =>
    apiFetch(`/v1/members/tiers/${tier}`, { method: "DELETE" }, true).then(
      (r) => {
        clientCache.invalidate("members:tiersPublic");
        return r;
      },
    ),
  addBenefitRow: (feature_key: string) =>
    apiFetch(
      "/v1/members/tiers/benefits",
      { method: "POST", body: JSON.stringify({ feature_key }) },
      true,
    ).then((r) => {
      clientCache.invalidate("members:tiersPublic");
      return r;
    }),
  archiveBenefitRow: (feature_key: string) =>
    apiFetch(
      `/v1/members/tiers/benefits/${encodeURIComponent(feature_key)}`,
      { method: "DELETE" },
      true,
    ).then((r) => {
      clientCache.invalidate("members:tiersPublic");
      return r;
    }),
  restoreBenefitRow: (feature_key: string) =>
    apiFetch(
      `/v1/members/tiers/benefits/${encodeURIComponent(feature_key)}/restore`,
      { method: "POST" },
      true,
    ).then((r) => {
      clientCache.invalidate("members:tiersPublic");
      return r;
    }),
  spotlight: () => apiFetch("/v1/members/spotlight", {}, true),
  setSpotlight: (id: string, body: object) =>
    apiFetch(
      `/v1/members/${id}/spotlight`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
};

// ── Referrals API ──────────────────────────────────────────────────────────
export const ReferralsAPI = {
  list: (p?: {
    group_id?: string;
    direction?: "given" | "received";
    page?: number;
    page_size?: number;
  }) => apiFetch(`/v1/referrals${qs(p)}`, {}, true),
  stats: () => apiFetch("/v1/referrals/stats", {}, true),
  pipeline: () => apiFetch("/v1/referrals/pipeline", {}, true),
  get: (id: string) => apiFetch(`/v1/referrals/${id}`, {}, true),
  give: (body: object) =>
    apiFetch(
      "/v1/referrals",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("dashboard:summary");
      clientCache.invalidate("profile:");
      return r;
    }),
  updateStatus: (id: string, body: object) =>
    apiFetch(
      `/v1/referrals/${id}/status`,
      { method: "PATCH", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("dashboard:summary");
      clientCache.invalidate("profile:");
      return r;
    }),
  decide: (id: string, accept: boolean, notes?: string) =>
    apiFetch(
      `/v1/referrals/${id}/decision`,
      { method: "PATCH", body: JSON.stringify({ accept, notes }) },
      true,
    ).then((r) => {
      clientCache.invalidate("dashboard:summary");
      clientCache.invalidate("profile:");
      return r;
    }),
  delete: (id: string) =>
    apiFetch(`/v1/referrals/${id}`, { method: "DELETE" }, true).then((r) => {
      clientCache.invalidate("dashboard:summary");
      clientCache.invalidate("profile:");
      return r;
    }),
};

// ── Meetings API ───────────────────────────────────────────────────────────
export const MeetingsAPI = {
  list: (p?: {
    group_id?: string;
    territory_id?: string;
    status?: string;
    page?: number;
  }) => apiFetch(`/v1/meetings${qs(p)}`, {}, true),
  get: (id: string) => apiFetch(`/v1/meetings/${id}`, {}, true),
  create: (body: object) =>
    apiFetch(
      "/v1/meetings",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  update: (id: string, body: object) =>
    apiFetch(
      `/v1/meetings/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  delete: (id: string) =>
    apiFetch(`/v1/meetings/${id}`, { method: "DELETE" }, true),
  start: (id: string) =>
    apiFetch(`/v1/meetings/${id}/start`, { method: "POST" }, true),
  end: (id: string) =>
    apiFetch(`/v1/meetings/${id}/end`, { method: "POST" }, true),
  qr: (id: string) => apiFetch(`/v1/meetings/${id}/qr`, {}, true),
  attendance: (id: string) =>
    apiFetch(`/v1/meetings/${id}/attendance`, {}, true),
};

// ── Events API ─────────────────────────────────────────────────────────────
export const EventsAPI = {
  list: (p?: {
    q?: string;
    territory_id?: string;
    status?: string;
    event_type?: string;
    page?: number;
    page_size?: number;
  }) => apiFetch(`/v1/events${qs(p)}`, {}, true),
  get: (id: string) => apiFetch(`/v1/events/${id}`, {}, true),
  create: (body: object) =>
    apiFetch(
      "/v1/events",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  update: (id: string, body: object) =>
    apiFetch(
      `/v1/events/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  delete: (id: string) =>
    apiFetch(`/v1/events/${id}`, { method: "DELETE" }, true),
  register: (id: string, coupon_code?: string) =>
    apiFetch(
      `/v1/events/${id}/register`,
      {
        method: "POST",
        body: JSON.stringify(coupon_code ? { coupon_code } : {}),
      },
      true,
    ),
  cancelRegistration: (id: string) =>
    apiFetch(`/v1/events/${id}/register`, { method: "DELETE" }, true),
  attendees: (id: string) => apiFetch(`/v1/events/${id}/attendees`, {}, true),
  checkin: (id: string, qr_token: string) =>
    apiFetch(
      `/v1/events/${id}/checkin`,
      { method: "POST", body: JSON.stringify({ qr_token }) },
      true,
    ),
  // Coupons (Free vs Paid+Coupon RSVP flow)
  previewCoupon: (id: string, code: string) =>
    apiFetch(
      `/v1/events/${id}/coupons/${encodeURIComponent(code)}/preview`,
      { method: "POST" },
      true,
    ),
  createCoupon: (id: string, body: object) =>
    apiFetch(
      `/v1/events/${id}/coupons`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  listCoupons: (id: string) => apiFetch(`/v1/events/${id}/coupons`, {}, true),
  deactivateCoupon: (id: string, code: string) =>
    apiFetch(
      `/v1/events/${id}/coupons/${encodeURIComponent(code)}`,
      { method: "DELETE" },
      true,
    ),
};

// ── Payments API ───────────────────────────────────────────────────────────
export const PaymentsAPI = {
  createOrder: (body: object) =>
    apiFetch(
      "/v1/payments/order",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  verify: (body: object) =>
    apiFetch(
      "/v1/payments/verify",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  history: (p?: { page?: number; page_size?: number }) =>
    apiFetch(`/v1/payments/history${qs(p)}`, {}, true),
  outstanding: (p?: { page?: number }) =>
    apiFetch(`/v1/payments/outstanding${qs(p)}`, {}, true),
  remind: (id: string) =>
    apiFetch(`/v1/payments/remind/${id}`, { method: "POST" }, true),
  stats: () => apiFetch("/v1/payments/stats", {}, true),
  // Binary PDF, not JSON — can't go through apiFetch's json() parsing.
  // Fetches the file directly, then triggers a real browser download.
  downloadInvoice: async (paymentId: string) => {
    const token = TokenStore.getAccess();
    const res = await fetch(`${BASE_URL}/v1/payments/${paymentId}/invoice`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let message = "Could not download invoice";
      try {
        const j = await res.json();
        message = j?.error?.message || message;
      } catch {}
      throw new Error(message);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${paymentId.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

// ── Notifications API ──────────────────────────────────────────────────────
export const NotificationsAPI = {
  list: (p?: {
    page?: number;
    page_size?: number;
    type?: string;
    unread_only?: boolean;
  }) => apiFetch(`/v1/notifications${qs(p)}`, {}, true),
  count: () => apiFetch("/v1/notifications/count", {}, true),
  badgeCounts: () => apiFetch("/v1/notifications/badge-counts", {}, true),
  markRead: (id: string) =>
    apiFetch(`/v1/notifications/${id}/read`, { method: "PATCH" }, true),
  markAllRead: () =>
    apiFetch("/v1/notifications/read-all", { method: "POST" }, true),
  delete: (id: string) =>
    apiFetch(`/v1/notifications/${id}`, { method: "DELETE" }, true),
};

// ── Messages API ───────────────────────────────────────────────────────────
export const MessagesAPI = {
  conversations: (p?: { page?: number }) =>
    apiFetch(`/v1/messages${qs(p)}`, {}, true),
  start: (body: object) =>
    apiFetch(
      "/v1/messages",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  get: (conv_id: string, p?: { page?: number }) =>
    apiFetch(`/v1/messages/${conv_id}${qs(p)}`, {}, true),
  send: (conv_id: string, body: object) =>
    apiFetch(
      `/v1/messages/${conv_id}`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  markRead: (conv_id: string) =>
    apiFetch(`/v1/messages/${conv_id}/read`, { method: "PATCH" }, true),
  unreadCount: () => apiFetch("/v1/messages/unread-count", {}, true),
};

// ── Learning API ───────────────────────────────────────────────────────────
export const LearningAPI = {
  // Courses
  courses: (p?: { page?: number; page_size?: number }) =>
    apiFetch(`/v1/learning/courses${qs(p)}`, {}, true),
  getCourse: (id: string) => apiFetch(`/v1/learning/courses/${id}`, {}, true),
  createCourse: (body: object) =>
    apiFetch(
      "/v1/learning/courses",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  updateCourse: (id: string, body: object) =>
    apiFetch(
      `/v1/learning/courses/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  deleteCourse: (id: string) =>
    apiFetch(`/v1/learning/courses/${id}`, { method: "DELETE" }, true),
  addManager: (id: string, manager_id: string) =>
    apiFetch(
      `/v1/learning/courses/${id}/managers`,
      { method: "POST", body: JSON.stringify({ manager_id }) },
      true,
    ),
  removeManager: (id: string, managerId: string) =>
    apiFetch(
      `/v1/learning/courses/${id}/managers/${managerId}`,
      { method: "DELETE" },
      true,
    ),
  enroll: (id: string) =>
    apiFetch(`/v1/learning/courses/${id}/enroll`, { method: "POST" }, true),
  progress: (id: string, body: object) =>
    apiFetch(
      `/v1/learning/courses/${id}/progress`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  complete: (id: string) =>
    apiFetch(
      `/v1/learning/courses/${id}/complete`,
      { method: "POST" },
      true,
    ).then((r) => {
      clientCache.invalidate("dashboard:summary");
      return r;
    }),
  myCourses: () => apiFetch("/v1/learning/my", {}, true),

  // Sections
  sections: (courseId: string) =>
    apiFetch(`/v1/learning/courses/${courseId}/sections`, {}, true),
  createSection: (courseId: string, body: object) =>
    apiFetch(
      `/v1/learning/courses/${courseId}/sections`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  updateSection: (courseId: string, sectionId: string, body: object) =>
    apiFetch(
      `/v1/learning/courses/${courseId}/sections/${sectionId}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  deleteSection: (courseId: string, sectionId: string) =>
    apiFetch(
      `/v1/learning/courses/${courseId}/sections/${sectionId}`,
      { method: "DELETE" },
      true,
    ),

  // Lessons
  createLesson: (courseId: string, sectionId: string, body: object) =>
    apiFetch(
      `/v1/learning/courses/${courseId}/sections/${sectionId}/lessons`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  updateLesson: (lessonId: string, body: object) =>
    apiFetch(
      `/v1/learning/lessons/${lessonId}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  deleteLesson: (lessonId: string) =>
    apiFetch(`/v1/learning/lessons/${lessonId}`, { method: "DELETE" }, true),
  completeLesson: (lessonId: string) =>
    apiFetch(
      `/v1/learning/lessons/${lessonId}/complete`,
      { method: "POST" },
      true,
    ).then((r) => {
      clientCache.invalidate("dashboard:summary");
      return r;
    }),
  streamUrl: (lessonId: string) =>
    apiFetch(`/v1/learning/lessons/${lessonId}/stream`, {}, true),
  // Upload
  getUploadUrl: (body: object) =>
    apiFetch(
      "/v1/learning/upload-url",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  getCourseImageUploadUrl: (body: object) =>
    apiFetch(
      "/v1/learning/courses/image-upload-url",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  // Feedback
  submitFeedback: (courseId: string, body: object) =>
    apiFetch(
      `/v1/learning/courses/${courseId}/feedback`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  getFeedback: (courseId: string, p?: { page?: number; page_size?: number }) =>
    apiFetch(`/v1/learning/courses/${courseId}/feedback${qs(p)}`, {}, true),
  myFeedback: (courseId: string) =>
    apiFetch(`/v1/learning/courses/${courseId}/feedback/mine`, {}, true),
};

// ── Travel API ─────────────────────────────────────────────────────────────
export const TravelAPI = {
  list: (p?: { page?: number; page_size?: number }) =>
    apiFetch(`/v1/travel${qs(p)}`, {}, true),
  get: (id: string) => apiFetch(`/v1/travel/${id}`, {}, true),
  create: (body: object) =>
    apiFetch(
      "/v1/travel",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  update: (id: string, body: object) =>
    apiFetch(
      `/v1/travel/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  delete: (id: string) =>
    apiFetch(`/v1/travel/${id}`, { method: "DELETE" }, true),
  connect: (id: string) =>
    apiFetch(`/v1/travel/${id}/connect`, { method: "POST" }, true),
  intelligence: (id: string) =>
    apiFetch(`/v1/travel/${id}/intelligence`, {}, true),
};

// ── BizHub API ─────────────────────────────────────────────────────────────
export const BizHubAPI = {
  list: (p?: { category?: string; page?: number; page_size?: number }) =>
    apiFetch(`/v1/bizhub${qs(p)}`, {}, true),
  get: (id: string) => apiFetch(`/v1/bizhub/${id}`, {}, true),
  create: (body: object) =>
    apiFetch(
      "/v1/bizhub",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  update: (id: string, body: object) =>
    apiFetch(
      `/v1/bizhub/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  delete: (id: string) =>
    apiFetch(`/v1/bizhub/${id}`, { method: "DELETE" }, true),
  contact: (id: string, body: object) =>
    apiFetch(
      `/v1/bizhub/${id}/contact`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
};

// ── CRM API ────────────────────────────────────────────────────────────────
export const CrmAPI = {
  prospects: (p?: {
    territory_id?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }) => apiFetch(`/v1/crm/prospects${qs(p)}`, {}, true),
  getProspect: (id: string) => apiFetch(`/v1/crm/prospects/${id}`, {}, true),
  addProspect: (body: object) =>
    apiFetch(
      "/v1/crm/prospects",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  updateProspect: (id: string, body: object) =>
    apiFetch(
      `/v1/crm/prospects/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  updateStatus: (id: string, status: string) =>
    apiFetch(
      `/v1/crm/prospects/${id}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      true,
    ),
  deleteProspect: (id: string) =>
    apiFetch(`/v1/crm/prospects/${id}`, { method: "DELETE" }, true),
  pipeline: () => apiFetch("/v1/crm/pipeline", {}, true),
};

// ── Awards API ─────────────────────────────────────────────────────────────
export const AwardsAPI = {
  list: (p?: { page?: number; page_size?: number }) =>
    apiFetch(`/v1/awards${qs(p)}`, {}, true),
  get: (id: string) => apiFetch(`/v1/awards/${id}`, {}, true),
  create: (body: object) =>
    apiFetch(
      "/v1/awards",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  assign: (body: object) =>
    apiFetch(
      "/v1/awards/assign",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  leaderboard: (p?: { group_id?: string }) =>
    apiFetch(`/v1/awards/leaderboard${qs(p)}`, {}, true),
  categories: () => apiFetch("/v1/awards/categories", {}, true),
};

// ── Surveys API ────────────────────────────────────────────────────────────
export const SurveysAPI = {
  list: (p?: { page?: number; page_size?: number }) =>
    apiFetch(`/v1/surveys${qs(p)}`, {}, true),
  get: (id: string) => apiFetch(`/v1/surveys/${id}`, {}, true),
  create: (body: object) =>
    apiFetch(
      "/v1/surveys",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  update: (id: string, body: object) =>
    apiFetch(
      `/v1/surveys/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  delete: (id: string) =>
    apiFetch(`/v1/surveys/${id}`, { method: "DELETE" }, true),
  send: (id: string, body: object) =>
    apiFetch(
      `/v1/surveys/${id}/send`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  respond: (id: string, body: object) =>
    apiFetch(
      `/v1/surveys/${id}/respond`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  responses: (id: string) => apiFetch(`/v1/surveys/${id}/responses`, {}, true),
};

// ── Reports API ────────────────────────────────────────────────────────────
export const ReportsAPI = {
  health: () => apiFetch("/v1/reports/health", {}, true),
  growth: () => apiFetch("/v1/reports/growth", {}, true),
  referrals: () => apiFetch("/v1/reports/referrals", {}, true),
  attendance: () => apiFetch("/v1/reports/attendance", {}, true),
  revenue: () => apiFetch("/v1/reports/revenue", {}, true),
  export: (report_type: string) =>
    apiFetch(`/v1/reports/export?report_type=${report_type}`, {}, true),
};

// ── Visitors API ───────────────────────────────────────────────────────────
export const VisitorsAPI = {
  list: (p?: {
    group_id?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }) => apiFetch(`/v1/visitors${qs(p)}`, {}, true),
  stats: () => apiFetch("/v1/visitors/stats", {}, true),
  get: (id: string) => apiFetch(`/v1/visitors/${id}`, {}, true),
  register: (body: object) =>
    apiFetch(
      "/v1/visitors",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  approve: (id: string) =>
    apiFetch(`/v1/visitors/${id}/approve`, { method: "PATCH" }, true),
  convert: (id: string) =>
    apiFetch(`/v1/visitors/${id}/convert`, { method: "PATCH" }, true),
  delete: (id: string) =>
    apiFetch(`/v1/visitors/${id}`, { method: "DELETE" }, true),
};

// ── Attendance API ─────────────────────────────────────────────────────────
export const AttendanceAPI = {
  list: (p?: { group_id?: string; meeting_id?: string; page?: number }) =>
    apiFetch(`/v1/attendance${qs(p)}`, {}, true),
  mark: (body: object) =>
    apiFetch(
      "/v1/attendance",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("dashboard:summary");
      return r;
    }),
  markQr: (body: object) =>
    apiFetch(
      "/v1/attendance/qr",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("dashboard:summary");
      return r;
    }),
  markGps: (body: object) =>
    apiFetch(
      "/v1/attendance/gps",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("dashboard:summary");
      return r;
    }),
  userStats: (user_id: string) =>
    apiFetch(`/v1/attendance/stats/${user_id}`, {}, true),
  leaderboard: (p?: { group_id?: string }) =>
    apiFetch(`/v1/attendance/leaderboard${qs(p)}`, {}, true),
};

// ── Profile API ────────────────────────────────────────────────────────────
export const ProfileAPI = {
  // Cached 60s client-side — this was called from 5 separate places
  // per page navigation (layout, sidebar, events page, settings page,
  // and internally by the two summary endpoints below); most of those
  // don't need a network round trip if another one just fetched the
  // same data seconds ago. Explicitly invalidated below on update.
  get: () =>
    clientCache.get("profile:get", 60_000, () =>
      apiFetch("/v1/profile", {}, true),
    ),
  update: (body: object) =>
    apiFetch(
      "/v1/profile",
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("profile:");
      return r;
    }),
  uploadAvatar: (body: object) =>
    apiFetch(
      "/v1/profile/avatar",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("profile:");
      return r;
    }),
  uploadAvatarFile: async (file: Blob, filename: string) => {
    // Goes straight to the FastAPI backend (not a same-origin Next.js
    // route) — this app is `output: 'export'`ed to static Firebase
    // Hosting with no Node server, so a Next Route Handler has nowhere
    // to run in production. The backend already terminates CORS for
    // every other authenticated call via ALLOWED_ORIGINS, so posting the
    // raw file there avoids the separate Firebase Storage bucket CORS
    // policy a direct browser-to-GCS PUT would otherwise need.
    const token = TokenStore.getAccess();
    const res = await fetch(
      `${BASE_URL}/v1/profile/avatar/file?filename=${encodeURIComponent(filename)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": file.type || "image/jpeg",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: file,
      },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(
        json?.error?.message ||
          json?.error ||
          json?.detail ||
          "Photo upload failed",
      );
    clientCache.invalidate("profile:");
    return json?.data ?? json;
  },
  getAvatarUploadUrl: (body: object) =>
    apiFetch(
      "/v1/profile/avatar/upload-url",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  getAiFeatures: () => apiFetch("/v1/profile/ai-features", {}, true),
  changePassword: (body: object) =>
    apiFetch(
      "/v1/profile/password",
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  activity: (p?: { page?: number }) =>
    apiFetch(`/v1/profile/activity${qs(p)}`, {}, true),
  getPublic: (userId: string) =>
    apiFetch(`/v1/profile/public/${userId}`, { cache: "no-store" }, false),
  // One request instead of 9 — see fetchAll() in dashboard/profile/page.tsx.
  // Cached 20s client-side: short enough that accepting a connection or
  // requesting a testimonial and immediately checking the profile page
  // still feels current, long enough to absorb a quick dashboard <->
  // profile navigation without a second round trip.
  summary: () =>
    clientCache.get("profile:summary", 20_000, () =>
      apiFetch("/v1/profile/summary", {}, true),
    ),
};

// ── Dashboard API (aggregation) ─────────────────────────────────────────────
export const DashboardAPI = {
  // One request instead of 8 — see MemberDashboard's fetchAll() in
  // dashboard/page.tsx. Cached 20s client-side, same reasoning as
  // ProfileAPI.summary above.
  summary: () =>
    clientCache.get(
      `dashboard:summary:${TokenStore.getAccess() || "anonymous"}`,
      20_000,
      () => apiFetch("/v1/dashboard/summary", {}, true),
    ),
  refresh: () => {
    clientCache.invalidate("dashboard:summary");
    return apiFetch("/v1/dashboard/summary", {}, true);
  },
};

export const GamificationAPI = {
  me: () => apiFetch("/v1/gamification/me", {}, true),
  forUser: (userId: string) =>
    apiFetch(`/v1/gamification/user/${userId}`, {}, true),
  // Badge *definitions*, not per-user earned status — HQ-configured,
  // essentially static during a session. Cached 10min client-side,
  // invalidated on create() below (the only thing that changes this list).
  badges: () =>
    clientCache.get("gamification:badges", 10 * 60_000, () =>
      apiFetch("/v1/gamification/badges", {}, true),
    ),
  create: (body: object) =>
    apiFetch(
      "/v1/gamification/badges",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("gamification:badges");
      return r;
    }),
  award: (userId: string, badgeId: string) =>
    apiFetch(
      `/v1/gamification/award/${userId}/${badgeId}`,
      { method: "POST" },
      true,
    ),
};

export const TrustAPI = {
  get: (userId: string) => apiFetch(`/v1/trust/${userId}`, {}, true),
  requestVerification: (body: object) =>
    apiFetch(
      "/v1/trust/verification/request",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  queue: () => apiFetch("/v1/trust/verification/queue", {}, true),
  review: (userId: string, body: object) =>
    apiFetch(
      `/v1/trust/verification/${userId}/review`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
};

export const FranchiseApplicationsAPI = {
  submit: (body: object) =>
    apiFetch(
      "/v1/franchise-applications",
      { method: "POST", body: JSON.stringify(body) },
      false,
    ),
  list: (status?: string) =>
    apiFetch(
      `/v1/franchise-applications${status ? `?status=${status}` : ""}`,
      {},
      true,
    ),
  get: (id: string) => apiFetch(`/v1/franchise-applications/${id}`, {}, true),
  transition: (id: string, body: object) =>
    apiFetch(
      `/v1/franchise-applications/${id}/transition`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
};

export const MasterDataAPI = {
  // Dropdown source data (categories, industries, etc.) used across many
  // forms — HQ-managed, changes rarely. Cached 10min client-side per
  // listType, invalidated on any create/update/retire below.
  get: (listType: string) =>
    clientCache.get(`master-data:${listType}`, 10 * 60_000, () =>
      apiFetch(`/v1/master-data/${listType}`, {}, true),
    ),
  allTypes: () =>
    clientCache.get("master-data:all", 10 * 60_000, () =>
      apiFetch("/v1/master-data", {}, true),
    ),
  createItem: (body: object) =>
    apiFetch(
      "/v1/master-data/items",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("master-data:");
      return r;
    }),
  updateItem: (id: string, body: object) =>
    apiFetch(
      `/v1/master-data/items/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("master-data:");
      return r;
    }),
  retireItem: (id: string) =>
    apiFetch(`/v1/master-data/items/${id}`, { method: "DELETE" }, true).then(
      (r) => {
        clientCache.invalidate("master-data:");
        return r;
      },
    ),
};

export const RiskSignalsAPI = {
  renewals: (minLevel?: string) =>
    apiFetch(
      `/v1/risk-signals/renewals${minLevel ? `?min_level=${minLevel}` : ""}`,
      {},
      true,
    ),
  leads: () => apiFetch("/v1/risk-signals/leads", {}, true),
};

export const ExpansionSignalsAPI = {
  categoryGaps: (groupId?: string) =>
    apiFetch(
      `/v1/expansion-signals/category-gaps${groupId ? `?group_id=${groupId}` : ""}`,
      {},
      true,
    ),
  cityDensity: () => apiFetch("/v1/expansion-signals/city-density", {}, true),
};

// ── Settings API ───────────────────────────────────────────────────────────
export const SettingsAPI = {
  get: () => apiFetch("/v1/settings", {}, true),
  updateNotifications: (body: object) =>
    apiFetch(
      "/v1/settings/notifications",
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  updatePrivacy: (body: object) =>
    apiFetch(
      "/v1/settings/privacy",
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  updateIntegrations: (body: object) =>
    apiFetch(
      "/v1/settings/integrations",
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
};

// ── Matching API ────────────────────────────────────────────────────────────
export const MatchingAPI = {
  upsertProfile: (body: object) =>
    apiFetch(
      "/v1/matching/profile",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  myProfiles: () => apiFetch("/v1/matching/profile", {}, true),
  deleteProfile: (intent: string) =>
    apiFetch(`/v1/matching/profile/${intent}`, { method: "DELETE" }, true),
  matches: (intent: string, limit = 20) =>
    apiFetch(`/v1/matching/matches?intent=${intent}&limit=${limit}`, {}, true),
};

// ── Deal Corner API (route/module name stays "dealhub" internally) ──────────
export const DealHubAPI = {
  // Fix: this only ever accepted a plain status string, but the actual
  // page calls it with an object ({category, geography}) — those two
  // filters were being silently dropped before they ever reached a
  // request at all, on top of the backend never supporting them either
  // (both sides needed the fix, not just this one).
  listOffers: (params?: {
    status?: string;
    category?: string;
    geography?: string;
  }) => apiFetch(`/v1/dealhub/offers${qs(params || {})}`, {}, true),
  createOffer: (body: object) =>
    apiFetch(
      "/v1/dealhub/offers",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  updateOffer: (id: string, body: object) =>
    apiFetch(
      `/v1/dealhub/offers/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  getOffer: (id: string) => apiFetch(`/v1/dealhub/offers/${id}`, {}, true),
  deleteOffer: (id: string) =>
    apiFetch(`/v1/dealhub/offers/${id}`, { method: "DELETE" }, true),
  trackView: (id: string) =>
    apiFetch(`/v1/dealhub/offers/${id}/view`, { method: "POST" }, true),
  toggleSave: (id: string) =>
    apiFetch(`/v1/dealhub/offers/${id}/save`, { method: "POST" }, true),
  mySaved: () => apiFetch("/v1/dealhub/saved", {}, true),
  redeem: (id: string) =>
    apiFetch(`/v1/dealhub/offers/${id}/redeem`, { method: "POST" }, true),
  myRedemptions: () => apiFetch("/v1/dealhub/redemptions", {}, true),
  getUploadUrl: (body: object) =>
    apiFetch(
      "/v1/dealhub/offers/upload-url",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  moderationQueue: () => apiFetch("/v1/dealhub/admin/queue", {}, true),
  moderate: (id: string, action: "approve" | "reject", reason?: string) =>
    apiFetch(
      `/v1/dealhub/offers/${id}/moderate`,
      { method: "POST", body: JSON.stringify({ action, reason }) },
      true,
    ),
};

// ── Opportunities API ───────────────────────────────────────────────────────
// ── Opportunities API (Opportunity Square — rebuilt against OPP-01..OPP-07,
// replaces the old speaking/pitch_practice/gem_support/investor_readiness
// model. readinessProgress/toggleReadiness are gone — that model doesn't
// exist anymore) ──────────────────────────────────────────────────────────
export const OpportunitiesAPI = {
  list: (params?: {
    category?: string;
    industry?: string;
    geography?: string;
    status?: string;
    budget_min?: number;
    budget_max?: number;
    q?: string;
  }) => apiFetch(`/v1/opportunities${qs(params || {})}`, {}, true),
  create: (body: object) =>
    apiFetch(
      "/v1/opportunities",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("dashboard:summary");
      return r;
    }),
  mine: () => apiFetch("/v1/opportunities/mine", {}, true),
  get: (id: string) => apiFetch(`/v1/opportunities/${id}`, {}, true),
  update: (id: string, body: object) =>
    apiFetch(
      `/v1/opportunities/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  delete: (id: string) =>
    apiFetch(`/v1/opportunities/${id}`, { method: "DELETE" }, true).then(
      (r) => {
        clientCache.invalidate("dashboard:summary");
        return r;
      },
    ),
  transition: (
    id: string,
    body: { status: string; value?: number; currency?: string },
  ) =>
    apiFetch(
      `/v1/opportunities/${id}/transition`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("dashboard:summary");
      return r;
    }),
  expressInterest: (
    id: string,
    body: { note?: string; company_id?: string; company_name?: string },
  ) =>
    apiFetch(
      `/v1/opportunities/${id}/interest`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  listInterests: (id: string) =>
    apiFetch(`/v1/opportunities/${id}/interests`, {}, true),
  myInterests: () => apiFetch("/v1/opportunities/interests/mine", {}, true),
  updateInterestState: (interestId: string, state: string) =>
    apiFetch(
      `/v1/opportunities/interests/${interestId}/state`,
      { method: "PATCH", body: JSON.stringify({ state }) },
      true,
    ),
  report: (id: string, reason: string) =>
    apiFetch(
      `/v1/opportunities/${id}/report`,
      { method: "POST", body: JSON.stringify({ reason }) },
      true,
    ),
  moderationQueue: () =>
    apiFetch("/v1/opportunities/moderation/queue", {}, true),
  moderate: (reportId: string, action: "dismiss" | "remove_opportunity") =>
    apiFetch(
      `/v1/opportunities/moderation/${reportId}/action`,
      { method: "POST", body: JSON.stringify({ action }) },
      true,
    ),
};

// ── Merch API ────────────────────────────────────────────────────────────────
export const MerchAPI = {
  catalog: (params?: { page?: number; page_size?: number }) =>
    apiFetch(`/v1/merch/catalog${qs(params || {})}`, {}, true),
  createOrder: (body: object) =>
    apiFetch(
      "/v1/merch/orders",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  myOrders: (params?: { page?: number; page_size?: number }) =>
    apiFetch(`/v1/merch/orders/mine${qs(params || {})}`, {}, true),
  listOrders: (params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }) => apiFetch(`/v1/merch/orders${qs(params || {})}`, {}, true),
  updateOrderStatus: (id: string, body: object) =>
    apiFetch(
      `/v1/merch/orders/${id}/status`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  createProduct: (body: object) =>
    apiFetch(
      "/v1/merch/catalog",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  updateProduct: (id: string, body: object) =>
    apiFetch(
      `/v1/merch/catalog/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  deleteProduct: (id: string) =>
    apiFetch(`/v1/merch/catalog/${id}`, { method: "DELETE" }, true),
  getUploadUrl: (body: object) =>
    apiFetch(
      "/v1/merch/catalog/upload-url",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
};

// ── Connections API ────────────────────────────────────────────────────────
export const ConnectionsAPI = {
  list: (status?: string) =>
    apiFetch(`/v1/connections${status ? `?status=${status}` : ""}`, {}, true),
  status: (userId: string) =>
    apiFetch(`/v1/connections/status/${userId}`, {}, true),
  sendRequest: (userId: string) =>
    apiFetch(`/v1/connections/request/${userId}`, { method: "POST" }, true),
  accept: (id: string) =>
    apiFetch(`/v1/connections/${id}/accept`, { method: "PUT" }, true).then(
      (r) => {
        clientCache.invalidate("dashboard:summary");
        clientCache.invalidate("profile:");
        return r;
      },
    ),
  decline: (id: string) =>
    apiFetch(`/v1/connections/${id}/decline`, { method: "PUT" }, true),
  remove: (id: string) =>
    apiFetch(`/v1/connections/${id}`, { method: "DELETE" }, true).then((r) => {
      clientCache.invalidate("dashboard:summary");
      clientCache.invalidate("profile:");
      return r;
    }),
};

// ── Testimonials API ─────────────────────────────────────────────────────
export const TestimonialsAPI = {
  mine: () => apiFetch("/v1/testimonials/me", {}, true),
  given: () => apiFetch("/v1/testimonials/given", {}, true),
  forUser: (userId: string) =>
    apiFetch(`/v1/testimonials/user/${userId}`, {}, true),
  requests: () => apiFetch("/v1/testimonials/requests", {}, true),
  sent: () => apiFetch("/v1/testimonials/sent", {}, true),
  remind: (id: string) =>
    apiFetch(`/v1/testimonials/${id}/remind`, { method: "POST" }, true),
  request: (authorId: string) =>
    apiFetch(
      "/v1/testimonials/request",
      { method: "POST", body: JSON.stringify({ author_id: authorId }) },
      true,
    ),
  give: (body: { subject_id: string; text: string; rating: number }) =>
    apiFetch(
      "/v1/testimonials",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  submit: (id: string, body: { text: string; rating: number }) =>
    apiFetch(
      `/v1/testimonials/${id}/submit`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  remove: (id: string) =>
    apiFetch(`/v1/testimonials/${id}`, { method: "DELETE" }, true),
};

// ── Discover API ─────────────────────────────────────────────────────────
export const DiscoverAPI = {
  search: (params: Record<string, any> = {}) =>
    apiFetch(`/v1/discover${qs(params)}`, {}, true),
};

// ── Partner Circles API ─────────────────────────────────────────────────
export const CirclesAPI = {
  public: (slug: string) =>
    apiFetch(`/v1/circles/public/${encodeURIComponent(slug)}`),
  mine: () => apiFetch("/v1/circles/mine", {}, true),
  list: (params: Record<string, any> = {}) =>
    apiFetch(`/v1/circles${qs(params)}`, {}, true),
  get: (id: string) => apiFetch(`/v1/circles/${id}`, {}, true),
  create: (body: object) =>
    apiFetch(
      "/v1/circles",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  update: (id: string, body: object) =>
    apiFetch(
      `/v1/circles/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),
  activate: (id: string) =>
    apiFetch(`/v1/circles/${id}/activate`, { method: "POST" }, true),
  deactivate: (id: string) =>
    apiFetch(`/v1/circles/${id}/deactivate`, { method: "POST" }, true),
  assignLeader: (id: string, user_id: string) =>
    apiFetch(
      `/v1/circles/${id}/leader`,
      { method: "PUT", body: JSON.stringify({ user_id }) },
      true,
    ),
  members: (id: string, params: Record<string, any> = {}) =>
    apiFetch(`/v1/circles/${id}/members${qs(params)}`, {}, true),
  addMember: (id: string, user_id: string) =>
    apiFetch(
      `/v1/circles/${id}/members`,
      { method: "POST", body: JSON.stringify({ user_id }) },
      true,
    ),
  deactivateMember: (id: string, user_id: string) =>
    apiFetch(
      `/v1/circles/${id}/members/${user_id}/deactivate`,
      { method: "POST" },
      true,
    ),
  batches: (id: string) => apiFetch(`/v1/circles/${id}/batches`, {}, true),
  createBatch: (id: string, body: object) =>
    apiFetch(
      `/v1/circles/${id}/batches`,
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  previewBatch: (batchId: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiFetch(
      `/v1/circles/batches/${batchId}/preview`,
      { method: "POST", body },
      true,
    );
  },
  importBatch: (batchId: string, preview_token: string) =>
    apiFetch(
      `/v1/circles/batches/${batchId}/import`,
      { method: "POST", body: JSON.stringify({ preview_token }) },
      true,
    ),
};

// ── Users API (general search — used by UserSearchPicker) ──────────────────
export const UsersAPI = {
  search: (params: {
    q: string;
    role?: string;
    limit?: number;
    open_to_referrals?: boolean;
  }) => apiFetch(`/v1/users/search${qs(params)}`, {}, true),
};

// ── Tags API (autocomplete for structured tag-input fields, e.g. Can Help With) ──
export const TagsAPI = {
  search: (params: { q?: string; field?: string; limit?: number }) =>
    apiFetch(`/v1/tags/search${qs(params)}`, {}, true),
};

// ── Companies API ("Link Company" autocomplete + create) ────────────────────
export const CompaniesAPI = {
  search: (params: { q?: string; limit?: number }) =>
    apiFetch(`/v1/companies/search${qs(params)}`, {}, true),
  create: (body: {
    name: string;
    industry?: string;
    website?: string;
    city?: string;
  }) =>
    apiFetch(
      "/v1/companies",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  get: (id: string) => apiFetch(`/v1/companies/${id}`, {}, true),
  link: (id: string) =>
    apiFetch(`/v1/companies/${id}/link`, { method: "POST" }, true),
};

// ── Contribution / NetworkX Status API (new) ────────────────────────────
export const ContributionAPI = {
  me: () => apiFetch("/v1/contribution/me", {}, true),
  referralCode: () => apiFetch("/v1/contribution/referral-code", {}, true),
  invitationStats: () => apiFetch("/v1/contribution/invitations/me", {}, true),
  resolveCode: (code: string) =>
    apiFetch(`/v1/contribution/referral-code/${code}/resolve`, {}, false),
  recognition: () => apiFetch("/v1/contribution/recognition", {}, true),
  // HQ-configured pricing/status-level config — changes rarely. Cached
  // 10min client-side, invalidated on updateConfig below.
  referralPricingPublic: () =>
    clientCache.get("contribution:pricing", 10 * 60_000, () =>
      apiFetch("/v1/contribution/referral-pricing/public", {}, false),
    ),
  getConfig: () =>
    clientCache.get("contribution:config", 10 * 60_000, () =>
      apiFetch("/v1/contribution/config", {}, true),
    ),
  updateConfig: (key: string, body: object) =>
    apiFetch(
      `/v1/contribution/config/${key}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ).then((r) => {
      clientCache.invalidate("contribution:");
      return r;
    }),
};

// ── NetworkX Wallet API (new) ─────────────────────────────────────────────
export const WalletAPI = {
  me: () => apiFetch("/v1/wallet/me", {}, true),
  transactions: (p?: { page?: number; page_size?: number }) =>
    apiFetch(`/v1/wallet/transactions${qs(p || {})}`, {}, true),
  withdraw: (body: object) =>
    apiFetch(
      "/v1/wallet/withdraw",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
};

// ── Proactive Token Refresh ────────────────────────────────────────────────
// Refreshes the access token 2 minutes before it expires (default: 15min tokens)
// Call initAutoRefresh() once at app startup in layout.tsx

let _refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function initAutoRefresh(accessTokenExpireMinutes = 15) {
  if (typeof window === "undefined") return;

  const scheduleRefresh = () => {
    // Refresh 2 minutes before expiry
    const refreshInMs = (accessTokenExpireMinutes - 2) * 60 * 1000;
    if (_refreshTimer) clearTimeout(_refreshTimer);
    _refreshTimer = setTimeout(async () => {
      const refreshed = await tryRefresh();
      if (refreshed) {
        scheduleRefresh(); // schedule next refresh
      } else {
        // Refresh failed — user needs to log in again
        TokenStore.clear();
        window.location.href = "/login";
      }
    }, refreshInMs);
  };

  // Only start if user is logged in
  if (TokenStore.getAccess()) {
    scheduleRefresh();
  }
}

export function stopAutoRefresh() {
  if (_refreshTimer) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }
}
