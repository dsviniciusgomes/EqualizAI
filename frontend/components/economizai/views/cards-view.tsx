'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Layers, Wifi } from 'lucide-react'
import { useFinance } from '@/lib/finance/store'
import { cardInvoice, installmentValue, installmentsDueIn } from '@/lib/finance/selectors'
import { formatBRL, shortMonth } from '@/lib/finance/format'
import type { CreditCard } from '@/lib/finance/types'
import { cn } from '@/lib/utils'
import { PageHeader, Panel, PanelHeader, ProgressBar } from '../primitives'

const THEMES: Record<CreditCard['theme'], string> = {
  emerald: 'bg-[linear-gradient(135deg,oklch(0.52_0.12_163),oklch(0.38_0.08_170))] text-white',
  graphite: 'bg-[linear-gradient(135deg,oklch(0.32_0.012_250),oklch(0.2_0.01_250))] text-white',
  pearl: 'bg-[linear-gradient(135deg,oklch(0.99_0.003_165),oklch(0.95_0.01_165))] text-foreground border border-border',
}

function CardVisual({ card, selected, onSelect }: { card: CreditCard; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Selecionar cartão ${card.name}`}
      className={cn(
        'relative flex aspect-[1.6] w-full flex-col justify-between overflow-hidden rounded-2xl p-5 text-left transition-all duration-300',
        THEMES[card.theme],
        selected
          ? 'ring-2 ring-primary ring-offset-4 ring-offset-background shadow-[0_18px_40px_-20px_rgba(16,24,40,0.45)]'
          : 'opacity-80 hover:-translate-y-1 hover:opacity-100',
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between">
        <span className="text-sm font-medium">{card.name}</span>
        <Wifi className="size-4 rotate-90 opacity-70" aria-hidden="true" />
      </div>
      <div className="relative">
        <span aria-hidden="true" className="mb-4 block h-6 w-8 rounded-md bg-[linear-gradient(135deg,oklch(0.88_0.08_85),oklch(0.75_0.08_80))]" />
        <div className="flex items-end justify-between">
          <span className="font-mono text-sm tracking-[0.2em]">•••• {card.last4}</span>
          <span className="text-xs font-semibold italic opacity-90">{card.brand}</span>
        </div>
      </div>
    </button>
  )
}

export function CardsView() {
  const { cards, installments, today } = useFinance()
  const [selectedId, setSelectedId] = useState(cards[0]?.id)
  const card = cards.find((c) => c.id === selectedId) ?? cards[0]

  const summary = useMemo(() => {
    const invoice = cardInvoice(card, installments)
    const committed = installments
      .filter((p) => p.cardId === card.id)
      .reduce((s, p) => s + installmentValue(p) * (p.count - p.paid), 0)
    const used = invoice + committed
    const upcoming = [1, 2, 3, 4].map((ahead) => {
      const ref = new Date(today.getFullYear(), today.getMonth() + ahead, 1)
      return { label: shortMonth(ref), value: installmentsDueIn(installments, ahead, card.id) }
    })
    return { invoice, used, available: card.limit - used, upcoming }
  }, [card, installments, today])

  const cardInstallments = installments.filter((p) => p.cardId === card.id)
  const maxUpcoming = Math.max(summary.invoice, ...summary.upcoming.map((u) => u.value), 1)
  const totalAllInvoices = cards.reduce((s, c) => s + cardInvoice(c, installments), 0)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Cartões e parcelas"
        title="Faturas sob controle"
        description="Acompanhe a fatura atual, o limite disponível e cada compra parcelada."
        action={
          <div className="rounded-xl border border-border/70 bg-card px-4 py-2.5 text-right">
            <p className="text-xs text-muted-foreground">Total em faturas</p>
            <p className="tabular text-base font-semibold">{formatBRL(totalAllInvoices)}</p>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <CardVisual key={c.id} card={c} selected={c.id === card.id} onSelect={() => setSelectedId(c.id)} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.4fr]">
        <Panel>
          <PanelHeader title="Fatura atual" description={card.name} />
          <div className="flex flex-col gap-6 p-6">
            <div>
              <p className="tabular text-[32px] font-semibold leading-none tracking-tight">{formatBRL(summary.invoice)}</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden="true" /> Fecha dia {card.closingDay}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-primary" aria-hidden="true" /> Vence dia {card.dueDay}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Limite utilizado</span>
                <span className="tabular font-medium">
                  {formatBRL(summary.used)} <span className="text-muted-foreground">/ {formatBRL(card.limit)}</span>
                </span>
              </div>
              <ProgressBar
                value={(summary.used / card.limit) * 100}
                tone={summary.used / card.limit > 0.8 ? 'danger' : 'primary'}
                className="mt-3 h-2"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Disponível: <span className="tabular font-medium text-foreground">{formatBRL(summary.available)}</span>
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Próximas faturas (parcelas)</p>
              <ul className="mt-4 flex h-32 items-end gap-3">
                {[{ label: 'Atual', value: summary.invoice }, ...summary.upcoming].map((u, i) => (
                  <li key={u.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="tabular text-[10px] text-muted-foreground">{formatBRL(u.value).replace(',00', '')}</span>
                    <span
                      className={cn('w-full rounded-lg transition-[height] duration-700', i === 0 ? 'bg-primary' : 'bg-primary/20')}
                      style={{ height: `${Math.max(6, (u.value / maxUpcoming) * 72)}%` }}
                      aria-hidden="true"
                    />
                    <span className="text-xs text-muted-foreground">{u.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Compras parceladas"
            description={`${cardInstallments.length} compras ativas neste cartão`}
            action={
              <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground/70">
                <Layers className="size-[17px]" aria-hidden="true" />
              </span>
            }
          />
          <ul className="flex flex-col gap-3 p-6">
            {cardInstallments.map((p) => {
              const remaining = p.count - p.paid
              return (
                <li key={p.id} className="rounded-xl border border-border/70 p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-[0_8px_24px_-16px_rgba(16,24,40,0.2)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.description}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {p.count}x de <span className="tabular">{formatBRL(installmentValue(p))}</span> · total{' '}
                        <span className="tabular">{formatBRL(p.total)}</span>
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        remaining === 0 ? 'bg-success-soft text-accent-foreground' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {remaining === 0 ? 'Última parcela' : `Faltam ${remaining}`}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-1" role="img" aria-label={`${p.paid} de ${p.count} parcelas pagas`}>
                    {Array.from({ length: p.count }, (_, i) => (
                      <span
                        key={i}
                        className={cn(
                          'h-1.5 flex-1 rounded-full transition-colors',
                          i < p.paid - 1 ? 'bg-primary' : i === p.paid - 1 ? 'bg-primary/55' : 'bg-muted',
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Parcela {p.paid} de {p.count}
                    </span>
                    <span>
                      Restante: <span className="tabular font-medium text-foreground">{formatBRL(installmentValue(p) * remaining)}</span>
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
