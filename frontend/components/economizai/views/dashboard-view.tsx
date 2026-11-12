'use client'

import { useMemo } from 'react'
import { ArrowDownCircle, ArrowRight, ArrowUpCircle, PiggyBank, Plus } from 'lucide-react'
import { useFinance } from '@/lib/finance/store'
import { expensesByCategory, lastMonthsComparison, monthTotals } from '@/lib/finance/selectors'
import { isSameMonth, longMonth } from '@/lib/finance/format'
import { Button } from '@/components/ui/button'
import { PageHeader, Panel, PanelHeader } from '../primitives'
import { StatCard, TransactionRow } from '../shared'
import { CategoryDonut, IncomeExpenseBars } from '../charts'

function pctChange(current: number, previous: number) {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}

export function DashboardView() {
  const { transactions, today, user, setView } = useFinance()

  const { current, previous, categories, comparison, recent } = useMemo(() => {
    const prevRef = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    return {
      current: monthTotals(transactions, today),
      previous: monthTotals(transactions, prevRef),
      categories: expensesByCategory(transactions, today),
      comparison: lastMonthsComparison(transactions, today),
      recent: transactions
        .filter((t) => isSameMonth(t.date, today))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6),
    }
  }, [transactions, today])

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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard
          label="Gastos do mês"
          value={current.expense}
          icon={ArrowDownCircle}
          delta={pctChange(current.expense, previous.expense)}
          deltaLabel="vs. mês anterior"
          invertDelta
        />
        <StatCard
          label="Receitas do mês"
          value={current.income}
          icon={ArrowUpCircle}
          delta={pctChange(current.income, previous.income)}
          deltaLabel="vs. mês anterior"
        />
        <StatCard
          label="Saldo líquido"
          value={current.net}
          icon={PiggyBank}
          highlight
          delta={current.income ? (current.net / current.income) * 100 : 0}
          deltaLabel="da receita poupada"
        />
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
          description={`Movimentações de ${longMonth(today, false).toLowerCase()}`}
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
              Nenhum lançamento neste mês ainda.
            </li>
          )}
        </ul>
      </Panel>
    </div>
  )
}
