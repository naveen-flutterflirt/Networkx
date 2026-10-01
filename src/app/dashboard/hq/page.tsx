'use client'
import { useEffect } from 'react'
export default function HQPage() {
  useEffect(() => { window.location.href = '/dashboard' }, [])
  return null
}
