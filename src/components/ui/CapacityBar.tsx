'use client'

export default function CapacityBar({ confirmed, capacity, spotsLeft }: { confirmed: number, capacity: number | null, spotsLeft: number | null }) {
  if (!capacity) return null
  const pct = Math.min(100, Math.round((confirmed / capacity) * 100))
  const isFull = spotsLeft !== null && spotsLeft <= 0
  return (
    <div style={{ marginTop: 8 }}>
      <div className="prog"><div className="prog-fill" style={{ width: `${pct}%`, background: isFull ? '#ff5a5a' : undefined }} /></div>
      <div style={{ fontSize: 11, color: isFull ? '#ff9d9d' : 'var(--nx-muted)', marginTop: 4 }}>
        {isFull ? 'Full — new registrations join the waitlist' : `${confirmed}/${capacity} spots`}
      </div>
    </div>
  )
}
