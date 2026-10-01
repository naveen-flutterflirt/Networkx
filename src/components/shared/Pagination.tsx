'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'

/**
 * Shared list pagination.
 *
 * Numbered pages and a "Showing 21–40 of 132" summary need an exact total.
 * Lists backed by a Firestore aggregation count provide one; for lists where
 * an exact total would mean fetching every matching record, `total` is
 * null/undefined and this shows "Page N" with Previous/Next only — still
 * correct, without pretending to know how many pages exist.
 *
 * Desktop shows numbered buttons; on a phone those collapse into
 * Previous / "Page 3 of 9" (tap to jump) / Next, sized for thumbs. Renders
 * nothing when there is only one page. Changing page scrolls the dashboard's
 * scroll container back to the top, and the bar shows a spinner while the
 * next page loads.
 */
export function Pagination({
  page,
  pageSize,
  total,
  hasMore,
  onPageChange,
  loading = false,
}: {
  page: number
  pageSize: number
  total?: number | null
  hasMore: boolean
  onPageChange: (page: number) => void
  loading?: boolean
  maxButtons?: number
}) {
  const totalPages = total != null ? Math.max(1, Math.ceil(total / pageSize)) : null

  // Nothing to page through.
  if (totalPages != null ? totalPages <= 1 : (page === 1 && !hasMore)) return null

  const atFirst = page <= 1
  const atLast = totalPages != null ? page >= totalPages : !hasMore

  const go = (p: number) => {
    if (loading || p < 1 || p === page || (totalPages != null && p > totalPages)) return
    onPageChange(p)
    // The dashboard scrolls inside .content, not the window.
    document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Compact numbered list: first, last, current ±1, ellipses for gaps.
  const numbers: (number | '…')[] = []
  if (totalPages != null) {
    const set = new Set<number>([1, totalPages, page - 1, page, page + 1])
    const sorted = Array.from(set).filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b)
    sorted.forEach((n, i) => {
      if (i > 0 && n - sorted[i - 1] > 1) numbers.push('…')
      numbers.push(n)
    })
  }

  const from = total != null ? (total === 0 ? 0 : (page - 1) * pageSize + 1) : null
  const to = total != null ? Math.min(page * pageSize, total) : null

  return (
    <nav className="pg-bar" aria-label="Pagination" aria-busy={loading}>
      <div className="pg-info" aria-live="polite">
        {loading
          ? <><span className="pg-spin" aria-hidden="true"/>Loading page {page}…</>
          : total != null
            ? <>Showing <b>{from}–{to}</b> of <b>{total}</b></>
            : <>Page <b>{page}</b></>}
      </div>

      <div className="pg-controls">
        <button type="button" className="pg-btn pg-nav" disabled={atFirst || loading} onClick={() => go(page - 1)} aria-label="Previous page">
          <FontAwesomeIcon icon={faChevronLeft}/><span>Previous</span>
        </button>

        {totalPages != null && (
          <>
            <div className="pg-numbers">
              {numbers.map((n, i) => n === '…'
                ? <span key={`e${i}`} className="pg-gap" aria-hidden="true">…</span>
                : <button key={n} type="button" disabled={loading} onClick={() => go(n)}
                    className={`pg-btn${n === page ? ' active' : ''}`}
                    aria-label={`Page ${n}`} aria-current={n === page ? 'page' : undefined}>{n}</button>)}
            </div>
            <label className="pg-jump">
              <span className="pg-sr">Go to page</span>
              {totalPages <= 300
                ? <select value={page} disabled={loading} onChange={e => go(Number(e.target.value))}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n =>
                      <option key={n} value={n}>Page {n} of {totalPages}</option>)}
                  </select>
                : <span>Page {page} of {totalPages}</span>}
            </label>
          </>
        )}

        <button type="button" className="pg-btn pg-nav" disabled={atLast || loading} onClick={() => go(page + 1)} aria-label="Next page">
          <span>Next</span><FontAwesomeIcon icon={faChevronRight}/>
        </button>
      </div>
    </nav>
  )
}
