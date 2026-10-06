"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faPlus,
  faArrowLeft,
  faCircleCheck,
  faUpload,
  faFileCsv,
  faPen,
  faCopy,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { CirclesAPI } from "@/lib/api";
import { ApiError, Empty, Loading } from "@/components/shared/States";
import PageHero from "@/components/shared/PageHero";
import UserSearchPicker from "@/components/ui/UserSearchPicker";

const emptyForm = {
  name: "",
  organisation_name: "",
  city: "",
  state: "",
  country: "India",
  description: "",
  logo: "",
};

export default function CirclesAdminPage() {
  const [items, setItems] = useState<any[]>([]),
    [selected, setSelected] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [form, setForm] = useState<any>(emptyForm),
    [showForm, setShowForm] = useState(false),
    [busy, setBusy] = useState(false),
    [msg, setMsg] = useState("");
  const [leaderId, setLeaderId] = useState(""),
    [memberId, setMemberId] = useState("");
  const [batches, setBatches] = useState<any[]>([]),
    [showBatch, setShowBatch] = useState(false);
  const [batchForm, setBatchForm] = useState<any>({
    batch_reference: "",
    payment_amount: 0,
    payment_reference: "",
    payment_date: "",
  });
  const [activeBatch, setActiveBatch] = useState<any | null>(null),
    [preview, setPreview] = useState<any | null>(null),
    [csvFile, setCsvFile] = useState<File | null>(null);
  const [editing, setEditing] = useState(false),
    [editForm, setEditForm] = useState<any>(emptyForm);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await CirclesAPI.list({ page_size: 100 });
      setItems(r.items || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const open = async (c: any) => {
    setSelected(c);
    setLeaderId(c.community_leader_user_id || "");
    setEditForm({ ...emptyForm, ...c });
    setEditing(false);
    setPreview(null);
    setActiveBatch(null);
    const [m, b] = await Promise.allSettled([
      CirclesAPI.members(c.id, { page_size: 100 }),
      CirclesAPI.batches(c.id),
    ]);
    if (m.status === "fulfilled") setMembers(m.value.items || []);
    else {
      setMembers([]);
      setMsg(
        "❌ Could not load Circle members: " +
          (m.reason?.message || "Unknown error"),
      );
    }
    if (b.status === "fulfilled") setBatches(b.value.items || []);
    else {
      setBatches([]);
      setMsg(
        (current) =>
          current ||
          "❌ Onboarding Batch API is not loaded yet — restart the backend server.",
      );
    }
  };
  useEffect(() => {
    load();
  }, []);

  const create = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    try {
      await CirclesAPI.create(form);
      setMsg("✅ Circle created");
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusy(false);
    }
  };
  const status = async (c: any) => {
    setBusy(true);
    try {
      c.status === "active"
        ? await CirclesAPI.deactivate(c.id)
        : await CirclesAPI.activate(c.id);
      setMsg(
        `✅ Circle ${c.status === "active" ? "deactivated" : "activated"}`,
      );
      setSelected(null);
      await load();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusy(false);
    }
  };
  const saveLeader = async () => {
    if (!selected || !leaderId) return;
    setBusy(true);
    try {
      const c = await CirclesAPI.assignLeader(selected.id, leaderId);
      setSelected({ ...selected, ...c });
      setMsg("✅ Community Leader updated");
      await load();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusy(false);
    }
  };
  const addMember = async () => {
    if (!selected || !memberId) return;
    setBusy(true);
    try {
      await CirclesAPI.addMember(selected.id, memberId);
      setMemberId("");
      setMsg("✅ Member added");
      await open(selected);
      await load();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusy(false);
    }
  };
  const removeMember = async (userId: string) => {
    if (!selected || !confirm("Mark this Circle membership inactive?")) return;
    setBusy(true);
    try {
      await CirclesAPI.deactivateMember(selected.id, userId);
      setMsg("✅ Circle membership marked inactive");
      await open(selected);
      await load();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusy(false);
    }
  };
  const createBatch = async (e: any) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const b = await CirclesAPI.createBatch(selected.id, {
        ...batchForm,
        payment_amount: Number(batchForm.payment_amount || 0),
        payment_date: batchForm.payment_date || null,
      });
      setBatches((current) => [b, ...current]);
      setActiveBatch(b);
      setShowBatch(false);
      setBatchForm({
        batch_reference: "",
        payment_amount: 0,
        payment_reference: "",
        payment_date: "",
      });
      setMsg("✅ Onboarding batch created — upload the member CSV next");
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusy(false);
    }
  };
  const uploadPreview = async () => {
    if (!activeBatch || !csvFile) return;
    setBusy(true);
    setPreview(null);
    try {
      const result = await CirclesAPI.previewBatch(activeBatch.id, csvFile);
      setPreview(result);
      setMsg("✅ CSV validated — review all conflicts before confirming");
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusy(false);
    }
  };
  const confirmImport = async () => {
    if (
      !activeBatch ||
      !preview ||
      !confirm(
        `Import ${preview.summary.ready} ready rows? Error and conflict rows will be skipped.`,
      )
    )
      return;
    setBusy(true);
    try {
      const result = await CirclesAPI.importBatch(
        activeBatch.id,
        preview.preview_token,
      );
      setMsg(
        `✅ Import complete: ${result.created} new, ${result.mapped} existing, ${result.skipped} skipped`,
      );
      setPreview(null);
      setCsvFile(null);
      await open(selected);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusy(false);
    }
  };
  const downloadTemplate = () => {
    const csv =
      "Full Name,Mobile Number,Email,Company,Designation,City,State,Country,Membership Plan\nAnanya Sharma,9876543210,ananya@example.com,Example Pvt Ltd,Founder,Bhopal,Madhya Pradesh,India,Basic\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "circle-member-import-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const saveCircle = async (e: any) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const body = {
        name: editForm.name,
        organisation_name: editForm.organisation_name || null,
        city: editForm.city,
        state: editForm.state || null,
        country: editForm.country,
        description: editForm.description || null,
        logo: editForm.logo || null,
      };
      const updated = await CirclesAPI.update(selected.id, body);
      const merged = { ...selected, ...updated };
      setSelected(merged);
      setEditForm({ ...emptyForm, ...merged });
      setEditing(false);
      setMsg("✅ Circle information updated");
      await load();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setBusy(false);
    }
  };
  const publicUrl =
    selected?.public_slug && typeof window !== "undefined"
      ? `${window.location.origin}/community/${encodeURIComponent(selected.public_slug)}`
      : "";

  return (
    <div className="page">
      <PageHero
        icon={faUsers}
        kicker="Partner Communities"
        title="Circles"
        description="Manage partner-community affiliations without changing NetworkX membership permissions."
        stats={[{ icon: faUsers, value: items.length, label: "Circles" }]}
      />
      {msg && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            marginBottom: 14,
            background: msg.startsWith("✅")
              ? "rgba(16,185,129,.1)"
              : "rgba(239,68,68,.1)",
            color: msg.startsWith("✅") ? "#15803d" : "#dc2626",
          }}
        >
          {msg}
        </div>
      )}
      {selected ? (
        <>
          <button
            className="btn btn-g btn-sm"
            onClick={() => setSelected(null)}
            style={{ marginBottom: 12 }}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Circles
          </button>
          <div className="card" style={{ marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 21 }}>{selected.name}</h2>
                <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>
                  {selected.organisation_name || "Partner Community"} ·{" "}
                  {selected.city}, {selected.country}
                </div>
                <p style={{ fontSize: 13, maxWidth: 700 }}>
                  {selected.description}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                {publicUrl && (
                  <>
                    <button
                      className="btn btn-g btn-sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(publicUrl);
                        setMsg("✅ Public Circle link copied");
                      }}
                    >
                      <FontAwesomeIcon icon={faCopy} /> Copy public link
                    </button>
                    <a
                      className="btn btn-g btn-sm"
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> View
                      public page
                    </a>
                  </>
                )}
                <button
                  className="btn btn-g btn-sm"
                  onClick={() => setEditing(!editing)}
                >
                  <FontAwesomeIcon icon={faPen} /> Edit Circle
                </button>
                <button
                  className="btn btn-g btn-sm"
                  disabled={busy}
                  onClick={() => status(selected)}
                >
                  {selected.status === "active"
                    ? "Deactivate Circle"
                    : "Activate Circle"}
                </button>
              </div>
            </div>
            {editing && (
              <form
                onSubmit={saveCircle}
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: "1px solid var(--nx-line)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
                    gap: 10,
                  }}
                >
                  {[
                    ["name", "Circle name *"],
                    ["organisation_name", "Organisation"],
                    ["city", "City *"],
                    ["state", "State"],
                    ["country", "Country *"],
                    ["logo", "Logo URL"],
                  ].map(([key, label]) => (
                    <div className="fg" key={key}>
                      <label>{label}</label>
                      <input
                        required={["name", "city", "country"].includes(key)}
                        value={editForm[key] || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, [key]: e.target.value })
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="fg" style={{ marginTop: 10 }}>
                  <label>Description</label>
                  <textarea
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn btn-p btn-sm" disabled={busy}>
                    Save changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-g btn-sm"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Community Leader</h3>
              <UserSearchPicker
                value={leaderId}
                onChange={(id) => setLeaderId(id)}
                roleFilter="member"
                placeholder="Search active NetworkX member…"
              />
              <button
                className="btn btn-p btn-sm"
                disabled={!leaderId || busy}
                onClick={saveLeader}
                style={{ marginTop: 10 }}
              >
                Assign Leader
              </button>
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Add Member</h3>
              <UserSearchPicker
                value={memberId}
                onChange={(id) => setMemberId(id)}
                placeholder="Search existing NetworkX user…"
              />
              <button
                className="btn btn-p btn-sm"
                disabled={!memberId || busy}
                onClick={addMember}
                style={{ marginTop: 10 }}
              >
                Add to Circle
              </button>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Community Onboarding Batches</h3>
                <p
                  style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}
                >
                  Create a payment batch, validate a CSV, review conflicts, then
                  confirm the safe rows.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-g btn-sm" onClick={downloadTemplate}>
                  <FontAwesomeIcon icon={faFileCsv} /> CSV template
                </button>
                <button
                  className="btn btn-p btn-sm"
                  onClick={() => setShowBatch(!showBatch)}
                >
                  <FontAwesomeIcon icon={faPlus} /> New batch
                </button>
              </div>
            </div>
            {showBatch && (
              <form
                onSubmit={createBatch}
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid var(--nx-line)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                    gap: 10,
                  }}
                >
                  <div className="fg">
                    <label>Batch reference *</label>
                    <input
                      required
                      value={batchForm.batch_reference}
                      onChange={(e) =>
                        setBatchForm({
                          ...batchForm,
                          batch_reference: e.target.value,
                        })
                      }
                      placeholder="TIE-BPL-SEP26"
                    />
                  </div>
                  <div className="fg">
                    <label>Payment amount</label>
                    <input
                      type="number"
                      min="0"
                      value={batchForm.payment_amount}
                      onChange={(e) =>
                        setBatchForm({
                          ...batchForm,
                          payment_amount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="fg">
                    <label>Payment reference</label>
                    <input
                      value={batchForm.payment_reference}
                      onChange={(e) =>
                        setBatchForm({
                          ...batchForm,
                          payment_reference: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="fg">
                    <label>Payment date</label>
                    <input
                      type="date"
                      value={batchForm.payment_date}
                      onChange={(e) =>
                        setBatchForm({
                          ...batchForm,
                          payment_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  className="btn btn-p btn-sm"
                  disabled={busy}
                  style={{ marginTop: 10 }}
                >
                  Create batch
                </button>
              </form>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                gap: 9,
                marginTop: 14,
              }}
            >
              {batches.map((b: any) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveBatch(b);
                    setPreview(null);
                    setCsvFile(null);
                  }}
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderRadius: 10,
                    border: `1px solid ${activeBatch?.id === b.id ? "#3b82f6" : "var(--nx-line)"}`,
                    background: "var(--nx-panel)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <strong>{b.batch_reference}</strong>
                    <span
                      style={{
                        fontSize: 11,
                        textTransform: "capitalize",
                        color: b.status === "imported" ? "#10b981" : "#f59e0b",
                      }}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>
                    {b.total_members || 0} submitted · ₹
                    {Number(b.payment_amount || 0).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
            {activeBatch && activeBatch.status !== "imported" && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid var(--nx-line)",
                }}
              >
                <h4 style={{ margin: "0 0 9px" }}>
                  Upload members for {activeBatch.batch_reference}
                </h4>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                  <button
                    className="btn btn-p btn-sm"
                    disabled={!csvFile || busy}
                    onClick={uploadPreview}
                  >
                    <FontAwesomeIcon icon={faUpload} />{" "}
                    {busy ? "Checking…" : "Validate & preview"}
                  </button>
                </div>
              </div>
            )}
            {preview && (
              <div style={{ marginTop: 15 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5,minmax(90px,1fr))",
                    gap: 8,
                  }}
                >
                  {[
                    ["Total", preview.summary.total],
                    ["Ready", preview.summary.ready],
                    ["New", preview.summary.new_members],
                    ["Existing", preview.summary.existing_members],
                    [
                      "Conflicts / errors",
                      preview.summary.conflicts + preview.summary.errors,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      style={{
                        padding: 10,
                        border: "1px solid var(--nx-line)",
                        borderRadius: 9,
                      }}
                    >
                      <strong style={{ fontSize: 18 }}>{value}</strong>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{ overflowX: "auto", maxHeight: 360, marginTop: 12 }}
                >
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Member</th>
                        <th>Mobile / Email</th>
                        <th>Plan</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((r: any) => (
                        <tr key={r.row_number}>
                          <td>{r.row_number}</td>
                          <td>
                            <strong>{r.name}</strong>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>
                              {r.company} · {r.city}
                            </div>
                          </td>
                          <td>
                            {r.phone}
                            <div style={{ fontSize: 11 }}>{r.email || "—"}</div>
                          </td>
                          <td style={{ textTransform: "capitalize" }}>
                            {r.plan || "—"}
                          </td>
                          <td>
                            <span
                              style={{
                                color:
                                  r.status === "ready"
                                    ? "#10b981"
                                    : r.status === "conflict"
                                      ? "#f59e0b"
                                      : "#ef4444",
                                fontWeight: 700,
                                textTransform: "capitalize",
                              }}
                            >
                              {r.status}
                            </span>
                            <div style={{ fontSize: 11, maxWidth: 320 }}>
                              {r.reason}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 12,
                  }}
                >
                  <button
                    className="btn btn-p"
                    disabled={!preview.summary.ready || busy}
                    onClick={confirmImport}
                  >
                    Confirm import of {preview.summary.ready} ready rows
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Circle Members ({members.length})</h3>
            {members.length === 0 ? (
              <Empty label="No members in this Circle" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {members.map((m: any) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: "1px solid var(--nx-line)",
                    }}
                  >
                    <div>
                      <strong>{m.user?.name || "Member"}</strong>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        {m.user?.email || ""}{" "}
                        {m.user?.company ? `· ${m.user.company}` : ""}
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: m.status === "active" ? "#10b981" : "#9ca3af",
                          textTransform: "capitalize",
                        }}
                      >
                        {m.status}
                      </span>
                      {m.status === "active" && (
                        <button
                          className="btn btn-g btn-sm"
                          disabled={busy}
                          onClick={() => removeMember(m.user_id)}
                        >
                          Mark inactive
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
            }}
          >
            <button
              className="btn btn-p"
              onClick={() => setShowForm(!showForm)}
            >
              <FontAwesomeIcon icon={faPlus} /> Create Circle
            </button>
          </div>
          {showForm && (
            <form
              className="card"
              onSubmit={create}
              style={{ marginBottom: 16 }}
            >
              <h3 style={{ marginTop: 0 }}>New Partner Circle</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
                  gap: 12,
                }}
              >
                {[
                  ["name", "Circle name *"],
                  ["organisation_name", "Organisation"],
                  ["city", "City *"],
                  ["state", "State"],
                  ["country", "Country"],
                  ["logo", "Logo URL"],
                ].map(([key, label]) => (
                  <div className="fg" key={key}>
                    <label>{label}</label>
                    <input
                      required={
                        key === "name" || key === "city" || key === "country"
                      }
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="fg" style={{ marginTop: 12 }}>
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn btn-p" disabled={busy}>
                  Create Circle
                </button>
                <button
                  type="button"
                  className="btn btn-g"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {loading ? (
            <Loading label="Loading Circles…" />
          ) : error ? (
            <ApiError message={error} onRetry={load} />
          ) : items.length === 0 ? (
            <Empty label="No Circles created yet" />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                gap: 12,
              }}
            >
              {items.map((c: any) => (
                <button
                  key={c.id}
                  className="card"
                  onClick={() => open(c)}
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    background: "var(--nx-panel)",
                    border: "1px solid var(--nx-line)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>
                        {c.name}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}
                      >
                        {c.city}
                        {c.state ? `, ${c.state}` : ""} · {c.country}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: c.status === "active" ? "#10b981" : "#9ca3af",
                        textTransform: "capitalize",
                      }}
                    >
                      <FontAwesomeIcon icon={faCircleCheck} /> {c.status}
                    </span>
                  </div>
                  <div style={{ marginTop: 14, fontSize: 13 }}>
                    <strong>{c.active_members || 0}</strong> active members
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                    Leader: {c.community_leader?.name || "Not assigned"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
