"use client";
import { Loading } from "@/components/shared/States";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsRotate,
  faLocationDot,
  faMagnifyingGlass,
  faUsers,
  faVideo,
  faCalendarDays,
  faArrowRight,
  faCircleCheck,
  faTag,
  faPenToSquare,
  faTicket,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import {
  EventsAPI,
  TerritoriesAPI,
  TokenStore,
  ProfileAPI,
  PaymentsAPI,
} from "@/lib/api";
import EventTicket from "@/components/ui/EventTicket";
import CapacityBar from "@/components/ui/CapacityBar";
import PageHero from "@/components/shared/PageHero";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { Pagination } from "@/components/shared/Pagination";

const STATUS_COLOR: Record<string, string> = {
  upcoming: "#6366f1",
  planning: "#f59e0b",
  ongoing: "var(--nx-orange)",
  completed: "#10b981",
  cancelled: "#ef4444",
};
const EVENT_TYPES = [
  "City Mega Event",
  "Award Night",
  "Leader Circles",
  "City Mixer",
  "Training",
  "NLN Meet",
  "International Convention",
  "Seminar",
  "Workshop",
];

// Defined OUTSIDE EventsPage (not nested inside it) — same focus-loss bug
// class as the original Travel Connect fix: a form component declared
// inside its parent gets recreated (and its inputs remounted) on every
// render, dropping keyboard focus after each character typed.
function EventForm({
  form,
  onChange,
  territories,
}: {
  form: any;
  onChange: (f: any) => void;
  territories: any[];
}) {
  return (
    <>
      <div className="form-grid">
        <div className="fg" style={{ gridColumn: "1/-1" }}>
          <label>Event Title *</label>
          <input
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            placeholder="e.g. Delhi City Mega Event 2026"
          />
        </div>
        <div className="fg">
          <label>Event Type</label>
          <select
            value={form.type}
            onChange={(e) => onChange({ ...form, type: e.target.value })}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label>Territory</label>
          <select
            value={form.territory_id}
            onChange={(e) => {
              const t = territories.find((x) => x.id === e.target.value);
              onChange({
                ...form,
                territory_id: e.target.value,
                city: t?.city || form.city,
                country: t?.country || form.country,
              });
            }}
          >
            <option value="">— No specific territory —</option>
            {territories.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.city})
              </option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label>Start Date & Time *</label>
          <input
            type="datetime-local"
            value={form.date}
            onChange={(e) => onChange({ ...form, date: e.target.value })}
          />
        </div>
        <div className="fg">
          <label>End Date & Time</label>
          <input
            type="datetime-local"
            value={form.end_date}
            onChange={(e) => onChange({ ...form, end_date: e.target.value })}
          />
        </div>
        <div className="fg">
          <label>Venue / Location</label>
          <input
            value={form.venue}
            onChange={(e) => onChange({ ...form, venue: e.target.value })}
            placeholder="Hotel name, address…"
          />
        </div>
        <div className="fg">
          <label>City</label>
          <input
            value={form.city}
            onChange={(e) => onChange({ ...form, city: e.target.value })}
            placeholder="Auto-filled from territory"
          />
        </div>
        <div className="fg">
          <label>Max Capacity</label>
          <input
            type="number"
            value={form.capacity}
            onChange={(e) =>
              onChange({ ...form, capacity: Number(e.target.value) })
            }
          />
        </div>
      </div>

      {/* Pulled out of the 2-col grid on purpose — these two blocks have
          conditional sub-fields that make them much taller than a plain
          single-input cell (like Max Capacity), which broke the grid's
          row-pairing and left an unbalanced empty cell next to whichever
          one landed on its own row. A dedicated flex row keeps both
          side-by-side regardless of how tall either one gets. */}
      <div
        style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}
      >
        <div className="fg" style={{ flex: 1, minWidth: 220 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={form.is_free}
              onChange={(e) =>
                onChange({ ...form, is_free: e.target.checked, entry_fee: 0 })
              }
            />
            Free Event
          </label>
          {!form.is_free && (
            <>
              <label style={{ marginTop: 8 }}>Entry Fee (₹)</label>
              <input
                type="number"
                value={form.entry_fee}
                onChange={(e) =>
                  onChange({ ...form, entry_fee: Number(e.target.value) })
                }
                placeholder="e.g. 500"
              />
            </>
          )}
        </div>
        <div className="fg" style={{ flex: 1, minWidth: 220 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <input
              type="checkbox"
              checked={form.is_online}
              onChange={(e) =>
                onChange({ ...form, is_online: e.target.checked })
              }
            />
            Online / Hybrid
          </label>
          {form.is_online && (
            <>
              <label>Meeting Link</label>
              <input
                value={form.online_link}
                onChange={(e) =>
                  onChange({ ...form, online_link: e.target.value })
                }
                placeholder="Zoom / Meet link"
              />
            </>
          )}
        </div>
      </div>
      <div className="fg">
        <label>Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Describe the event — agenda, speakers, what to expect…"
        />
      </div>
    </>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(0);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [saving, setSaving] = useState(false);

  // Modals
  const [selected, setSelected] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAttend, setShowAttend] = useState(false);

  const me = TokenStore.getUser();
  const [myProfile, setMyProfile] = useState<any>(null);
  const canManage = ["hq_admin", "super_admin"].includes(me?.role);
  // Registration is intentionally open through "ongoing" too, not just
  // "upcoming" — walk-ins/late joiners for an event already in progress
  // are a real, normal case, not a bug. Only "completed"/"cancelled"
  // actually close it. Backend has no status check on register_for_event
  // at all, so this is purely about what the UI offers — nothing here
  // needs a backend change.
  const registrationOpen =
    selected && ["upcoming", "ongoing"].includes(selected.status);
  const canCreate = ["franchise", "hq_admin", "super_admin"].includes(me?.role);
  // P0 gap fix: QR check-in — same franchise+ gate the backend enforces
  const canCheckIn = ["franchise", "hq_admin", "super_admin"].includes(
    me?.role,
  );

  const [myReg, setMyReg] = useState<any | null>(null);
  const [regBusy, setRegBusy] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinToken, setCheckinToken] = useState("");
  const [checkinResult, setCheckinResult] = useState<any | null>(null);
  const [checkinBusy, setCheckinBusy] = useState(false);

  // Free vs Paid+Coupon RSVP flow
  const [couponCode, setCouponCode] = useState("");
  const [couponPreview, setCouponPreview] = useState<any | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_type: "percent",
    discount_value: "",
    max_uses: "",
  });
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Create / Edit form — all fields
  const emptyForm = {
    title: "",
    type: "City Mega Event",
    date: "",
    end_date: "",
    venue: "",
    city: "",
    territory_id: "",
    capacity: 100,
    description: "",
    entry_fee: 0,
    is_free: true,
    online_link: "",
    is_online: false,
    country: "India",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchEvents(1);
    TerritoriesAPI.list({ page: 1, page_size: 50 })
      .then((res) => setTerritories(res.items || res))
      .catch(() => {});
  }, [statusFilter]);

  useEffect(() => {
    // For the ticket template — cached login data can be stale/incomplete
    // (e.g. no signed avatar URL, which only the live profile endpoint
    // can mint), so fetch the real profile once rather than trusting me.
    ProfileAPI.get()
      .then(setMyProfile)
      .catch(() => {});
  }, []);

  const fetchEvents = async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await EventsAPI.list({
        status: statusFilter || undefined,
        page: p,
        page_size: 20,
      });
      setEvents(res.items || res);
      setTotal(res.total ?? null);
      setHasMore(res.has_more || false);
      setPage(p);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openEdit = (ev: any) => {
    setEditing(ev);
    setForm({
      title: ev.title || "",
      type: ev.type || "City Mega Event",
      date: ev.date ? ev.date.slice(0, 16) : "",
      end_date: ev.end_date ? ev.end_date.slice(0, 16) : "",
      venue: ev.venue || "",
      city: ev.city || "",
      territory_id: ev.territory_id || "",
      capacity: ev.capacity || 100,
      description: ev.description || "",
      entry_fee: ev.entry_fee || 0,
      is_free: ev.entry_fee === 0,
      online_link: ev.online_link || "",
      is_online: ev.is_online || false,
      country: ev.country || "India",
    });
  };

  const openDetail = async (ev: any) => {
    setSelected(ev); // show something immediately
    setMyReg(null);
    setCouponCode("");
    setCouponPreview(null);
    try {
      const fresh = await EventsAPI.get(ev.id);
      setSelected(fresh);
      setMyReg(fresh.my_registration || null);
    } catch {}
  };

  const openAttendees = async (ev: any) => {
    setSelected(ev);
    setShowAttend(true);
    setAttendees([]);
    try {
      const res = await EventsAPI.attendees(ev.id);
      setAttendees(res.items || res);
    } catch {}
  };

  const createEvent = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      await EventsAPI.create({
        ...form,
        capacity: Number(form.capacity),
        entry_fee: form.is_free ? 0 : Number(form.entry_fee),
        status: "upcoming",
      });
      setShowCreate(false);
      setForm(emptyForm);
      setMsg("✅ Event created!");
      fetchEvents(1);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing || !form.title || !form.date) return;
    setSaving(true);
    try {
      await EventsAPI.update(editing.id, {
        ...form,
        capacity: Number(form.capacity),
        entry_fee: form.is_free ? 0 : Number(form.entry_fee),
      });
      setEditing(null);
      setMsg("✅ Event updated!");
      fetchEvents(page);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id: string, status: string) => {
    try {
      await EventsAPI.update(id, { status });
      setMsg(`✅ Status updated to ${status}`);
      if (selected?.id === id) setSelected({ ...selected, status });
      fetchEvents(page);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  const registerForEvent = async (id: string) => {
    setRegBusy(true);
    try {
      const reg = await EventsAPI.register(
        id,
        couponPreview?.valid ? couponCode.trim() : undefined,
      );
      setMyReg(reg);
      setCouponCode("");
      setCouponPreview(null);
      if (reg.status === "waitlisted") {
        setMsg("⏳ Event is full — you've been added to the waitlist");
      } else if (reg.payment_order) {
        // Paid registration — open real Razorpay checkout (test mode
        // until real keys are set in the backend's .env)
        openRazorpayCheckout({
          order: reg.payment_order,
          description: `Event registration — ${selected?.title || ""}`,
          memberName: me?.name,
          memberEmail: me?.email,
          onSuccess: () => {
            setMsg("✅ Payment received — you're registered!");
            openDetail(selected);
          },
          onFailure: (e) => {
            setMsg(
              "❌ " +
                e.message +
                " — your spot is held, retry payment from this event's details",
            );
            openDetail(selected);
          },
        });
      } else {
        setMsg("✅ Registered! Your ticket is below.");
      }
      fetchEvents(page);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setRegBusy(false);
    }
  };

  // Was completely missing — once registered, the RSVP button disappeared
  // for good, even if the person cancelled/failed Razorpay checkout and
  // was left holding a "Payment Pending" ticket forever with no way back
  // to actually pay. Reuses the same generic payment infra Membership's
  // "Pay & Upgrade" uses — the existing registration is untouched, this
  // just creates a fresh payable order for it. The backend's payment
  // webhook/verify flow already knows how to flip THIS registration's
  // payment_status to "paid" (matches by event_id + user_id), so no
  // backend change was needed for this specific piece.
  const retryPayment = async () => {
    if (!selected || !myReg) return;
    setRegBusy(true);
    try {
      const order = await PaymentsAPI.createOrder({
        amount: myReg.price_charged,
        reference_type: "event",
        reference_id: selected.id,
        notes: `Event registration — ${selected.title}`,
      });
      openRazorpayCheckout({
        order,
        description: `Event registration — ${selected.title}`,
        memberName: me?.name,
        memberEmail: me?.email,
        onSuccess: () => {
          setMsg("✅ Payment received — your ticket is now active!");
          openDetail(selected);
        },
        onFailure: (e) => {
          setMsg("❌ " + e.message);
        },
      });
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setRegBusy(false);
    }
  };

  const previewCoupon = async () => {
    if (!selected || !couponCode.trim()) return;
    setCouponBusy(true);
    try {
      const res = await EventsAPI.previewCoupon(selected.id, couponCode.trim());
      setCouponPreview(res);
    } catch (e: any) {
      setCouponPreview({ valid: false, reason: e.message });
    } finally {
      setCouponBusy(false);
    }
  };

  const openCoupons = async (ev: any) => {
    setSelected(ev);
    setShowCoupons(true);
    try {
      const res = await EventsAPI.listCoupons(ev.id);
      setCoupons(res.items || res || []);
    } catch {}
  };

  const createCoupon = async () => {
    if (!selected || !newCoupon.code.trim()) return;
    setSavingCoupon(true);
    try {
      await EventsAPI.createCoupon(selected.id, {
        code: newCoupon.code.trim(),
        discount_type: newCoupon.discount_type,
        discount_value:
          newCoupon.discount_type === "free"
            ? 0
            : Number(newCoupon.discount_value || 0),
        max_uses: newCoupon.max_uses ? Number(newCoupon.max_uses) : null,
      });
      setMsg(`✅ Coupon ${newCoupon.code.trim().toUpperCase()} created`);
      setNewCoupon({
        code: "",
        discount_type: "percent",
        discount_value: "",
        max_uses: "",
      });
      openCoupons(selected);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSavingCoupon(false);
    }
  };

  const deactivateCoupon = async (code: string) => {
    if (!selected) return;
    try {
      await EventsAPI.deactivateCoupon(selected.id, code);
      setMsg(`✅ Coupon ${code} deactivated`);
      openCoupons(selected);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  const cancelRegistration = async (id: string) => {
    if (!confirm("Cancel your registration for this event?")) return;
    setRegBusy(true);
    try {
      await EventsAPI.cancelRegistration(id);
      setMsg("✅ Registration cancelled");
      setMyReg(null);
      fetchEvents(page);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setRegBusy(false);
    }
  };

  const checkinAttendee = async () => {
    if (!selected || !checkinToken.trim()) return;
    setCheckinBusy(true);
    setCheckinResult(null);
    try {
      // The QR encodes "NX-EVENT:{event_id}:{token}" (see EventTicket) —
      // the backend only stores the raw token, so unwrap the composite
      // form if that's what got scanned/pasted; a bare token still works.
      const raw = checkinToken.trim();
      const token = raw.startsWith("NX-EVENT:")
        ? raw.split(":").pop() || raw
        : raw;
      const res = await EventsAPI.checkin(selected.id, token);
      setCheckinResult({ ok: true, name: res.user?.name || "Attendee" });
      setCheckinToken("");
      openAttendees(selected);
    } catch (e: any) {
      setCheckinResult({ ok: false, message: e.message });
    } finally {
      setCheckinBusy(false);
    }
  };

  const deleteEvent = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?\n\nThis cannot be undone.`)) return;
    try {
      await EventsAPI.delete(id);
      setMsg("✅ Event deleted");
      if (selected?.id === id) setSelected(null);
      fetchEvents(page);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  // Stats
  const upcoming = events.filter((e) => e.status === "upcoming").length;
  const ongoing = events.filter((e) => e.status === "ongoing").length;
  const completed = events.filter((e) => e.status === "completed").length;

  return (
    <div className="page">
      {/* Header */}
      <PageHero
        icon={faCalendarDays}
        kicker="Meet & Connect"
        title="Events"
        description="Platform events across all territories — register, check in, and connect in person."
        stats={[
          { icon: faTicket, value: events.length, label: "Total events" },
          { icon: faCalendarDays, value: upcoming, label: "Upcoming" },
          { icon: faVideo, value: ongoing, label: "Ongoing" },
          { icon: faCircleCheck, value: completed, label: "Completed" },
        ]}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <button className="btn btn-g btn-sm" onClick={() => fetchEvents(page)}>
          <FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5" />
          Refresh
        </button>
        {canCreate && (
          <button className="btn btn-p" onClick={openCreate}>
            + Create Event
          </button>
        )}
      </div>

      {/* Message */}
      {msg && (
        <div
          className="toast-in"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            borderRadius: 10,
            marginBottom: 12,
            fontSize: 13,
            background: msg.startsWith("✅")
              ? "rgba(39,216,109,.1)"
              : "rgba(255,90,90,.1)",
            color: msg.startsWith("✅") ? "#16a34a" : "#ef4444",
            border: `1px solid ${msg.startsWith("✅") ? "rgba(39,216,109,.35)" : "rgba(255,90,90,.35)"}`,
          }}
        >
          {msg}
          <button
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
            }}
            onClick={() => setMsg("")}
          >
            ✕
          </button>
        </div>
      )}

      {/* Status filter */}
      <div
        style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}
      >
        {["", "upcoming", "planning", "ongoing", "completed", "cancelled"].map(
          (s) => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? "btn-p" : "btn-g"}`}
              onClick={() => setStatusFilter(s)}
              style={{ textTransform: "capitalize" }}
            >
              {s || "All"}
            </button>
          ),
        )}
      </div>

      {error && (
        <div
          style={{
            background: "rgba(255,90,90,.1)",
            border: "1px solid rgba(255,90,90,.3)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 12,
            color: "#ef4444",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Events table */}
      {loading ? (
        <div className="card">
          <Loading label="Loading events…" />
        </div>
      ) : events.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>
              <FontAwesomeIcon icon={faCalendarDays} />
            </div>
            <div>No events found</div>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="tbl">
              <thead>
                <tr>
                  {[
                    "Title & Type",
                    "Date",
                    "Venue",
                    "Capacity",
                    "Fee",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr
                    key={ev.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => openDetail(ev)}
                  >
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {ev.title}
                      </div>
                      {ev.type && (
                        <div style={{ fontSize: 11, color: "var(--nx-muted)" }}>
                          {ev.type}
                          {ev.is_online && " · Online"}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--nx-muted)" }}>
                      {ev.date
                        ? new Date(ev.date).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {ev.venue || "—"}
                      {ev.city ? ` · ${ev.city}` : ""}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <FontAwesomeIcon icon={faUsers} className="mr-1.5" />
                      {ev.registrations_count || 0}/{ev.capacity || "∞"}
                    </td>
                    <td>
                      {ev.entry_fee > 0 ? (
                        <span
                          style={{
                            color: "var(--nx-orange)",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          ₹{ev.entry_fee.toLocaleString()}
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "#10b981",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          Free
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background:
                            (STATUS_COLOR[ev.status] || "#9ca3af") + "22",
                          color: STATUS_COLOR[ev.status] || "#9ca3af",
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {ev.status || "—"}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="btn btn-xs btn-g"
                          onClick={() => openDetail(ev)}
                        >
                          View
                        </button>
                        {canManage && (
                          <>
                            <button
                              className="btn btn-xs btn-g"
                              style={{ color: "#6366f1" }}
                              onClick={() => openEdit(ev)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-xs btn-g"
                              style={{ color: "#ef4444" }}
                              onClick={() => deleteEvent(ev.id, ev.title)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={20}
            total={total}
            hasMore={hasMore}
            loading={loading}
            onPageChange={fetchEvents}
          />
        </>
      )}

      {/* ── VIEW / DETAIL MODAL ──────────────────────────────────────── */}
      {selected && !showAttend && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="modal modal-lg">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 14,
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  margin: 0,
                  flex: 1,
                  marginRight: 12,
                }}
              >
                {selected.title}
              </h3>
              <span
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 99,
                  background:
                    (STATUS_COLOR[selected.status] || "#9ca3af") + "22",
                  color: STATUS_COLOR[selected.status] || "#9ca3af",
                  fontWeight: 700,
                  textTransform: "capitalize",
                  flexShrink: 0,
                }}
              >
                {selected.status || "—"}
              </span>
            </div>

            {selected.description && (
              <div
                style={{
                  background: "rgba(255,255,255,.04)",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 14,
                  fontSize: 13,
                  color: "#cbd5e1",
                  lineHeight: 1.6,
                }}
              >
                {selected.description}
              </div>
            )}

            <div className="form-grid" style={{ marginBottom: 14 }}>
              {[
                ["Type", selected.type || "—"],
                [
                  "Date",
                  selected.date
                    ? new Date(selected.date).toLocaleString("en-IN", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })
                    : "—",
                ],
                [
                  "End Date",
                  selected.end_date
                    ? new Date(selected.end_date).toLocaleString("en-IN", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })
                    : "—",
                ],
                ["Venue", selected.venue || "—"],
                ["City", selected.city || "—"],
                ["Country", selected.country || "—"],
                ["Capacity", selected.capacity || "—"],
                ["Registered", selected.registrations_count || 0],
                [
                  "Entry Fee",
                  selected.entry_fee > 0
                    ? `₹${selected.entry_fee.toLocaleString()}`
                    : "Free",
                ],
                [
                  "Format",
                  selected.is_online ? "Online / Hybrid" : "In-Person",
                ],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <div
                    style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}
                  >
                    {k}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {String(v)}
                  </div>
                </div>
              ))}
            </div>

            {/* Fix: was showing the meeting link to anyone who opened the
                event, registered or not — the whole point of a private
                Zoom/Meet link is that it's only for people who actually
                signed up. Now gated to confirmed registrants (or staff
                managing the event) only. */}
            {/* Fix: was checking myReg.status === 'confirmed', but that
                field only tracks REGISTRATION state — it becomes
                "confirmed" the instant RSVP is submitted, regardless of
                whether payment actually cleared. payment_status is the
                separate field that tracks that. A registration can be
                status="confirmed" AND payment_status="pending" at the
                same time (exactly what showed the link in the
                screenshot) — must check both. */}
            {selected.online_link &&
              (canManage ||
                (myReg?.status === "confirmed" &&
                  (myReg?.payment_status === "paid" ||
                    myReg?.payment_status === "not_required"))) && (
                <div
                  style={{
                    background: "rgba(22,143,255,.1)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 14,
                    fontSize: 13,
                  }}
                >
                  <FontAwesomeIcon icon={faVideo} className="mr-1.5" />
                  <a
                    href={selected.online_link}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#3b82f6" }}
                  >
                    {selected.online_link}
                  </a>
                </div>
              )}
            {selected.online_link && !canManage && !myReg && (
              <div
                style={{
                  background: "rgba(255,255,255,.03)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 14,
                  fontSize: 12,
                  color: "var(--nx-muted)",
                }}
              >
                <FontAwesomeIcon icon={faVideo} className="mr-1.5" />
                The meeting link is shared with confirmed registrants only.
              </div>
            )}
            {selected.online_link &&
              !canManage &&
              myReg?.status === "confirmed" &&
              myReg?.payment_status === "pending" && (
                <div
                  style={{
                    background: "rgba(245,158,11,.08)",
                    border: "1px solid rgba(245,158,11,.3)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 14,
                    fontSize: 12,
                    color: "#f59e0b",
                  }}
                >
                  <FontAwesomeIcon icon={faVideo} className="mr-1.5" />
                  Complete payment to unlock the meeting link.
                </div>
              )}

            {/* Ticket — shows once the member has a registration */}
            {myReg && (
              <div style={{ marginBottom: 14 }}>
                <EventTicket
                  eventId={selected.id}
                  eventTitle={selected.title}
                  eventDate={
                    selected.date
                      ? new Date(selected.date).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : undefined
                  }
                  eventVenue={selected.venue}
                  registration={myReg}
                  memberName={myProfile?.name || me?.name}
                  memberProfession={myProfile?.profession}
                  memberCompany={myProfile?.company}
                  memberAvatarUrl={myProfile?.avatar_url}
                />
              </div>
            )}

            {selected.capacity ? (
              <div style={{ marginBottom: 14 }}>
                <CapacityBar
                  confirmed={selected.registrations_count || 0}
                  capacity={selected.capacity}
                  spotsLeft={selected.spots_left ?? null}
                />
              </div>
            ) : null}

            {/* Free vs Paid+Coupon RSVP (gap fix) — clear entry-fee callout
               before committing, with a coupon-code preview so the member
               sees the real discounted price before Register actually
               charges anything. */}
            {registrationOpen && !myReg && (
              <div className="card" style={{ marginBottom: 14, padding: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: selected.entry_fee > 0 ? 10 : 0,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {selected.entry_fee > 0 ? "Paid Event" : "Free Event"}
                  </span>
                  {selected.entry_fee > 0 && !couponPreview?.valid && (
                    <span
                      className="stat-num"
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "var(--nx-orange)",
                      }}
                    >
                      ₹{selected.entry_fee.toLocaleString()}
                    </span>
                  )}
                  {couponPreview?.valid && (
                    <span style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--nx-muted)",
                          textDecoration: "line-through",
                          marginRight: 6,
                        }}
                      >
                        ₹{couponPreview.original_price.toLocaleString()}
                      </span>
                      <span
                        className="stat-num"
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#10b981",
                        }}
                      >
                        ₹{couponPreview.final_price.toLocaleString()}
                      </span>
                    </span>
                  )}
                </div>
                {selected.entry_fee > 0 && (
                  <div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponPreview(null);
                        }}
                        placeholder="Have a coupon code?"
                        style={{ flex: 1, fontSize: 12, padding: "6px 10px" }}
                      />
                      <button
                        type="button"
                        className="btn btn-g btn-sm"
                        onClick={previewCoupon}
                        disabled={couponBusy || !couponCode.trim()}
                      >
                        {couponBusy ? "Checking…" : "Apply"}
                      </button>
                    </div>
                    {couponPreview && (
                      <div
                        style={{
                          fontSize: 11,
                          marginTop: 6,
                          color: couponPreview.valid ? "#7be3a4" : "#ff9d9d",
                        }}
                      >
                        {couponPreview.valid
                          ? `✅ ${couponPreview.code} applied — ${couponPreview.discount_type === "free" ? "free entry" : couponPreview.discount_type === "percent" ? `${couponPreview.discount_value}% off` : `₹${couponPreview.discount_value} off`}`
                          : `❌ ${couponPreview.reason}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {/* Registration */}
              {registrationOpen && !myReg && (
                <button
                  className="btn btn-p btn-sm"
                  onClick={() => registerForEvent(selected.id)}
                  disabled={regBusy}
                >
                  {regBusy
                    ? "Processing…"
                    : selected.entry_fee > 0 && !couponPreview?.valid
                      ? `RSVP — Pay ₹${selected.entry_fee.toLocaleString()}`
                      : selected.entry_fee > 0
                        ? "RSVP — Pay Discounted Price"
                        : "RSVP — Free"}
                </button>
              )}
              {registrationOpen &&
                myReg &&
                myReg.status === "confirmed" &&
                myReg.payment_status === "pending" && (
                  <button
                    className="btn btn-p btn-sm"
                    onClick={retryPayment}
                    disabled={regBusy}
                  >
                    {regBusy
                      ? "Processing…"
                      : `Pay Now — ₹${(myReg.price_charged || 0).toLocaleString()}`}
                  </button>
                )}
              {registrationOpen && myReg && myReg.status !== "cancelled" && (
                <button
                  className="btn btn-g btn-sm"
                  onClick={() => cancelRegistration(selected.id)}
                  disabled={regBusy}
                >
                  Cancel Registration
                </button>
              )}
              {/* Was silently showing nothing when status wasn't
                  "upcoming" — looked exactly like a missing feature
                  rather than a closed registration window. */}
              {!registrationOpen && !myReg && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--nx-muted)",
                    padding: "6px 0",
                  }}
                >
                  {selected.status === "completed"
                    ? "This event has already ended."
                    : selected.status === "cancelled"
                      ? "This event was cancelled."
                      : "RSVP is not open for this event."}
                </div>
              )}

              {/* Attendees list */}
              <button
                className="btn btn-g btn-sm"
                onClick={() => openAttendees(selected)}
              >
                <FontAwesomeIcon icon={faUsers} className="mr-1.5" />
                View Attendees ({selected.registrations_count || 0})
              </button>
              {canCheckIn && (
                <button
                  className="btn btn-g btn-sm"
                  style={{ color: "var(--nx-orange)" }}
                  onClick={() => {
                    setShowCheckin(true);
                    setCheckinResult(null);
                  }}
                >
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="mr-1.5"
                  />
                  Check-In Scanner
                </button>
              )}
              {canCreate && selected.entry_fee > 0 && (
                <button
                  className="btn btn-g btn-sm"
                  onClick={() => openCoupons(selected)}
                >
                  <FontAwesomeIcon icon={faTag} className="mr-1.5" />
                  Manage Coupons
                </button>
              )}

              {/* Status management — HQ/Super only */}
              {canManage && (
                <>
                  {selected.status === "planning" && (
                    <button
                      className="btn btn-g btn-sm"
                      style={{ color: "#6366f1" }}
                      onClick={() => changeStatus(selected.id, "upcoming")}
                    >
                      Mark Upcoming
                    </button>
                  )}
                  {selected.status === "upcoming" && (
                    <button
                      className="btn btn-g btn-sm"
                      style={{ color: "var(--nx-orange)" }}
                      onClick={() => changeStatus(selected.id, "ongoing")}
                    >
                      Start Event
                    </button>
                  )}
                  {selected.status === "ongoing" && (
                    <button
                      className="btn btn-p btn-sm"
                      onClick={() => changeStatus(selected.id, "completed")}
                    >
                      Mark Completed
                    </button>
                  )}
                  {!["completed", "cancelled"].includes(selected.status) && (
                    <button
                      className="btn btn-g btn-sm"
                      style={{ color: "#ef4444" }}
                      onClick={() => changeStatus(selected.id, "cancelled")}
                    >
                      Cancel Event
                    </button>
                  )}
                  <button
                    className="btn btn-g btn-sm"
                    style={{ color: "#6366f1" }}
                    onClick={() => {
                      openEdit(selected);
                      setSelected(null);
                    }}
                  >
                    <FontAwesomeIcon icon={faPenToSquare} className="mr-1.5" />
                    Edit
                  </button>
                  <button
                    className="btn btn-g btn-sm"
                    style={{ color: "#ef4444" }}
                    onClick={() => deleteEvent(selected.id, selected.title)}
                  >
                    Delete
                  </button>
                </>
              )}

              <button
                className="btn btn-g"
                style={{ marginLeft: "auto" }}
                onClick={() => {
                  setSelected(null);
                  setMyReg(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ATTENDEES MODAL ──────────────────────────────────────────── */}
      {showAttend && selected && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowAttend(false)}
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              <FontAwesomeIcon icon={faUsers} className="mr-1.5" />
              Attendees — {selected.title}
            </h3>
            {attendees.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}
              >
                No registrations yet
              </div>
            ) : (
              <div
                className="card"
                style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}
              >
                <table className="tbl">
                  <thead>
                    <tr>
                      {[
                        "#",
                        "Name",
                        "Email",
                        "City",
                        "Status",
                        "Checked In",
                        "Registered At",
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((a, i) => (
                      <tr key={a.id || i}>
                        <td style={{ color: "#9ca3af", fontSize: 12 }}>
                          {i + 1}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {a.user?.name || a.user_id?.slice(0, 12) || "—"}
                        </td>
                        <td style={{ fontSize: 12, color: "#6b7280" }}>
                          {a.user?.email || "—"}
                        </td>
                        <td style={{ fontSize: 12 }}>{a.user?.city || "—"}</td>
                        <td>
                          <span
                            className={`badge ${a.status === "confirmed" ? "b-green" : a.status === "waitlisted" ? "b-orange" : "b-red"}`}
                          >
                            {a.status || "—"}
                          </span>
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {a.checked_in ? (
                            <FontAwesomeIcon
                              icon={faCircleCheck}
                              className="text-green"
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={{ fontSize: 11, color: "#9ca3af" }}>
                          {a.created_at
                            ? new Date(a.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              className="btn btn-g"
              style={{ width: "100%" }}
              onClick={() => setShowAttend(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── CHECK-IN SCANNER (P0 gap fix) ───────────────────────────── */}
      {showCheckin && selected && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowCheckin(false)}
        >
          <div className="modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              <FontAwesomeIcon icon={faMagnifyingGlass} className="mr-1.5" />
              Check-In — {selected.title}
            </h3>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>
              Paste or type the code from the attendee's ticket QR. Scan it with
              any phone camera / QR scanner app first — this just verifies and
              marks it.
            </p>
            <div className="fg">
              <label>Ticket Code</label>
              <input
                value={checkinToken}
                onChange={(e) => setCheckinToken(e.target.value)}
                placeholder="NX-EVENT:…"
                onKeyDown={(e) => e.key === "Enter" && checkinAttendee()}
              />
            </div>
            {checkinResult && (
              <div
                className="toast-in"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  marginBottom: 12,
                  fontSize: 13,
                  background: checkinResult.ok
                    ? "rgba(39,216,109,.1)"
                    : "rgba(255,90,90,.1)",
                  color: checkinResult.ok ? "#16a34a" : "#ef4444",
                  border: `1px solid ${checkinResult.ok ? "rgba(39,216,109,.35)" : "rgba(255,90,90,.35)"}`,
                }}
              >
                {checkinResult.ok
                  ? `✅ Checked in: ${checkinResult.name}`
                  : `❌ ${checkinResult.message}`}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={checkinAttendee}
                disabled={checkinBusy || !checkinToken.trim()}
              >
                {checkinBusy ? "Checking…" : "Check In"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setShowCheckin(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── COUPON MANAGEMENT (Free vs Paid+Coupon RSVP gap fix) ────── */}
      {showCoupons && selected && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowCoupons(false)}
        >
          <div className="modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              <FontAwesomeIcon icon={faTag} className="mr-1.5" />
              Coupons — {selected.title}
            </h3>

            {coupons.length > 0 && (
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {coupons.map((c) => (
                  <div
                    key={c.id || c.code}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      background: "var(--nx-panel2)",
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {c.code}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--nx-muted)",
                          marginLeft: 8,
                        }}
                      >
                        {c.discount_type === "free"
                          ? "Free entry"
                          : c.discount_type === "percent"
                            ? `${c.discount_value}% off`
                            : `₹${c.discount_value} off`}
                        {c.max_uses
                          ? ` · ${c.uses_count || 0}/${c.max_uses} used`
                          : ` · ${c.uses_count || 0} used`}
                      </span>
                    </div>
                    {c.is_active ? (
                      <button
                        className="btn btn-xs btn-g"
                        style={{ color: "#ef4444" }}
                        onClick={() => deactivateCoupon(c.code)}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <span className="badge b-gray">Inactive</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#9ca3af",
                marginBottom: 8,
              }}
            >
              NEW COUPON
            </div>
            <div className="form-grid">
              <div className="fg">
                <label>Code</label>
                <input
                  value={newCoupon.code}
                  onChange={(e) =>
                    setNewCoupon({
                      ...newCoupon,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="SAVE20"
                />
              </div>
              <div className="fg">
                <label>Type</label>
                <select
                  value={newCoupon.discount_type}
                  onChange={(e) =>
                    setNewCoupon({
                      ...newCoupon,
                      discount_type: e.target.value,
                    })
                  }
                >
                  <option value="percent">% off</option>
                  <option value="flat">₹ off</option>
                  <option value="free">Free entry</option>
                </select>
              </div>
            </div>
            <div className="form-grid">
              {newCoupon.discount_type !== "free" && (
                <div className="fg">
                  <label>
                    {newCoupon.discount_type === "percent"
                      ? "Percent off"
                      : "Amount off (₹)"}
                  </label>
                  <input
                    type="number"
                    value={newCoupon.discount_value}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        discount_value: e.target.value,
                      })
                    }
                  />
                </div>
              )}
              <div className="fg">
                <label>Max Uses (optional)</label>
                <input
                  type="number"
                  value={newCoupon.max_uses}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, max_uses: e.target.value })
                  }
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={createCoupon}
                disabled={savingCoupon || !newCoupon.code.trim()}
              >
                {savingCoupon ? "Creating…" : "Create Coupon"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setShowCoupons(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ─────────────────────────────────────────────── */}
      {showCreate && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              + Create Event
            </h3>
            <EventForm
              form={form}
              onChange={setForm}
              territories={territories}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={createEvent}
                disabled={saving || !form.title || !form.date}
              >
                {saving ? "Creating…" : "Create Event"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ───────────────────────────────────────────────── */}
      {editing && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              Edit Event — {editing.title}
            </h3>
            <EventForm
              form={form}
              onChange={setForm}
              territories={territories}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={saveEdit}
                disabled={saving || !form.title || !form.date}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
