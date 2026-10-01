'use client'
// Ticket-style card for event registration (P0 gap fix). The QR is
// rendered via a free public QR-image endpoint (api.qrserver.com) so this
// needs zero new npm dependencies — swap for a client-side QR library
// later if offline rendering becomes a requirement.
//
// Was missing WHO the ticket belongs to entirely — just event info and a
// QR code, no name/photo. A ticket that doesn't identify its holder is
// useless for actual entry verification at a door, so this now pulls
// the member's name/photo/profession from their real profile.

interface Registration {
  status: 'confirmed' | 'waitlisted' | 'cancelled'
  qr_token?: string | null
  payment_status?: string
  price_charged?: number
  checked_in?: boolean
}

interface Props {
  eventTitle: string
  eventDate?: string
  eventVenue?: string
  eventId: string
  registration: Registration
  memberName?: string
  memberProfession?: string
  memberCompany?: string
  memberAvatarUrl?: string
}

export default function EventTicket({ eventTitle, eventDate, eventVenue, eventId, registration,
  memberName, memberProfession, memberCompany, memberAvatarUrl }: Props) {
  const isWaitlisted = registration.status === 'waitlisted'
  // Fix: the top badge said "Confirmed" and the QR rendered fully
  // scannable the instant RSVP was submitted — before Razorpay checkout
  // even opened, let alone succeeded. Someone could abandon or fail
  // payment and still hold what looked like (and, until the matching
  // backend fix, actually WAS) a valid door ticket. The backend now
  // also rejects check-in for a pending payment_status — this is the
  // matching visual fix so the ticket doesn't lie about its own state.
  const isUnpaid = !isWaitlisted && registration.payment_status === 'pending'
  const qrPayload = `NX-EVENT:${eventId}:${registration.qr_token}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=8&data=${encodeURIComponent(qrPayload)}`

  return (
    <div style={{ display: 'flex', maxWidth: 460, borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 28px rgba(0,0,0,.35)', border: '1px solid var(--nx-line)' }}>
      {/* Stub */}
      <div style={{ flex: 1, background: 'var(--nx-panel)', padding: '18px 16px', position: 'relative' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: isUnpaid ? '#f59e0b' : 'var(--nx-orange)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {isWaitlisted ? '⏳ Waitlisted' : isUnpaid ? '⚠️ Payment Pending' : registration.checked_in ? '✅ Checked In' : '🎟️ Confirmed'}
        </div>

        {/* Member identity — the actual holder of this ticket */}
        {memberName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--nx-orange)', color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {memberAvatarUrl ? <img src={memberAvatarUrl} alt={memberName} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : memberName.charAt(0)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--nx-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{memberName}</div>
              {(memberProfession || memberCompany) && (
                <div style={{ fontSize: 11, color: 'var(--nx-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {[memberProfession, memberCompany].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--nx-ink)', marginTop: 2, lineHeight: 1.25 }}>{eventTitle}</div>
        {eventDate && <div style={{ fontSize: 12, color: 'var(--nx-muted)', marginTop: 6 }}>📅 {eventDate}</div>}
        {eventVenue && <div style={{ fontSize: 12, color: 'var(--nx-muted)', marginTop: 2 }}>📍 {eventVenue}</div>}

        {registration.price_charged ? (
          <div style={{ fontSize: 11, color: isUnpaid ? '#f59e0b' : 'var(--nx-muted)', marginTop: 10, fontWeight: isUnpaid ? 700 : 400 }}>
            {registration.payment_status === 'paid' ? '✅ Paid' : '⏳ Payment pending — complete payment to activate this ticket'} · ₹{registration.price_charged}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--nx-muted)', marginTop: 10 }}>Free entry</div>
        )}

        {isWaitlisted && (
          <div style={{ fontSize: 11, color: '#ff9a6e', marginTop: 8 }}>
            You'll be confirmed automatically if a spot opens up.
          </div>
        )}
      </div>

      {/* Perforated divider */}
      <div style={{
        width: 0, borderLeft: '2px dashed var(--nx-line)', position: 'relative', margin: '10px 0',
      }}>
        <div style={{ position: 'absolute', top: -10, left: -9, width: 18, height: 18, borderRadius: '50%', background: 'var(--nx-warm-white)' }} />
        <div style={{ position: 'absolute', bottom: -10, left: -9, width: 18, height: 18, borderRadius: '50%', background: 'var(--nx-warm-white)' }} />
      </div>

      {/* QR stub */}
      <div style={{ width: 148, background: 'var(--nx-panel2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 10, gap: 6 }}>
        {isWaitlisted ? (
          <div style={{ fontSize: 28, opacity: 0.5 }}>⏳</div>
        ) : (
          <div style={{ position: 'relative' }}>
            <img src={qrUrl} width={110} height={110} alt="Check-in QR code" style={{ borderRadius: 8, background: '#fff', padding: 4, filter: isUnpaid ? 'grayscale(1) opacity(0.35)' : 'none' }} />
            {isUnpaid && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔒</div>
            )}
          </div>
        )}
        <div style={{ fontSize: 9, color: isUnpaid ? '#f59e0b' : 'var(--nx-muted)', textAlign: 'center', fontWeight: isUnpaid ? 700 : 400 }}>
          {isWaitlisted ? 'No ticket yet' : isUnpaid ? 'Inactive until paid' : 'Show at entry'}
        </div>
      </div>
    </div>
  )
}