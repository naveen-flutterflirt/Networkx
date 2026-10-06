"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faClipboard,
  faComment,
  faLocationDot,
  faMobileScreen,
  faVideo,
  faHandshake,
  faUsers,
  faGlobe,
  faGraduationCap,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { MeetingsAPI, AttendanceAPI, TokenStore } from "@/lib/api";
import UserSearchPicker from "@/components/ui/UserSearchPicker";
import { Loading, ApiError, Empty } from "@/components/shared/States";

const MEETING_TYPES = [
  {
    id: "monthly_nln",
    l: "Monthly NLN",
    ic: faCalendarDays,
    desc: "Your chapter monthly meeting",
  },
  {
    id: "1on1",
    l: "1-2-1 Meeting",
    ic: faHandshake,
    desc: "One-on-one with a member",
  },
  {
    id: "group",
    l: "Group Meeting",
    ic: faUsers,
    desc: "Small group collaboration",
  },
  {
    id: "networking",
    l: "Networking Room",
    ic: faGlobe,
    desc: "Open networking session",
  },
  {
    id: "mentorship",
    l: "Mentorship Room",
    ic: faGraduationCap,
    desc: "Learn from experts",
  },
];

const PLATFORMS = ["Google Meet", "Zoom", "Jitsi", "In Person"];

type ScheduleForm = {
  type: string;
  date: string;
  time: string;
  venue: string;
  platform: string;
  link: string;
  zoom_meeting_id: string;
  zoom_password: string;
  agenda: string;
  invitee_id: string;
  invitee: any;
};
type ScheduleErrors = Partial<Record<keyof ScheduleForm, string>>;

function validateSchedule(f: ScheduleForm): ScheduleErrors {
  const errors: ScheduleErrors = {};
  if (!f.date) errors.date = "Date is required";
  if (f.date && new Date(f.date) < new Date(new Date().toDateString()))
    errors.date = "Date cannot be in the past";
  if (!f.time) errors.time = "Time is required";
  if (!f.platform) errors.platform = "Platform is required";
  if (f.type === "1on1" && !f.invitee_id)
    errors.invitee_id = "Select the member you want to meet";
  if (f.type === "monthly_nln" && !f.venue)
    errors.venue = "Venue is required for NLN meetings";
  return errors;
}

