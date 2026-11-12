'use client'

import { useMemo, useState } from 'react'
import { CalendarCheck2, Repeat, TrendingUp, Wallet } from 'lucide-react'
import { useFinance } from '@/lib/finance/store'
import { buildProjection } from '@/lib/finance/selectors'
import { formatBRL, formatDay, longMonth, monthKey, parseISODate } from '@/lib/finance/format'
import { cn } from '@/lib/utils'
import { Badge, PageHeader, Panel, PanelHeader, Segmented } from '../primitives'
import { Amount, CategoryIcon, StatCard } from '../shared'
import { ProjectionArea } from '../charts'

type Horizon = '3' | '6'

export function ForecastView() {
  const { transactions, futures, installments, today } = useFinance()
  const [horizon, setHorizon] = useState<Horizon>('6')
  const months = Number(horizon)

  const { rows, variableEstimate } = useMemo(
    () => buildProjection(transactions, futures, installments, today, months),
    [transactions, futures, installments, today, months],
  )

  const grouped = useMemo(() => {
    const keys = rows.map((r) => monthKey(r.date))
    return rows.map((row, i) => ({
      row,
      items: futures
        .filter((f) => monthKey(parseISODate(f.date)) === keys[i])
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
  }, [rows, futures])

  const totalIncome = rows.reduce((s, r) => s + r.receitas, 0)
  const totalFixed = futures
    .filter((f) => f.type === 'despesa' && rows.some((r) => monthKey(r.date) === monthKey(parseISODate(f.date))))
    .reduce((s, f) => s + f.amount, 0)
  const finalBalance = rows.at(-1)?.saldo ?? 0

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Previsão e futuro"
        title="Para onde seu dinheiro está indo"
        description="Projeção baseada em entradas provisionadas, compromissos fixos, parcelas e na média dos seus gastos variáveis."
        action={
          <Segmented
            size="sm"
            label="Horizonte da projeção"
            value={horizon}
            onChange={setHorizon}
            options={[
              { value: '3', label: '3 meses' },
              { value: '6', label: '6 meses' },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard label={`Saldo projetado em ${months} meses`} value={finalBalance} icon={TrendingUp} highlight />
        <StatCard label="Entradas provisionadas" value={totalIncome} icon={Wallet} />
        <StatCard label="Compromissos fixos" value={totalFixed} icon={Repeat} />
      </div>

      <Panel>
        <PanelHeader
          title="Projeção de saldo acumulado"
          description={`Considera gasto variável médio de ${formatBRL(variableEstimate)} por mês`}
        />
        <div className="px-4 pb-5 pt-6">
          <ProjectionArea data={rows} />
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl border-t border-border/70 bg-border/70 sm:grid-cols-3 lg:grid-cols-6">
          {rows.map((r) => (
            <div key={r.month} className="bg-card px-5 py-4">
              <p className="text-xs text-muted-foreground">{r.month}</p>
              <p className={cn('tabular mt-1 text-sm font-semibold', r.receitas - r.despesas < 0 ? 'text-destructive' : 'text-foreground')}>
                {r.receitas - r.despesas >= 0 ? '+' : ''}
                {formatBRL(r.receitas - r.despesas)}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">no mês</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Entradas e saídas provisionadas" description="Movimentações já previstas para os próximos meses" />
        <div className="flex flex-col gap-6 p-6">
          {grouped.map(({ row, items }) => (
            <section key={row.month} aria-labelledby={`m-${row.month}`}>
              <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-3">
                <h3 id={`m-${row.month}`} className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarCheck2 className="size-4 text-primary" aria-hidden="true" />
                  {longMonth(row.date)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Saldo acumulado: <span className="tabular font-medium text-foreground">{formatBRL(row.saldo)}</span>
                </p>
              </div>
              <ul className="mt-2 flex flex-col">
                {items.map((f) => (
                  <li key={f.id} className="flex items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60">
                    <CategoryIcon category={f.category} type={f.type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.description}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {formatDay(f.date)}
                        {f.recurring ? <Badge>Recorrente</Badge> : <Badge tone="success">Pontual</Badge>}
                      </p>
                    </div>
                    <Amount value={f.amount} type={f.type} className="text-sm" />
                  </li>
                ))}
                {row.parcelas > 0 && (
                  <li className="flex items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60">
                    <CategoryIcon category="Compras" type="despesa" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">Parcelas de cartão</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Soma das compras parceladas</p>
                    </div>
                    <Amount value={row.parcelas} type="despesa" className="text-sm" />
                  </li>
                )}
              </ul>
            </section>
          ))}
        </div>
      </Panel>
    </div>
  )
}
