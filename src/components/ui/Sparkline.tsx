"use client";
// Small sparkline showing the views -> saves -> claims funnel per deal.
// Pure SVG, no chart library dependency — three points is all it needs.

export default function Sparkline({
  views,
  saves,
  claims,
}: {
  views: number;
  saves: number;
  claims: number;
}) {
  const points = [views, saves, claims];
  const max = Math.max(1, ...points);
  const w = 72,
    h = 24,
    pad = 3;
  const coords = points.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (points.length - 1);
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y];
  });
  const path = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ flexShrink: 0 }}
      >
        <path
          d={path}
          fill="none"
          stroke="var(--nx-orange)"
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2} fill="var(--nx-orange)" />
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          gap: 8,
          fontSize: 10,
          color: "var(--nx-muted)",
        }}
      >
        <span>👁 {views}</span>
        <span>🔖 {saves}</span>
        <span>✅ {claims}</span>
      </div>
    </div>
  );
}
