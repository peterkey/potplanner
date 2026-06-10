'use client'

import { createContext, useContext, useState } from 'react'

interface MemberContextValue {
  activeMemberId: number | null
  setActiveMemberId: (id: number | null) => void
}

const MemberContext = createContext<MemberContextValue>({
  activeMemberId: null,
  setActiveMemberId: () => {},
})

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [activeMemberId, setActiveMemberId] = useState<number | null>(null)
  return (
    <MemberContext.Provider value={{ activeMemberId, setActiveMemberId }}>
      {children}
    </MemberContext.Provider>
  )
}

export function useMember() {
  return useContext(MemberContext)
}
