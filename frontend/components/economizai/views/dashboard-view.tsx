'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowRight, ArrowUpCircle, PiggyBank, Plus } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { useFinance } from '@/lib/finance/store'
import { mapLancamento } from '@/lib/finance/api'
import type { Transaction } from '@/lib/finance/types'
import { expensesByCategory, lastMonthsComparison } from '@/lib/finance/selectors'
import { longMonth } from '@/lib/finance/format'
import { Button } from '@/components/ui/button'
import { PageHeader, Panel, PanelHeader } from '../primitives'
import { StatCard, TransactionRow } from '../shared'
import { CategoryDonut, IncomeExpenseBars } from '../charts'

interface DashboardData {
  transactions: Transaction[]
  openingBalance: number
  accountCount: number
}

export function DashboardView() {
  const { user, setView, today } = useFinance()
  const [data, setData] = useState<DashboardData>({ transactions: [], openingBalance: 0, accountCount: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const supabase = useMemo(() => getSupabaseClient(), [])

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      setLoadError('')

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        const userId = sessionData.session?.user.id
        if (!userId) throw new Error('Não há uma sessão autenticada.')

        const [launchResult, accountResult] = await Promise.all([
          supabase.from('lancamento').select('*').eq('user_id', userId).order('date', { ascending: false }),
          supabase.from('conta_bancaria').select('saldo_inicial').eq('user_id', userId),
        ])

        if (launchResult.error) throw launchResult.error
        if (accountResult.error) throw accountResult.error

        const transactions = (launchResult.data ?? []).map((row) =>
          mapLancamento(row as Record<string, unknown>),
        )
        const openingBalance = (accountResult.data ?? []).reduce((total, account) => {
          const balance = Number(account.saldo_inicial ?? 0)
          if (!Number.isFinite(balance)) {
            throw new Error('A tabela conta_bancaria contém um saldo inicial inválido.')
          }
          return total + balance
        }, 0)

        if (active) {
          setData({ transactions, openingBalance, accountCount: accountResult.data?.length ?? 0 })
        }
      } catch (error) {
        console.error('Falha ao carregar os dados do Dashboard:', error)
        if (active) setLoadError('Não foi possível carregar seus dados financeiros. Tente novamente mais tarde.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadDashboard()
    return () => {
      active = false
    }
  }, [supabase])

  const { income, expense } = useMemo(
    () =>
      data.transactions.reduce(
        (totals, transaction) => {
          if (transaction.type === 'receita') totals.income += transaction.amount
          else totals.expense += transaction.amount
          return totals
        },
        { income: 0, expense: 0 },
      ),
    [data.transactions],
  )
  const balance = data.openingBalance + income - expense
  const categories = useMemo(() => expensesByCategory(data.transactions, today), [data.transactions, today])
  const comparison = useMemo(() => lastMonthsComparison(data.transactions, today), [data.transactions, today])
  const recent = data.transactions.slice(0, 6)
  const firstName = user?.name.split(' ')[0] ?? ''

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={longMonth(today)}
        title={`Olá, ${firstName}`}
        description="Aqui está a visão equilibrada das suas finanças no mês atual."
        action={
          <Button onClick={() => setView('lancamentos')} className="h-10 rounded-xl px-4">
            <Plus className="size-4" aria-hidden="true" />
            Novo lançamento
          </Button>
        }
      />

      {loading ? (
        <Panel>
          <p role="status" className="p-8 text-center text-sm text-muted-foreground">
            Carregando seus dados financeiros…
          </p>
        </Panel>
      ) : loadError ? (
        <Panel>
          <p role="alert" className="p-8 text-center text-sm text-destructive">
            {loadError}
          </p>
        </Panel>
      ) : (
        <>
          {(!recent.length || !data.accountCount) && (
            <Panel>
              <div className="flex flex-col gap-2 p-5 text-sm text-muted-foreground">
                {!data.accountCount && <p>Você ainda não cadastrou uma conta bancária.</p>}
                {!recent.length && <p>Você ainda não possui lançamentos. Seus lançamentos aparecerão aqui.</p>}
              </div>
            </Panel>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <StatCard label="Saldo Total" value={balance} icon={PiggyBank} highlight />
            <StatCard label="Receitas" value={income} icon={ArrowUpCircle} />
            <StatCard label="Despesas" value={expense} icon={ArrowDownCircle} />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_1fr]">
            <Panel>
              <PanelHeader title="Gastos por categoria" description="Distribuição das despesas deste mês" />
              <div className="p-6">
                <CategoryDonut data={categories} />
              </div>
            </Panel>
            <Panel>
              <PanelHeader
                title="Receitas vs. Custos"
                description="Comparativo dos últimos 6 meses"
                action={
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-chart-1" aria-hidden="true" />
                      Receitas
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[oklch(0.86_0.008_250)]" aria-hidden="true" />
                      Custos
                    </span>
                  </div>
                }
              />
              <div className="px-4 pb-5 pt-6">
                <IncomeExpenseBars data={comparison} />
              </div>
            </Panel>
          </div>

          <Panel>
            <PanelHeader
              title="Lançamentos recentes"
              description="Movimentações mais recentes"
              action={
                <button
                  type="button"
                  onClick={() => setView('lancamentos')}
                  className="group flex items-center gap-1 text-sm font-medium text-primary"
                >
                  Ver todos
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
              }
            />
            <ul className="grid grid-cols-1 gap-x-6 p-3 md:grid-cols-2">
              {recent.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
              {!recent.length && (
                <li className="col-span-full py-10 text-center text-sm text-muted-foreground">
                  Nenhum lançamento cadastrado ainda.
                </li>
              )}
            </ul>
          </Panel>
        </>
      )}
    </div>
  )
}
