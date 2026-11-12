'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { buildSeed } from './seed'
import { uid } from './format'
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
  setView: (view: ViewId) => void
  signIn: (data: { name?: string; email: string }) => void
  signOut: () => void
  updateUser: (data: Partial<UserProfile>) => void
  addTransaction: (tx: Omit<Transaction, 'id'>) => Transaction
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
  const [view, setView] = useState<ViewId>('dashboard')
  const [transactions, setTransactions] = useState(seed.transactions)

  const signIn = useCallback((data: { name?: string; email: string }) => {
    setUser({
      name: data.name?.trim() || nameFromEmail(data.email),
      email: data.email,
      phone: '',
      monthlyIncomeGoal: 10000,
      savingsGoal: 2500,
      monthStartDay: 1,
      notifications: true,
      weeklySummary: true,
      aiAutoCategorize: true,
    })
    setView('dashboard')
  }, [])

  const signOut = useCallback(() => setUser(null), [])
  const updateUser = useCallback(
    (data: Partial<UserProfile>) => setUser((prev) => (prev ? { ...prev, ...data } : prev)),
    [],
  )

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    const created = { ...tx, id: uid() }
    setTransactions((prev) => [created, ...prev])
    return created
  }, [])

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
      setView,
      signIn,
      signOut,
      updateUser,
      addTransaction,
      removeTransaction,
    }),
    [today, user, view, transactions, seed, signIn, signOut, updateUser, addTransaction, removeTransaction],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance deve ser usado dentro de FinanceProvider')
  return ctx
}
