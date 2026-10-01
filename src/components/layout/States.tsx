// Reusable loading / error / empty states for all pages

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 20px', gap: 12, color: '#9ca3af' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #f3f4f6',
        borderTop: '3px solid var(--nx-orange)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: 13 }}>{label}</div>
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
