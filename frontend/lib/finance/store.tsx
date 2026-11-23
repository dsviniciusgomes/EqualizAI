'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'
import { buildSeed } from './seed'
import { createLancamento, mapLancamento } from './api'
import type { CreditCard, FutureEntry, InstallmentPurchase, Transaction, UserProfile } from './types'

export type ViewId = 'dashboard' | 'lancamentos' | 'perfil'

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
  transactionsLoading: boolean
  transactionsError: string
  setView: (view: ViewId) => void
  signOut: () => Promise<void>
  updateUser: (data: Partial<UserProfile>) => void
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<Transaction>
  removeTransaction: (id: string) => Promise<void>
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
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState('')
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [transactionsError, setTransactionsError] = useState('')
  const [view, setView] = useState<ViewId>('dashboard')
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const acceptSession = useCallback((session: Session, resetView: boolean) => {
    const email = session.user.email ?? ''
    const name = session.user.user_metadata.full_name ?? session.user.user_metadata.name
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
    let sessionCheck = 0
    let unsubscribe = () => {}

    try {
      const supabase = getSupabaseClient()
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!active) return

        const checkId = ++sessionCheck
        if (!session) {
          setUser(null)
          setTransactions([])
          setTransactionsLoading(false)
          setTransactionsError('')
          setAuthReady(true)
          return
        }

        setAuthReady(false)
        setUser(null)
        setTransactions([])
        setTransactionsLoading(true)
        setTransactionsError('')

        window.setTimeout(() => {
          void (async () => {
            let denialMessage = 'Sua conta aguarda aprovação do administrador.'
            try {
              const { data: profile, error } = await supabase
                .from('usuario_perfil')
                .select('status')
                .eq('id', session.user.id)
                .single()

              if (error) {
                if (error.code !== 'PGRST116') {
                  denialMessage = 'Não foi possível verificar a aprovação da sua conta.'
                }
              } else if (profile.status === 'aprovado') {
                if (!active || checkId !== sessionCheck) return

                let loadedTransactions: Transaction[] = []
                let loadError = ''
                try {
                  const { data: rows, error: transactionsQueryError } = await supabase
                    .from('lancamento')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('date', { ascending: false })

                  if (transactionsQueryError) throw transactionsQueryError
                  loadedTransactions = (rows ?? []).map((row) =>
                    mapLancamento(row as Record<string, unknown>),
                  )
                } catch (error) {
                  console.error('Falha ao carregar os lançamentos:', error)
                  loadError = 'Não foi possível carregar seus lançamentos. Tente novamente mais tarde.'
                }

                if (!active || checkId !== sessionCheck) return
                acceptSession(session, event === 'SIGNED_IN')
                setTransactions(loadedTransactions)
                setTransactionsError(loadError)
                setTransactionsLoading(false)
                setAuthReady(true)
                return
              }
            } catch {
              denialMessage = 'Não foi possível verificar a aprovação da sua conta.'
            }

            if (!active || checkId !== sessionCheck) return
            setAuthError(denialMessage)
            try {
              const { error } = await supabase.auth.signOut()
              if (error) throw error
            } catch (error) {
              const detail = error instanceof Error ? error.message : 'Erro desconhecido.'
              setAuthError(`${denialMessage} Não foi possível encerrar a sessão: ${detail}`)
            } finally {
              if (active && checkId === sessionCheck) setAuthReady(true)
            }
          })()
        }, 0)
      })
      unsubscribe = () => data.subscription.unsubscribe()
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível inicializar a autenticação.')
      setAuthReady(true)
    }

    return () => {
      active = false
      sessionCheck += 1
      unsubscribe()
    }
  }, [acceptSession])
  const updateUser = useCallback(
    (data: Partial<UserProfile>) => setUser((prev) => (prev ? { ...prev, ...data } : prev)),
    [],
  )

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id'>) => {
    const id = await createLancamento(tx)
    const created = { ...tx, id }
    setTransactions((prev) => [created, ...prev])
    return created
  }, [])

  const removeTransaction = useCallback(async (id: string) => {
    const { data, error } = await getSupabaseClient()
      .from('lancamento')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Lançamento não encontrado ou sem permissão para exclusão.')
    setTransactions((prev) => prev.filter((transaction) => transaction.id !== id))
  }, [])

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
      transactionsLoading,
      transactionsError,
      setView,
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
      transactionsLoading,
      transactionsError,
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