// Builds and downloads a real .ics calendar file from a meeting — no fake
// "invite sent" message, this genuinely produces a file the browser can add
// to any calendar app.
function downloadIcs(m: any) {
  // Fix: m.date is already a complete ISO datetime (there's no separate
  // m.time field on the backend at all) — concatenating "T${m.time}:00"
  // onto it produced a malformed double-timestamp string
  // ("...+00:00T00:00:00"), which new Date() silently turns into
  // Invalid Date. The downloaded .ics file was quietly shipping garbage
  // timestamps into people's calendars.
  const start = m.date ? new Date(m.date) : new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NIA One//Meetings//EN",
    "BEGIN:VEVENT",
    `UID:${m.id}@nia-one`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${m.group_name || meetingTypeLabel(m.type)}`,
    `LOCATION:${m.venue || m.platform || ""}`,
    `DESCRIPTION:${(m.agenda || []).join("\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `meeting-${m.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function meetingTypeLabel(type: string) {
  return MEETING_TYPES.find((t) => t.id === type)?.l || type || "Meeting";
}

export default function MeetingsPage() {
  const me = TokenStore.getUser();
  const canManage = ["franchise", "hq_admin", "super_admin"].includes(me?.role);

  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [meetType, setMeetType] = useState("monthly_nln");

  const [showSchedule, setShowSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const emptySchedule: ScheduleForm = {
    type: "monthly_nln",
    date: "",
    time: "19:00",
    venue: "",
    platform: "Google Meet",
    link: "",
    zoom_meeting_id: "",
    zoom_password: "",
    agenda: "",
    invitee_id: "",
    invitee: null,
  };
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(emptySchedule);
  const [scheduleErrors, setScheduleErrors] = useState<ScheduleErrors>({});

  const [busyId, setBusyId] = useState<string | null>(null);
  const [qrMeeting, setQrMeeting] = useState<any | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [qrLoading, setQrLoading] = useState(false);

  const [checkinCode, setCheckinCode] = useState("");
  const [checkinBusy, setCheckinBusy] = useState(false);

  const fetchMeetings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await MeetingsAPI.list({ page: 1 });
      setMeetings(res.items || res || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const filteredMeetings = meetings.filter(
    (m) => (m.type || "monthly_nln") === meetType,
  );

  const openSchedule = () => {
    setScheduleForm({ ...emptySchedule, type: meetType });
    setScheduleErrors({});
    setShowSchedule(true);
  };

  const submitSchedule = async () => {
    const errs = validateSchedule(scheduleForm);
    setScheduleErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const body: any = {
        group_id: me?.group_id,
        territory_id: me?.territory_id,
        type: scheduleForm.type,
        date: scheduleForm.date,
        time: scheduleForm.time,
        venue: scheduleForm.venue,
        platform: scheduleForm.platform,
        link: scheduleForm.link,
        zoom_meeting_id:
          scheduleForm.platform === "Zoom" ? scheduleForm.zoom_meeting_id : "",
        zoom_password:
          scheduleForm.platform === "Zoom" ? scheduleForm.zoom_password : "",
        agenda: scheduleForm.agenda
          ? scheduleForm.agenda
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      };
      if (scheduleForm.type === "1on1" && scheduleForm.invitee_id)
        body.invitee_id = scheduleForm.invitee_id;
      await MeetingsAPI.create(body);
      setShowSchedule(false);
      setMsg("✅ Meeting scheduled!");
      fetchMeetings();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const startMeeting = async (id: string) => {
    setBusyId(id);
    try {
      await MeetingsAPI.start(id);
      setMsg("✅ Meeting started");
      fetchMeetings();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusyId(null);
    }
  };

  const endMeeting = async (id: string) => {
    setBusyId(id);
    try {
      await MeetingsAPI.end(id);
      setMsg("✅ Meeting ended");
      fetchMeetings();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusyId(null);
    }
  };

  const deleteMeeting = async (id: string) => {
    if (!confirm("Delete this meeting?")) return;
    setBusyId(id);
    try {
      await MeetingsAPI.delete(id);
      setMsg("✅ Meeting deleted");
      fetchMeetings();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusyId(null);
    }
  };

  const openQr = async (m: any) => {
    setQrMeeting(m);
    setQrCode("");
    setQrLoading(true);
    try {
      const res = await MeetingsAPI.qr(m.id);
      setQrCode(res.qr_code || res.data?.qr_code || "");
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setQrLoading(false);
    }
  };

  const submitCheckinCode = async () => {
    if (!checkinCode.trim()) return;
    setCheckinBusy(true);
    try {
      const res = await AttendanceAPI.markQr({ qr_code: checkinCode.trim() });
      setMsg("✅ " + (res.message || "Attendance marked!"));
      setCheckinCode("");
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setCheckinBusy(false);
    }
  };

  const checkinGps = async (m: any) => {
    if (!navigator.geolocation) {
      setMsg("❌ GPS is not available on this device");
      return;
    }
    setBusyId(m.id);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await AttendanceAPI.markGps({
            meeting_id: m.id,
            group_id: m.group_id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setMsg("✅ Checked in via GPS!");
        } catch (e: any) {
          setMsg("❌ " + e.message);
        } finally {
          setBusyId(null);
        }
      },
      () => {
        setMsg(
          "❌ Could not get your location — please enable location access",
        );
        setBusyId(null);
      },
    );
  };

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Digital Meetings</h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Monthly NLN, 1-2-1s, group meetings and networking rooms
          </p>
        </div>
        {canManage ? (
          <button className="btn btn-p" onClick={openSchedule}>
            + Schedule Meeting
          </button>
        ) : (
          <button
            className="btn btn-g"
            onClick={() => (window.location.href = "/dashboard/messages")}
          >
            <FontAwesomeIcon icon={faComment} className="mr-1.5" />
            Ask City Partner to Schedule
          </button>
        )}
      </div>

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

      {!canManage && (
        <div className="alert-info" style={{ marginBottom: 16 }}>
          Only your City Partner can schedule meetings for the group. Reach out
          via Messages if you'd like one arranged.
        </div>
      )}

      {/* Meeting type selector */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {MEETING_TYPES.map((t) => (
          <div
            key={t.id}
            onClick={() => setMeetType(t.id)}
            style={{
              border: `2px solid ${meetType === t.id ? "var(--nx-orange)" : "var(--nx-line)"}`,
              borderRadius: 12,
              padding: "12px",
              cursor: "pointer",
              transition: "all .15s",
              textAlign: "center",
              background:
                meetType === t.id ? "rgba(255,91,10,.08)" : "var(--nx-panel)",
            }}
          >
            <div
              style={{
                fontSize: 22,
                marginBottom: 4,
                color:
                  meetType === t.id ? "var(--nx-orange)" : "var(--nx-muted)",
              }}
            >
              <FontAwesomeIcon icon={t.ic} />
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: meetType === t.id ? "var(--nx-orange)" : "var(--nx-ink)",
              }}
            >
              {t.l}
            </div>
            <div
              style={{ fontSize: 10, color: "var(--nx-muted)", marginTop: 2 }}
            >
              {t.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Real meetings list — filtered by selected type */}
      {loading ? (
        <Loading label="Loading meetings…" />
      ) : error ? (
        <ApiError message={error} onRetry={fetchMeetings} />
      ) : filteredMeetings.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            <FontAwesomeIcon
              icon={
                MEETING_TYPES.find((t) => t.id === meetType)?.ic ||
                faCalendarDays
              }
            />
          </div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            No {meetingTypeLabel(meetType)} meetings yet
          </div>
          {canManage ? (
            <button
              className="btn btn-p btn-sm"
              style={{ marginTop: 8 }}
              onClick={openSchedule}
            >
              Schedule One
            </button>
          ) : (
            <div style={{ fontSize: 12 }}>
              Your City Partner hasn't scheduled one yet.
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredMeetings.map((m) => (
            <div key={m.id} className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {meetingTypeLabel(m.type)}
                    {m.group_name ? ` — ${m.group_name}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    {m.date
                      ? new Date(m.date).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}{" "}
                    · {m.venue || m.platform || "—"}
                  </div>
                  {m.visitors_count > 0 && (
                    <div
                      style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}
                    >
                      Platform: {m.platform || "—"} · {m.visitors_count}{" "}
                      visitors expected
                    </div>
                  )}
                </div>
                <span
                  className={`badge ${m.status === "upcoming" ? "b-blue" : m.status === "live" ? "b-red" : "b-gray"}`}
                >
                  {m.status}
                </span>
              </div>

              {m.agenda?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}
                  >
                    <FontAwesomeIcon icon={faClipboard} className="mr-1.5" />
                    Agenda
                  </div>
                  <ol style={{ paddingLeft: 16 }}>
                    {m.agenda.map((a: string, i: number) => (
                      <li
                        key={i}
                        style={{
                          fontSize: 12,
                          color: "#cbd5e1",
                          marginBottom: 3,
                        }}
                      >
                        {a}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {m.platform === "Zoom" &&
                (m.zoom_meeting_id || m.zoom_password) && (
                  <div
                    style={{
                      background: "rgba(255,255,255,.04)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      marginBottom: 12,
                      fontSize: 12,
                      display: "flex",
                      gap: 16,
                    }}
                  >
                    {m.zoom_meeting_id && (
                      <div>
                        <span style={{ color: "#9ca3af" }}>Meeting ID: </span>
                        <strong>{m.zoom_meeting_id}</strong>
                      </div>
                    )}
                    {m.zoom_password && (
                      <div>
                        <span style={{ color: "#9ca3af" }}>Passcode: </span>
                        <strong>{m.zoom_password}</strong>
                      </div>
                    )}
                  </div>
                )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {m.status === "upcoming" && m.link && (
                  <button
                    className="btn btn-p btn-sm"
                    onClick={() => window.open(m.link, "_blank")}
                  >
                    <FontAwesomeIcon icon={faVideo} className="mr-1.5" />
                    Join via {m.platform || "link"}
                  </button>
                )}
                {m.status === "upcoming" && (
                  <button
                    className="btn btn-g btn-sm"
                    onClick={() => downloadIcs(m)}
                  >
                    <FontAwesomeIcon icon={faCalendarDays} className="mr-1.5" />
                    Add to Calendar
                  </button>
                )}
                {m.status === "live" && (
                  <button
                    className="btn btn-g btn-sm"
                    onClick={() => checkinGps(m)}
                    disabled={busyId === m.id}
                  >
                    <FontAwesomeIcon icon={faLocationDot} className="mr-1.5" />
                    Check In (GPS)
                  </button>
                )}

                {canManage && m.status === "upcoming" && (
                  <button
                    className="btn btn-p btn-sm"
                    onClick={() => startMeeting(m.id)}
                    disabled={busyId === m.id}
                  >
                    🔴 Start Meeting
                  </button>
                )}
                {canManage && m.status === "live" && (
                  <button
                    className="btn btn-g btn-sm"
                    onClick={() => endMeeting(m.id)}
                    disabled={busyId === m.id}
                  >
                    ⏹ End Meeting
                  </button>
                )}
                {canManage &&
                  (m.status === "upcoming" || m.status === "live") && (
                    <button
                      className="btn btn-g btn-sm"
                      onClick={() => openQr(m)}
                    >
                      <FontAwesomeIcon
                        icon={faMobileScreen}
                        className="mr-1.5"
                      />
                      QR Code
                    </button>
                  )}
                {canManage && (
                  <button
                    className="btn btn-g btn-sm"
                    style={{ color: "#ef4444" }}
                    onClick={() => deleteMeeting(m.id)}
                    disabled={busyId === m.id}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Self check-in with a meeting code (from the City Partner's QR screen) */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
          <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5" />
          Have a meeting code?
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
          Enter the code shown by your City Partner to mark your attendance
          instantly.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={checkinCode}
            onChange={(e) => setCheckinCode(e.target.value)}
            placeholder="Meeting code"
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-p btn-sm"
            onClick={submitCheckinCode}
            disabled={checkinBusy || !checkinCode.trim()}
          >
            {checkinBusy ? "Checking in…" : "Check In"}
          </button>
        </div>
      </div>

      {/* Instant rooms — real external meeting links, no backend record needed */}
      {meetType === "group" && (
        <div
          className="card"
          style={{ textAlign: "center", padding: 40, marginTop: 16 }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Start an Instant Group Room
          </div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
            Open a live room right now — no need to wait for a scheduled meeting
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn btn-p"
              style={{ padding: "12px 24px" }}
              onClick={() =>
                window.open("https://meet.google.com/new", "_blank")
              }
            >
              <FontAwesomeIcon icon={faVideo} className="mr-1.5" />
              Google Meet
            </button>
            <button
              className="btn btn-g"
              style={{ padding: "12px 24px" }}
              onClick={() =>
                window.open("https://zoom.us/start/videomeeting", "_blank")
              }
            >
              <FontAwesomeIcon icon={faVideo} className="mr-1.5" />
              Zoom
            </button>
            <button
              className="btn btn-g"
              style={{ padding: "12px 24px" }}
              onClick={() =>
                window.open(
                  "https://meet.jit.si/nia-group-" + Date.now(),
                  "_blank",
                )
              }
            >
              🔵 Jitsi
            </button>
          </div>
        </div>
      )}
      {meetType === "networking" && (
        <div
          className="card"
          style={{ textAlign: "center", padding: 40, marginTop: 16 }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            <FontAwesomeIcon icon={faGlobe} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Open Networking Room
          </div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
            Join an open room for casual networking
          </div>
          <button
            className="btn btn-p"
            style={{ padding: "12px 24px" }}
            onClick={() =>
              window.open("https://meet.jit.si/nia-networking", "_blank")
            }
          >
            Join Room
          </button>
        </div>
      )}
      {meetType === "mentorship" && (
        <div
          className="card"
          style={{ textAlign: "center", padding: 40, marginTop: 16 }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Mentorship Rooms
          </div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
            Reach out to have a mentorship session scheduled for your group
          </div>
          <button
            className="btn btn-p"
            style={{ padding: "12px 24px" }}
            onClick={() => (window.location.href = "/dashboard/messages")}
          >
            <FontAwesomeIcon icon={faComment} className="mr-1.5" />
            Contact City Partner
          </button>
        </div>
      )}

      {/* ── SCHEDULE MEETING MODAL ───────────────────────────────────── */}
      {showSchedule && (
        <div
          className="overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setShowSchedule(false)
          }
        >
          <div className="modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              <FontAwesomeIcon icon={faCalendarDays} className="mr-1.5" />
              Schedule a Meeting
            </h3>
            <div className="fg">
              <label>Meeting Type</label>
              <select
                value={scheduleForm.type}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, type: e.target.value })
                }
              >
                {MEETING_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.l}
                  </option>
                ))}
              </select>
            </div>
            {scheduleForm.type === "1on1" && (
              <UserSearchPicker
                label="With Member"
                required
                value={scheduleForm.invitee_id}
                onChange={(id, user) =>
                  setScheduleForm({
                    ...scheduleForm,
                    invitee_id: id,
                    invitee: user,
                  })
                }
                placeholder="Search member name, email or city…"
              />
            )}
            {scheduleErrors.invitee_id && (
              <div className="field-error">{scheduleErrors.invitee_id}</div>
            )}
            <div className="form-grid">
              <div className="fg">
                <label>Date *</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, date: e.target.value })
                  }
                />
                {scheduleErrors.date && (
                  <div className="field-error">{scheduleErrors.date}</div>
                )}
              </div>
              <div className="fg">
                <label>Time *</label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, time: e.target.value })
                  }
                />
                {scheduleErrors.time && (
                  <div className="field-error">{scheduleErrors.time}</div>
                )}
              </div>
            </div>
            <div className="fg">
              <label>Platform *</label>
              <select
                value={scheduleForm.platform}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, platform: e.target.value })
                }
              >
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              {scheduleErrors.platform && (
                <div className="field-error">{scheduleErrors.platform}</div>
              )}
            </div>
            {scheduleForm.platform !== "In Person" ? (
              <>
                <div className="fg">
                  <label>Meeting Link</label>
                  <input
                    value={scheduleForm.link}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, link: e.target.value })
                    }
                    placeholder="https://…"
                  />
                </div>
                {scheduleForm.platform === "Zoom" && (
                  <div className="form-grid">
                    <div className="fg">
                      <label>Zoom Meeting ID</label>
                      <input
                        value={scheduleForm.zoom_meeting_id}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            zoom_meeting_id: e.target.value,
                          })
                        }
                        placeholder="123 4567 8900"
                      />
                    </div>
                    <div className="fg">
                      <label>Passcode</label>
                      <input
                        value={scheduleForm.zoom_password}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            zoom_password: e.target.value,
                          })
                        }
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="fg">
                <label>
                  Venue{scheduleForm.type === "monthly_nln" ? " *" : ""}
                </label>
                <input
                  value={scheduleForm.venue}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, venue: e.target.value })
                  }
                  placeholder="Hotel / office address"
                />
                {scheduleErrors.venue && (
                  <div className="field-error">{scheduleErrors.venue}</div>
                )}
              </div>
            )}
            <div className="fg">
              <label>Agenda / Notes</label>
              <textarea
                rows={3}
                value={scheduleForm.agenda}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, agenda: e.target.value })
                }
                placeholder="One agenda item per line…"
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={submitSchedule}
                disabled={saving}
              >
                {saving ? "Scheduling…" : "Schedule"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setShowSchedule(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR CODE MODAL ────────────────────────────────────────────── */}
      {qrMeeting && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setQrMeeting(null)}
        >
          <div className="modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              <FontAwesomeIcon icon={faMobileScreen} className="mr-1.5" />
              Meeting Check-in Code
            </h3>
            {qrLoading ? (
              <Loading label="Fetching code…" />
            ) : (
              <>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div
                    style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}
                  >
                    Members enter this code on their Meetings page to check in
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 20,
                      fontWeight: 800,
                      letterSpacing: 1,
                      background: "rgba(255,255,255,.04)",
                      border: "1px solid var(--nx-line)",
                      borderRadius: 10,
                      padding: "16px",
                      wordBreak: "break-all",
                    }}
                  >
                    {qrCode || "—"}
                  </div>
                </div>
                <div
                  style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}
                >
                  {meetingTypeLabel(qrMeeting.type)} ·{" "}
                  {qrMeeting.date
                    ? new Date(qrMeeting.date).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"}
                </div>
              </>
            )}
            <button
              className="btn btn-g"
              style={{ width: "100%" }}
              onClick={() => setQrMeeting(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
