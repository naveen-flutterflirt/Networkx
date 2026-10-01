'use client'

import { createContext, useContext } from 'react'

const DashboardProfileContext = createContext<any>(null)

export function DashboardProfileProvider({ value, children }: { value:any, children:React.ReactNode }) {
  return <DashboardProfileContext.Provider value={value}>{children}</DashboardProfileContext.Provider>
}

export function useDashboardProfile() {
  return useContext(DashboardProfileContext)
}
