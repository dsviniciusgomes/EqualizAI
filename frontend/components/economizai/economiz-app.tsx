'use client'

import { FinanceProvider, useFinance } from '@/lib/finance/store'
import { AuthScreen } from './auth-screen'
import { AppShell } from './app-shell'

function Gate() {
  const { user, authReady, authError } = useFinance()
  if (!authReady) {
    return <main className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Carregando conta…</main>
  }
  return user ? <AppShell /> : <AuthScreen initialError={authError} />
}

export function EconomizApp() {
  return (
    <FinanceProvider>
      <Gate />
    </FinanceProvider>
  )
}
