"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxArchive,
  faRotateLeft,
  faTrash,
  faTriangleExclamation,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { MembersAPI } from "@/lib/api";
import { Loading, ApiError } from "@/components/shared/States";

const TIER_LABEL: Record<string, string> = {
  connect: "Connect",
  growth: "Growth",
  elite: "Elite",
  city_leadership: "City Leadership",
  national: "National",
  global: "Global",
};

export default function HQTiersPage() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [permissionLabels, setPermissionLabels] = useState<
    Record<string, string>
  >({});
  const [benefitCatalog, setBenefitCatalog] = useState<
    Record<string, { options: string[]; is_boolean: boolean }>
  >({});
  const [archivedRows, setArchivedRows] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [newBenefitName, setNewBenefitName] = useState("");
  const [customValueRow, setCustomValueRow] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const emptyNewTier = {
    id: "",
    name: "",
    price_numeric: "",
    price: "",
    price_usd_numeric: "",
    price_usd: "",
    type: "Digital",
    permissions: {} as Record<string, boolean>,
  };
  const [newTier, setNewTier] = useState<any>(emptyNewTier);
  const [creating, setCreating] = useState(false);

  const fetchTiers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await MembersAPI.tiers();
      setTiers(res.items || res || []);
      setPermissionLabels(res.permission_labels || {});
      setBenefitCatalog(res.benefit_catalog || {});
      setArchivedRows(res.archived_benefit_rows || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const openCreate = () => {
    setNewTier({
      ...emptyNewTier,
      permissions: Object.keys(permissionLabels).reduce(
        (acc: Record<string, boolean>, key) => {
          acc[key] = false;
          return acc;
        },
        {},
      ),
    });
    setShowCreate(true);
  };

  const togglePerm = (key: string) =>
    setNewTier((prev: any) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));

  const createTier = async () => {
    if (!newTier.id.trim() || !newTier.name.trim()) {
      setMsg("❌ Tier ID and name are required");
      return;
    }
    setCreating(true);
    try {
      await MembersAPI.createTier({
        id: newTier.id.trim().toLowerCase(),
        name: newTier.name.trim(),
        price_numeric: newTier.price_numeric
          ? Number(newTier.price_numeric)
          : null,
        price: newTier.price || "TBD",
        price_usd_numeric: newTier.price_usd_numeric
          ? Number(newTier.price_usd_numeric)
          : null,
        price_usd: newTier.price_usd || "TBD",
        type: newTier.type,
        permissions: newTier.permissions,
      });
      setMsg("✅ Tier created");
      setShowCreate(false);
      fetchTiers();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteTier = async (tier: string) => {
    if (!confirm(`Delete the "${tier}" tier? This can't be undone.`)) return;
    try {
      await MembersAPI.deleteTier(tier);
      setMsg("✅ Tier deleted");
      fetchTiers();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  const openEdit = (t: any) => {
    setCustomValueRow(null);
    setEditing({
      tier: t.tier,
      is_custom: !!t.is_custom,
      price_numeric: t.price_numeric ?? "",
      price: t.price || "",
      price_usd_numeric: t.price_usd_numeric ?? "",
      price_usd: t.price_usd || "",
      type: t.type || "Digital",
      benefits: { ...(t.benefits || {}) },
      permissions: Object.keys(permissionLabels).reduce(
        (acc: Record<string, boolean>, key) => {
          acc[key] = !!(t.permissions || {})[key];
          return acc;
        },
        {},
      ),
    });
  };

  const togglePermission = (key: string) => {
    setEditing((prev: any) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  const setBenefitValue = (feature: string, value: string) => {
    setEditing((prev: any) => ({
      ...prev,
      benefits: { ...prev.benefits, [feature]: value },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await MembersAPI.updateTier(editing.tier, {
        price_numeric:
          editing.price_numeric === "" ? null : Number(editing.price_numeric),
        price: editing.price,
        price_usd_numeric:
          editing.price_usd_numeric === ""
            ? null
            : Number(editing.price_usd_numeric),
        price_usd: editing.price_usd,
        type: editing.type,
        benefits: editing.benefits,
        permissions: editing.permissions,
      });
      setMsg(`✅ ${TIER_LABEL[editing.tier]} tier updated`);
      setEditing(null);
      fetchTiers();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const resetTier = async () => {
    if (
      !confirm(
        `Reset ${TIER_LABEL[editing.tier]} back to defaults? This overwrites price, benefits and permissions — your edits will be lost.`,
      )
    )
      return;
    setSaving(true);
    try {
      await MembersAPI.resetTier(editing.tier);
      setMsg(`✅ ${TIER_LABEL[editing.tier]} reset to defaults`);
      setEditing(null);
      fetchTiers();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const archiveRow = async (feature: string) => {
    if (
      !confirm(
        `Archive "${feature}"? It's hidden from all 6 tiers but not deleted — you can restore it later.`,
      )
    )
      return;
    try {
      await MembersAPI.archiveBenefitRow(feature);
      setMsg(`✅ Archived "${feature}"`);
      // Reflect locally so the row disappears from the open modal immediately
      setEditing((prev: any) => {
        if (!prev) return prev;
        const benefits = { ...prev.benefits };
        delete benefits[feature];
        return { ...prev, benefits };
      });
      fetchTiers();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  const restoreRow = async (feature: string) => {
    try {
      await MembersAPI.restoreBenefitRow(feature);
      setMsg(`✅ Restored "${feature}"`);
      fetchTiers();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  const addBenefitRow = async () => {
    const name = newBenefitName.trim();
    if (!name) return;
    try {
      await MembersAPI.addBenefitRow(name);
      setMsg(`✅ Added "${name}" to all 6 tiers`);
      setNewBenefitName("");
      fetchTiers();
      // Re-open the same tier's editor with the fresh row included
      if (editing) {
        const fresh = await MembersAPI.tiers();
        const t = (fresh.items || []).find((x: any) => x.tier === editing.tier);
        if (t) openEdit(t);
      }
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  if (loading)
    return (
      <div className="page">
        <Loading label="Loading tiers…" />
      </div>
    );
  if (error)
    return (
      <div className="page">
        <ApiError message={error} onRetry={fetchTiers} />
      </div>
    );

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Membership Tiers</h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Edit pricing, benefits and permissions here — this lives in
            Firestore, not hardcoded in the app. No code deploy needed.
          </p>
        </div>
        <button className="btn btn-p" onClick={openCreate}>
          + Create Tier
        </button>
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))",
          gap: 14,
        }}
      >
        {tiers.map((t) => {
          const needsPricing = t.price_numeric == null;
          const benefitEntries = Object.entries(t.benefits || {});
          const previewBenefits = benefitEntries
            .filter(([, v]) => v && v !== "❌")
            .slice(0, 3);
          return (
            <div key={t.tier} className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {TIER_LABEL[t.tier] || t.tier}
                </div>
                <span
                  className={`badge ${t.type === "Digital" ? "b-blue" : "b-orange"}`}
                >
                  {t.type}
                </span>
              </div>

              {needsPricing ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: "rgba(245,158,11,.12)",
                    border: "1px solid rgba(245,158,11,.3)",
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: "#fbc568" }}
                  >
                    <FontAwesomeIcon
                      icon={faTriangleExclamation}
                      className="mr-1.5"
                    />
                    Needs Pricing
                  </span>
                </div>
              ) : (
                <div
                  className="stat-num"
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "var(--nx-orange)",
                    marginBottom: 2,
                  }}
                >
                  {t.price}
                </div>
              )}
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginBottom: t.type === "Digital" ? 4 : 12,
                }}
              >
                {needsPricing
                  ? "price not yet set (India)"
                  : "per year — India"}
              </div>
              {/* Outside-India price is a separate, independently-editable
                  amount — currently 0/free on the self-serve tiers as a
                  temporary promotion; shown here so it isn't invisible
                  next to the India price. */}
              {t.type === "Digital" && (
                <div
                  style={{
                    fontSize: 11,
                    color:
                      (t.price_usd_numeric ?? null) === 0
                        ? "#16a34a"
                        : "#9ca3af",
                    marginBottom: 12,
                  }}
                >
                  Outside India:{" "}
                  <strong>
                    {t.price_usd_numeric === 0
                      ? "Free"
                      : t.price_usd || "not set"}
                  </strong>
                </div>
              )}

              {/* Real example benefits instead of a bare row count */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  marginBottom: 12,
                  minHeight: 22,
                }}
              >
                {previewBenefits.map(([name, val]) => (
                  <span
                    key={name}
                    className="badge b-gray"
                    style={{ fontSize: 10 }}
                    title={name}
                  >
                    {String(val)}{" "}
                    {name.length > 22 ? name.slice(0, 22) + "…" : name}
                  </span>
                ))}
                {benefitEntries.length > 3 && (
                  <span style={{ fontSize: 11, color: "var(--nx-muted)" }}>
                    +{benefitEntries.length - 3} more
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 4,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                {Object.keys(permissionLabels).map((key) => (
                  <span
                    key={key}
                    className={`badge ${t.permissions?.[key] ? "b-green" : "b-gray"}`}
                    title={permissionLabels[key]}
                  >
                    {t.permissions?.[key] ? (
                      <FontAwesomeIcon icon={faCircleCheck} className="mr-1" />
                    ) : (
                      "—"
                    )}{" "}
                    {key.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
              <button
                className="btn btn-p btn-sm"
                style={{ width: "100%" }}
                onClick={() => openEdit(t)}
              >
                Edit Tier
              </button>
              {t.is_custom && (
                <button
                  className="btn btn-g btn-sm"
                  style={{ width: "100%", marginTop: 6, color: "#ef4444" }}
                  onClick={() => deleteTier(t.tier)}
                >
                  Delete Tier
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Archived benefit rows — soft-deleted, restorable, not gone */}
      {archivedRows.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => setShowArchived(!showArchived)}
          >
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              <FontAwesomeIcon icon={faBoxArchive} className="mr-1.5" />
              Archived Benefit Rows ({archivedRows.length})
            </div>
            <span style={{ fontSize: 12, color: "var(--nx-muted)" }}>
              {showArchived ? "▲ Hide" : "▼ Show"}
            </span>
          </div>
          {showArchived && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {archivedRows.map((name) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 10px",
                    background: "var(--nx-panel2)",
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontSize: 12.5 }}>{name}</span>
                  <button
                    className="btn btn-xs btn-g"
                    onClick={() => restoreRow(name)}
                  >
                    <FontAwesomeIcon icon={faRotateLeft} className="mr-1.5" />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EDIT MODAL ─────────────────────────────────────────────── */}
      {editing && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
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
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                Edit {TIER_LABEL[editing.tier] || editing.tier}
              </h3>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn btn-xs btn-g"
                  style={{ color: "#ef4444" }}
                  onClick={resetTier}
                  disabled={saving}
                >
                  <FontAwesomeIcon icon={faRotateLeft} className="mr-1.5" />
                  Reset to Defaults
                </button>
                {editing.is_custom && (
                  <button
                    className="btn btn-xs btn-g"
                    style={{ color: "#ef4444" }}
                    onClick={() => {
                      deleteTier(editing.tier);
                      setEditing(null);
                    }}
                    disabled={saving}
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-1.5" />
                    Delete Tier
                  </button>
                )}
              </div>
            </div>
            <div className="form-grid">
              <div className="fg">
                <label>Price (numeric, ₹/year — India)</label>
                <input
                  type="number"
                  value={editing.price_numeric}
                  onChange={(e) =>
                    setEditing({ ...editing, price_numeric: e.target.value })
                  }
                  placeholder="Leave blank if still TBD"
                />
              </div>
              <div className="fg">
                <label>Price (display text — India)</label>
                <input
                  value={editing.price}
                  onChange={(e) =>
                    setEditing({ ...editing, price: e.target.value })
                  }
                  placeholder="₹1,999 or TBD"
                />
              </div>
              <div className="fg">
                <label>Price (numeric, $/year — outside India)</label>
                <input
                  type="number"
                  value={editing.price_usd_numeric}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      price_usd_numeric: e.target.value,
                    })
                  }
                  placeholder="0 = free"
                />
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  0 means new non-India registrants join free and start active
                  immediately — no payment step.
                </div>
              </div>
              <div className="fg">
                <label>Price (display text — outside India)</label>
                <input
                  value={editing.price_usd}
                  onChange={(e) =>
                    setEditing({ ...editing, price_usd: e.target.value })
                  }
                  placeholder="$99 or Free"
                />
              </div>
              <div className="fg">
                <label>Type</label>
                <select
                  value={editing.type}
                  onChange={(e) =>
                    setEditing({ ...editing, type: e.target.value })
                  }
                >
                  <option value="Digital">Digital</option>
                  <option value="Physical">Physical</option>
                </select>
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#9ca3af",
                margin: "4px 0 8px",
              }}
            >
              PERMISSIONS — what this tier actually unlocks (enforced in code,
              not just marketing copy)
            </div>
            <div
              style={{
                border: "1px solid var(--nx-line)",
                borderRadius: 8,
                padding: 10,
                marginBottom: 16,
              }}
            >
              {Object.keys(permissionLabels).length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--nx-muted)" }}>
                  No gated permissions defined yet.
                </div>
              ) : (
                Object.entries(permissionLabels).map(([key, label]) => (
                  <label
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "7px 4px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!editing.permissions[key]}
                      onChange={() => togglePermission(key)}
                      style={{
                        width: 16,
                        height: 16,
                        marginTop: 2,
                        flexShrink: 0,
                        accentColor: "var(--nx-orange)",
                      }}
                    />
                    <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 600, color: "var(--nx-ink)" }}>
                        {key.replace(/_/g, " ")}
                      </span>
                      <br />
                      <span style={{ color: "var(--nx-muted)" }}>
                        {label as string}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#9ca3af",
                margin: "0 0 8px",
              }}
            >
              BENEFITS ({Object.keys(editing.benefits || {}).length}) —
              checkboxes where the real data is yes/no, dropdowns of known
              wording everywhere else
            </div>
            <div
              style={{
                maxHeight: 320,
                overflowY: "auto",
                border: "1px solid var(--nx-line)",
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
              }}
            >
              {Object.entries(editing.benefits || {}).map(
                ([feature, value]: [string, any]) => {
                  const catalogEntry = benefitCatalog[feature];
                  const isBoolean = catalogEntry
                    ? catalogEntry.is_boolean
                    : true;
                  const options = catalogEntry ? catalogEntry.options : [];
                  const isCustomMode =
                    customValueRow === feature ||
                    (!isBoolean &&
                      String(value) &&
                      !options.includes(String(value)));

                  return (
                    <div
                      key={feature}
                      className="fg"
                      style={{
                        marginBottom: 10,
                        paddingBottom: 10,
                        borderBottom: "1px solid var(--nx-line)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <label style={{ fontSize: 11, marginBottom: 0 }}>
                          {feature}
                        </label>
                        <button
                          type="button"
                          className="btn btn-xs btn-g"
                          style={{ color: "#ef4444" }}
                          onClick={() => archiveRow(feature)}
                          title="Archive this row (hides from all tiers, doesn't delete data)"
                        >
                          🗑
                        </button>
                      </div>

                      {isBoolean ? (
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={value === "✅"}
                            onChange={(e) =>
                              setBenefitValue(
                                feature,
                                e.target.checked ? "✅" : "❌",
                              )
                            }
                            style={{
                              width: 16,
                              height: 16,
                              flexShrink: 0,
                              accentColor: "var(--nx-orange)",
                            }}
                          />
                          <span
                            style={{ fontSize: 12.5, color: "var(--nx-muted)" }}
                          >
                            {value === "✅" ? "Included" : "Not included"}
                          </span>
                        </label>
                      ) : isCustomMode ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <input
                            value={value ?? ""}
                            onChange={(e) =>
                              setBenefitValue(feature, e.target.value)
                            }
                            placeholder="Custom value…"
                          />
                          {options.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-xs btn-g"
                              onClick={() => setCustomValueRow(null)}
                            >
                              Use list
                            </button>
                          )}
                        </div>
                      ) : (
                        <select
                          value={
                            options.includes(String(value)) ? String(value) : ""
                          }
                          onChange={(e) => {
                            if (e.target.value === "__custom__") {
                              setCustomValueRow(feature);
                              return;
                            }
                            setBenefitValue(feature, e.target.value);
                          }}
                        >
                          <option value="" disabled>
                            — choose —
                          </option>
                          {options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                          <option value="__custom__">Custom…</option>
                        </select>
                      )}
                    </div>
                  );
                },
              )}
            </div>

            {/* Add a brand-new benefit row (P1 gap: configurable master data, not a hardcoded array) */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              <input
                value={newBenefitName}
                onChange={(e) => setNewBenefitName(e.target.value)}
                placeholder="New benefit row name…"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-g btn-sm"
                onClick={addBenefitRow}
                disabled={!newBenefitName.trim()}
              >
                + Add Row
              </button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={save}
                disabled={saving}
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

      {showCreate && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              Create New Tier
            </h3>
            <div className="form-grid" style={{ marginBottom: 12 }}>
              <div className="fg">
                <label>Tier ID *</label>
                <input
                  value={newTier.id}
                  onChange={(e) =>
                    setNewTier({ ...newTier, id: e.target.value })
                  }
                  placeholder="e.g. ambassador"
                />
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  Lowercase, letters/numbers/underscores only
                </div>
              </div>
              <div className="fg">
                <label>Display Name *</label>
                <input
                  value={newTier.name}
                  onChange={(e) =>
                    setNewTier({ ...newTier, name: e.target.value })
                  }
                  placeholder="e.g. Ambassador"
                />
              </div>
              <div className="fg">
                <label>Price (numeric, ₹/year — India)</label>
                <input
                  type="number"
                  value={newTier.price_numeric}
                  onChange={(e) =>
                    setNewTier({ ...newTier, price_numeric: e.target.value })
                  }
                />
              </div>
              <div className="fg">
                <label>Price (display text — India)</label>
                <input
                  value={newTier.price}
                  onChange={(e) =>
                    setNewTier({ ...newTier, price: e.target.value })
                  }
                  placeholder="₹1,999 or TBD"
                />
              </div>
              <div className="fg">
                <label>Price (numeric, $/year — outside India)</label>
                <input
                  type="number"
                  value={newTier.price_usd_numeric}
                  onChange={(e) =>
                    setNewTier({
                      ...newTier,
                      price_usd_numeric: e.target.value,
                    })
                  }
                  placeholder="0 = free"
                />
              </div>
              <div className="fg">
                <label>Price (display text — outside India)</label>
                <input
                  value={newTier.price_usd}
                  onChange={(e) =>
                    setNewTier({ ...newTier, price_usd: e.target.value })
                  }
                  placeholder="$99 or TBD"
                />
              </div>
              <div className="fg">
                <label>Type</label>
                <select
                  value={newTier.type}
                  onChange={(e) =>
                    setNewTier({ ...newTier, type: e.target.value })
                  }
                >
                  <option value="Digital">Digital</option>
                  <option value="Physical">Physical</option>
                </select>
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#9ca3af",
                marginBottom: 10,
              }}
            >
              PERMISSIONS — what this tier actually unlocks (enforced in code)
            </div>
            <div
              style={{
                border: "1px solid var(--nx-line)",
                borderRadius: 10,
                padding: 14,
                marginBottom: 14,
              }}
            >
              {Object.entries(permissionLabels).map(([key, label]) => (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginBottom: 12,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!newTier.permissions[key]}
                    onChange={() => togglePerm(key)}
                    style={{ width: "auto", marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {key.replace(/_/g, " ")}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      {label}
                    </div>
                  </div>
                </label>
              ))}
              {Object.keys(permissionLabels).length === 0 && (
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  No gated permissions defined yet.
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
                marginBottom: 14,
                background: "rgba(255,255,255,.04)",
                borderRadius: 8,
                padding: "10px 12px",
              }}
            >
              These permission checkboxes and pricing work immediately after
              creating this tier. Ranked "minimum tier X" comparisons (used by a
              couple of gated features) won't recognize a custom tier's position
              — only the 6 built-in tiers are ranked.
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={createTier}
                disabled={creating}
              >
                {creating ? "Creating…" : "Create Tier"}
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
    </div>
  );
}
