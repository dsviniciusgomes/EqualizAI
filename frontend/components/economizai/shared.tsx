'use client'

import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Car,
  HeartPulse,
  Home,
  Package,
  Popcorn,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  TrendingUp,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL, formatDay } from '@/lib/finance/format'
import type { Transaction } from '@/lib/finance/types'
import { Badge, Panel } from './primitives'

export const CATEGORY_COLORS: Record<string, string> = {
  Moradia: 'oklch(0.596 0.145 163.2)',
  Mercado: 'oklch(0.72 0.14 166)',
  Alimentação: 'oklch(0.83 0.1 168)',
  Transporte: 'oklch(0.45 0.02 250)',
  Saúde: 'oklch(0.62 0.02 250)',
  Lazer: 'oklch(0.78 0.012 250)',
  Educação: 'oklch(0.82 0.12 80)',
  Assinaturas: 'oklch(0.88 0.06 80)',
  Compras: 'oklch(0.7 0.09 200)',
  Outros: 'oklch(0.88 0.006 250)',
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Moradia: Home,
  Mercado: ShoppingCart,
  Alimentação: Utensils,
  Transporte: Car,
  Saúde: HeartPulse,
  Lazer: Popcorn,
  Educação: BookOpen,
  Assinaturas: Repeat,
  Compras: ShoppingBag,
  Salário: Briefcase,
  Freelance: Wallet,
  Investimentos: TrendingUp,
  Reembolso: ArrowDownRight,
  Outros: Package,
}

export function CategoryIcon({ category, type }: { category: string; type: Transaction['type'] }) {
  const Icon = CATEGORY_ICONS[category] ?? Package
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl',
        type === 'receita' ? 'bg-success-soft text-accent-foreground' : 'bg-muted text-foreground/70',
      )}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
    </span>
  )
}

export function Amount({ value, type, className }: { value: number; type: Transaction['type']; className?: string }) {
  return (
    <span className={cn('tabular font-medium', type === 'receita' ? 'text-primary' : 'text-foreground', className)}>
      {type === 'receita' ? '+ ' : '− '}
      {formatBRL(value)}
    </span>
  )
}

export function TransactionRow({ tx, onRemove }: { tx: Transaction; onRemove?: (id: string) => void }) {
  return (
    <li className="group flex items-center gap-4 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-muted/60">
      <CategoryIcon category={tx.category} type={tx.type} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{tx.description}</p>
          {tx.source === 'ia' && (
            <Badge tone="success">
              <Sparkles className="size-3" aria-hidden="true" />
              IA
            </Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {tx.category} · {tx.payment}
        </p>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <Amount value={tx.amount} type={tx.type} className="text-sm" />
        <span className="text-xs text-muted-foreground">{formatDay(tx.date)}</span>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(tx.id)}
          aria-label={`Remover ${tx.description}`}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-danger-soft hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  )
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  highlight = false,
  invertDelta = false,
}: {
  label: string
  value: number
  delta?: number
  deltaLabel?: string
  icon: LucideIcon
  highlight?: boolean
  invertDelta?: boolean
}) {
  const positive = delta !== undefined && (invertDelta ? delta <= 0 : delta >= 0)
  return (
    <Panel
      className={cn(
        'group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-16px_rgba(16,24,40,0.16)]',
        highlight && 'border-primary/20',
      )}
    >
      {highlight && (
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-primary/8 blur-2xl" />
      )}
      <div className="relative flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-xl',
            highlight ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/70',
          )}
        >
          <Icon className="size-[17px]" aria-hidden="true" />
        </span>
      </div>
      <p
        className={cn(
          'tabular relative mt-5 text-[28px] font-semibold leading-none tracking-tight',
          value < 0 && 'text-destructive',
        )}
      >
        {formatBRL(value)}
      </p>
      {delta !== undefined && (
        <p className="relative mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium',
              positive ? 'bg-success-soft text-accent-foreground' : 'bg-danger-soft text-destructive',
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta).toFixed(1).replace('.', ',')}%
          </span>
          {deltaLabel}
        </p>
      )}
    </Panel>
  )
}

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; payload?: { fill?: string } }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-36 rounded-xl border border-border/70 bg-card px-3.5 py-2.5 text-xs shadow-[0_8px_24px_-8px_rgba(16,24,40,0.18)]">
      {label && <p className="mb-1.5 font-medium text-foreground">{label}</p>}
      <ul className="flex flex-col gap-1">
        {payload.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 rounded-full"
                style={{ background: item.color ?? item.payload?.fill }}
                aria-hidden="true"
              />
              {item.name}
            </span>
            <span className="tabular font-medium text-foreground">{formatBRL(Number(item.value ?? 0))}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
