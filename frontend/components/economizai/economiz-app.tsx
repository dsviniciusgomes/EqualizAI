'use client'

import { FinanceProvider, useFinance } from '@/lib/finance/store'
import { AuthScreen } from './auth-screen'
import { AppShell } from './app-shell'

function Gate() {
  const { user } = useFinance()
  return user ? <AppShell /> : <AuthScreen />
}

export function EconomizApp() {
  return (
    <FinanceProvider>
      <Gate />
    </FinanceProvider>
  )
}
