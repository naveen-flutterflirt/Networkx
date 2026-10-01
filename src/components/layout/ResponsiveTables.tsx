'use client'
import { useEffect } from 'react'

// On phones, dashboard-globals.css lays every `table.tbl` out as stacked
// cards (one per row) instead of a wide grid. CSS can't read a column's
// <th> text for its <td>s, so copy each header onto its cells as
// data-label, which the card layout prints in front of each value. Tables
// render after data loads, so watch for new ones. Only attributes are
// written (never observed), so this can't loop.
function labelTables() {
  document.querySelectorAll<HTMLTableElement>('table.tbl').forEach(table => {
    // :scope keeps a table nested inside a cell from being labelled with
    // its parent's headers.
    const heads = Array.from(table.querySelectorAll(':scope > thead th')).map(th => (th.textContent || '').trim())
    if (!heads.length) return
    table.querySelectorAll(':scope > tbody > tr').forEach(row => {
      Array.from(row.children).forEach((cell, i) => {
        if (cell.tagName !== 'TD' || (cell as HTMLTableCellElement).colSpan > 1) return
        const label = heads[i] || ''
        if (cell.getAttribute('data-label') !== label) cell.setAttribute('data-label', label)
      })
    })
  })
}

export default function ResponsiveTables() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(labelTables, 50)
    }
    labelTables()
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => { observer.disconnect(); if (timer) clearTimeout(timer) }
  }, [])
  return null
}
