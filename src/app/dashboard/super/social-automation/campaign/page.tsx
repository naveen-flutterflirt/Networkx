"use client";
import { Loading } from "@/components/shared/States";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsRotate,
  faWandMagicSparkles,
  faPlay,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import { CampaignAPI } from "@/lib/api";
import { Pagination } from "@/components/shared/Pagination";

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: "#9ca3af", bg: "rgba(156,163,175,.12)" },
  generating: {
    label: "Generating…",
    color: "#3b82f6",
    bg: "rgba(59,130,246,.12)",
  },
  pending_approval: {
    label: "Pending Approval",
    color: "#f59e0b",
    bg: "rgba(245,158,11,.12)",
  },
  published: {
    label: "Published",
    color: "#10b981",
    bg: "rgba(16,185,129,.12)",
  },
  publish_failed: {
    label: "Publish Failed",
    color: "#ef4444",
    bg: "rgba(239,68,68,.12)",
  },
  rejected: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,.12)" },
};

export default function AutoCampaignPage() {
  const [settings, setSettings] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [msg, setMsg] = useState("");
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [runningTopicId, setRunningTopicId] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await CampaignAPI.getSettings();
      setSettings(data);
    } catch (e: any) {
      setMsg("❌ " + (e.message || "Failed to load settings"));
    }
  }, []);

  const fetchTopics = useCallback(async (p = 1) => {
    setTopicsLoading(true);
    try {
      const { items, meta } = await CampaignAPI.listTopics({
        page: p,
        page_size: 20,
      });
      setTopics(items);
      setHasMore(!!meta.has_more);
      setPage(p);
    } catch (e: any) {
      setMsg("❌ " + (e.message || "Failed to load topics"));
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchTopics(1);
  }, [fetchSettings, fetchTopics]);

  const saveSettings = async () => {
    setSavingSettings(true);
    setMsg("");
    try {
      const data = await CampaignAPI.updateSettings(settings);
      setSettings(data);
      setMsg("✅ Settings saved");
    } catch (e: any) {
      setMsg("❌ " + (e.message || "Could not save settings"));
    } finally {
      setSavingSettings(false);
    }
  };

  const generateTopics = async () => {
    setGeneratingTopics(true);
    setMsg("");
    try {
      const created = await CampaignAPI.generateTopics({ count: 5 });
      setMsg(
        `✅ Generated ${created.length} new topic${created.length === 1 ? "" : "s"}`,
      );
      fetchTopics(1);
    } catch (e: any) {
      setMsg("❌ " + (e.message || "Topic generation failed"));
    } finally {
      setGeneratingTopics(false);
    }
  };

  const runTopic = async (topicId: string) => {
    setRunningTopicId(topicId);
    setMsg("");
    try {
      await CampaignAPI.runTopic({
        topic_id: topicId,
        generate_cover_image: true,
      });
      setMsg("✅ Content generated — review it in Campaign Approvals");
      fetchTopics(page);
    } catch (e: any) {
      setMsg("❌ " + (e.message || "Run failed"));
    } finally {
      setRunningTopicId(null);
    }
  };

  if (!settings)
    return (
      <div className="page">
        <Loading label="Loading campaign…" />
      </div>
    );

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <Link
            href="/dashboard/super/social-automation"
            style={{
              fontSize: 12,
              color: "var(--nx-muted)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Social Automation
          </Link>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Auto Campaign</h2>
          <p style={{ fontSize: 13, color: "var(--nx-muted)" }}>
            Picks topics and generates blog + social drafts on a schedule —
            every draft still needs your approval before anything publishes.
          </p>
        </div>
        <Link
          href="/dashboard/super/social-automation/campaign/approvals"
          className="btn btn-g btn-sm"
        >
          <FontAwesomeIcon icon={faClipboardList} className="mr-1.5" />
          Campaign Approvals
        </Link>
      </div>

      {msg && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            marginBottom: 14,
            fontSize: 13,
            background: msg.startsWith("✅")
              ? "rgba(39,216,109,.1)"
              : "rgba(255,90,90,.1)",
            color: msg.startsWith("✅") ? "#16a34a" : "#ef4444",
            border: `1px solid ${msg.startsWith("✅") ? "rgba(39,216,109,.35)" : "rgba(255,90,90,.35)"}`,
          }}
        >
          {msg}
        </div>
      )}

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
          Settings
        </h3>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <input
            type="checkbox"
            checked={!!settings.enabled}
            onChange={(e) =>
              setSettings({ ...settings, enabled: e.target.checked })
            }
          />
          Enabled — the scheduler will pick topics and generate content
          automatically (still requires your approval to publish)
        </label>
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Business focus (steers topic generation)
          </label>
          <textarea
            value={settings.business_focus || ""}
            onChange={(e) =>
              setSettings({ ...settings, business_focus: e.target.value })
            }
            rows={2}
            placeholder="e.g. this quarter: chapter growth, member success stories"
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Weekly limit
            </label>
            <input
              type="number"
              min={0}
              value={settings.weekly_limit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  weekly_limit: Number(e.target.value),
                })
              }
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Monthly limit
            </label>
            <input
              type="number"
              min={0}
              value={settings.monthly_limit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  monthly_limit: Number(e.target.value),
                })
              }
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Min hours between runs
            </label>
            <input
              type="number"
              min={0}
              value={settings.min_hours_between_runs}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  min_hours_between_runs: Number(e.target.value),
                })
              }
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
          {["blog", "facebook", "instagram"].map((ch) => (
            <label
              key={ch}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                textTransform: "capitalize",
              }}
            >
              <input
                type="checkbox"
                checked={!!settings.channels?.[ch]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    channels: { ...settings.channels, [ch]: e.target.checked },
                  })
                }
              />
              {ch}
            </label>
          ))}
        </div>
        <button
          className="btn btn-p btn-sm"
          onClick={saveSettings}
          disabled={savingSettings}
        >
          {savingSettings ? "Saving…" : "Save Settings"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 800 }}>Topic Pool</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-g btn-sm"
            onClick={() => fetchTopics(page)}
            disabled={topicsLoading}
          >
            <FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5" />
            Refresh
          </button>
          <button
            className="btn btn-p btn-sm"
            onClick={generateTopics}
            disabled={generatingTopics}
          >
            {generatingTopics ? (
              "Generating…"
            ) : (
              <>
                <FontAwesomeIcon
                  icon={faWandMagicSparkles}
                  className="mr-1.5"
                />
                Generate Topics Now
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {!topicsLoading && topics.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: "var(--nx-muted)",
            }}
          >
            No topics yet — click "Generate Topics Now".
          </div>
        )}
        {topics.map((t, i) => {
          const meta = STATUS_META[t.status] || {
            label: t.status,
            color: "#9ca3af",
            bg: "rgba(156,163,175,.12)",
          };
          return (
            <div
              key={t.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom:
                  i < topics.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <div style={{ flex: 1, marginRight: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.topic}</div>
                <div style={{ fontSize: 12, color: "var(--nx-muted)" }}>
                  {t.content_category} · {t.angle}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 99,
                  background: meta.bg,
                  color: meta.color,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  marginRight: 12,
                }}
              >
                {meta.label}
              </span>
              {t.status === "pending" && (
                <button
                  className="btn btn-p btn-sm"
                  disabled={runningTopicId === t.id}
                  onClick={() => runTopic(t.id)}
                >
                  <FontAwesomeIcon icon={faPlay} className="mr-1.5" />
                  {runningTopicId === t.id ? "Running…" : "Run"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <Pagination
        page={page}
        pageSize={20}
        hasMore={hasMore}
        onPageChange={fetchTopics}
        loading={topicsLoading}
      />
    </div>
  );
}
