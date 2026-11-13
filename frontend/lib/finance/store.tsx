'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'
import { buildSeed } from './seed'
import { uid } from './format'
import { createLancamento } from './api'
import type { CreditCard, FutureEntry, InstallmentPurchase, Transaction, UserProfile } from './types'

export type ViewId = 'dashboard' | 'lancamentos' | 'previsao' | 'cartoes' | 'perfil'

interface FinanceState {
  today: Date
  user: UserProfile | null
  view: ViewId
  transactions: Transaction[]
  futures: FutureEntry[]
  cards: CreditCard[]
  installments: InstallmentPurchase[]
  authReady: boolean
  authError: string
  setView: (view: ViewId) => void
  signIn: (session: Session) => void
  signOut: () => Promise<void>
  updateUser: (data: Partial<UserProfile>) => void
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<Transaction>
  removeTransaction: (id: string) => void
}

const FinanceContext = createContext<FinanceState | null>(null)

function nameFromEmail(email: string) {
  const base = email.split('@')[0]?.replace(/[._-]+/g, ' ') ?? 'Usuário'
  return base.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [today] = useState(() => new Date())
  const [seed] = useState(() => buildSeed(today))
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState('')
  const [view, setView] = useState<ViewId>('dashboard')
  const [transactions, setTransactions] = useState(seed.transactions)

  const signIn = useCallback((session: Session, resetView = true) => {
    const email = session.user.email ?? ''
    const name = session.user.user_metadata.full_name ?? session.user.user_metadata.name
    setUserId(session.user.id)
    setAccessToken(session.access_token)
    setUser({
      name: typeof name === 'string' && name.trim() ? name.trim() : nameFromEmail(email),
      email,
      phone: '',
      monthlyIncomeGoal: 10000,
      savingsGoal: 2500,
      monthStartDay: 1,
      notifications: true,
      weeklySummary: true,
      aiAutoCategorize: true,
    })
    if (resetView) setView('dashboard')
    setAuthError('')
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await getSupabaseClient().auth.signOut()
    if (error) setAuthError(error.message)
  }, [])

  useEffect(() => {
    let active = true
    let unsubscribe = () => {}

    try {
      const supabase = getSupabaseClient()
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return
        if (session) {
          signIn(session, false)
        } else {
          setUser(null)
          setUserId(null)
          setAccessToken(null)
        }
        setAuthReady(true)
      })
      unsubscribe = () => data.subscription.unsubscribe()

      void supabase.auth.getSession().then(({ data: sessionData, error }) => {
        if (!active) return
        if (error) throw error
        if (sessionData.session) {
          signIn(sessionData.session, false)
        } else {
          setUser(null)
          setUserId(null)
          setAccessToken(null)
        }
        setAuthReady(true)
      }).catch((error: unknown) => {
        if (!active) return
        setAuthError(error instanceof Error ? error.message : 'Não foi possível carregar sua sessão.')
        setAuthReady(true)
      })
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível inicializar a autenticação.')
      setAuthReady(true)
    }

    return () => {
      active = false
      unsubscribe()
    }
  }, [signIn])
  const updateUser = useCallback(
    (data: Partial<UserProfile>) => setUser((prev) => (prev ? { ...prev, ...data } : prev)),
    [],
  )

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id'>) => {
    if (!userId || !accessToken) throw new Error('Sua sessão expirou. Entre novamente para salvar o lançamento.')
    await createLancamento(tx, userId, accessToken)
    const created = { ...tx, id: uid() }
    setTransactions((prev) => [created, ...prev])
    return created
  }, [accessToken, userId])

  const removeTransaction = useCallback(
    (id: string) => setTransactions((prev) => prev.filter((t) => t.id !== id)),
    [],
  )

  const value = useMemo<FinanceState>(
    () => ({
      today,
      user,
      view,
      transactions,
      futures: seed.futures,
      cards: seed.cards,
      installments: seed.installments,
      authReady,
      authError,
      setView,
      signIn,
      signOut,
      updateUser,
      addTransaction,
      removeTransaction,
    }),
    [
      today,
      user,
      view,
      transactions,
      seed,
      authReady,
      authError,
      signIn,
      signOut,
      updateUser,
      addTransaction,
      removeTransaction,
    ],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance deve ser usado dentro de FinanceProvider')
  return ctx
}
