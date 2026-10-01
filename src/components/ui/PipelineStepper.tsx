'use client'
// Horizontal stepper across the top of a referral card — "shipping
// tracker" visual language: past stages are muted green checkmarks,
// the current stage is highlighted in orange, future stages are dim.
// Handles the two terminal off-ramps (declined / lost) as a red end-cap
// instead of forcing them onto the happy-path line.

const HAPPY_PATH = ['pending', 'accepted', 'contacted', 'meeting', 'qualified', 'won']
const LABELS: Record<string, string> = {
  pending: 'Pending', accepted: 'Accepted', contacted: 'Contacted',
  meeting: 'Meeting', qualified: 'Qualified', won: 'Won',
  declined: 'Declined', lost: 'Lost',
}

export default function PipelineStepper({ status, compact }: { status: string, compact?: boolean }) {
  const isOffRamp = status === 'declined' || status === 'lost'
  // Off-ramp: show the happy path up to where it diverged, muted, then a red end-cap.
  const divergedAt = status === 'declined' ? 0 : HAPPY_PATH.indexOf('accepted')
  const currentIdx = isOffRamp ? divergedAt : HAPPY_PATH.indexOf(status)

  const steps = isOffRamp
    ? [...HAPPY_PATH.slice(0, divergedAt + 1), status]
    : HAPPY_PATH

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0 }}>
      {steps.map((stage, i) => {
        const isLast = i === steps.length - 1
        const isPast = isOffRamp ? i < steps.length - 1 : i < currentIdx
        const isCurrent = isOffRamp ? isLast : i === currentIdx
        const isRedEnd = isOffRamp && isLast
        const dotColor = isRedEnd ? '#ff5a5a' : isCurrent ? 'var(--nx-orange)' : isPast ? 'var(--nx-green)' : 'var(--nx-line)'
        const textColor = isRedEnd ? '#ff9d9d' : isCurrent ? 'var(--nx-orange)' : isPast ? '#7be3a4' : 'var(--nx-muted)'
        return (
          <div key={stage + i} style={{ display: 'flex', alignItems: 'center', flex: isLast ? '0 0 auto' : '1 1 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: compact ? 0 : 54 }}>
              <div style={{
                width: compact ? 16 : 20, height: compact ? 16 : 20, borderRadius: '50%',
                background: isPast || isRedEnd ? dotColor : 'transparent',
                border: `2px solid ${dotColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isCurrent && !isRedEnd ? '0 0 0 3px rgba(255,75,10,.18)' : 'none',
                transition: 'all .2s', flexShrink: 0,
              }}>
                {isPast && <span style={{ color: '#04101a', fontSize: 11, fontWeight: 900 }}>✓</span>}
                {isRedEnd && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✕</span>}
              </div>
              {!compact && (
                <span style={{ fontSize: 9.5, fontWeight: isCurrent || isRedEnd ? 700 : 500, color: textColor, whiteSpace: 'nowrap', letterSpacing: '.2px' }}>
                  {LABELS[stage]}
                </span>
              )}
            </div>
            {!isLast && (
              <div style={{
                flex: 1, height: 2, margin: compact ? '0 2px' : '0 2px', marginBottom: compact ? 0 : 16,
                background: (isOffRamp ? i < steps.length - 2 : i < currentIdx) ? 'var(--nx-green)' : 'var(--nx-line)',
                minWidth: 8, transition: 'background .2s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
