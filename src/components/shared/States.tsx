'use client'
// Reusable loading / error / empty states for all pages
import { useEffect, useState } from 'react'

// A spinner with no explanation looks frozen after a few seconds. After 4s
// say it's still working; after 12s suggest a slow connection and offer a
// reload, so the user is never left staring at an unexplained spinner.
export function Loading({ label = 'Loading…', compact = false }: { label?: string; compact?: boolean }) {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const slow = setTimeout(() => setStage(1), 4000)
    const stuck = setTimeout(() => setStage(2), 12000)
    return () => { clearTimeout(slow); clearTimeout(stuck) }
  }, [])

  const spinner = (size: number, width: number) => ({
    width: size, height: size, flex: 'none' as const,
    border: `${width}px solid var(--nx-line, #e5e7eb)`,
    borderTop: `${width}px solid var(--nx-orange)`,
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  })

  if (compact) {
    return (
      <span role="status" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--nx-muted, #6b7280)', fontSize: 12.5 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={spinner(15, 2)} />{label}
      </span>
    )
  }

  const hint = stage === 1
    ? 'Still working — this is taking a little longer than usual.'
    : stage === 2
      ? "This is slower than expected. Check your internet connection, or reload the page if it doesn't clear."
      : ''

  return (
    <div role="status" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '56px 20px', gap: 12, textAlign: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={spinner(34, 3)} />
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-ink, #111827)' }}>{label}</div>
      <div style={{ fontSize: 12.5, color: 'var(--nx-muted, #6b7280)', maxWidth: 320, minHeight: 18 }}>{hint}</div>
      {stage === 2 && <button className="btn btn-g btn-sm" onClick={() => window.location.reload()}>Reload page</button>}
    </div>
  )
}

export function ApiError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert-warn" style={{ margin: 16, display: 'flex',
      alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span>⚠ {message}</span>
      {onRetry && (
        <button className="btn btn-g btn-sm" onClick={onRetry}>Retry</button>
      )}
    </div>
  )
}

export function Empty({ label = 'No data found' }: { label?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af', fontSize: 13 }}>
      {label}
    </div>
  )
}
