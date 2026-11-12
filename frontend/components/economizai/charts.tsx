'use client'

import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import { formatBRL, formatCompactBRL } from '@/lib/finance/format'
import { CATEGORY_COLORS, ChartTooltip } from './shared'

const AXIS = { fontSize: 12, fill: 'oklch(0.54 0.014 250)' }
const GRID = 'oklch(0.94 0.004 250)'

export function CategoryDonut({ data }: { data: { name: string; value: number }[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  const active = activeIndex !== null ? data[activeIndex] : null

  if (!data.length) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Nenhum gasto registrado neste mês.</p>
  }

  return (
    <div className="flex flex-col items-center gap-8 md:flex-row md:items-center">
      <div className="relative size-[220px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={72}
              outerRadius={104}
              paddingAngle={2}
              cornerRadius={6}
              stroke="none"
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              isAnimationActive
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={CATEGORY_COLORS[entry.name] ?? CATEGORY_COLORS.Outros}
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
                  style={{ transition: 'opacity 200ms ease', outline: 'none' }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted-foreground">{active ? active.name : 'Total gasto'}</span>
          <span className="tabular mt-1 text-lg font-semibold tracking-tight">
            {formatBRL(active ? active.value : total)}
          </span>
          {active && (
            <span className="mt-0.5 text-xs text-muted-foreground">
              {((active.value / total) * 100).toFixed(1).replace('.', ',')}%
            </span>
          )}
        </div>
      </div>

      <ul className="grid w-full grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-1">
        {data.slice(0, 7).map((d, i) => (
          <li key={d.name}>
            <button
              type="button"
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(i)}
              onBlur={() => setActiveIndex(null)}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors',
                activeIndex === i ? 'bg-muted' : 'hover:bg-muted/60',
              )}
            >
              <span className="flex items-center gap-2.5 text-foreground/80">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: CATEGORY_COLORS[d.name] ?? CATEGORY_COLORS.Outros }}
                  aria-hidden="true"
                />
                {d.name}
              </span>
              <span className="tabular text-muted-foreground">
                {((d.value / total) * 100).toFixed(0)}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function IncomeExpenseBars({ data }: { data: { month: string; receitas: number; custos: number }[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={6} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={AXIS} dy={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS}
            width={64}
            tickFormatter={(v) => formatCompactBRL(Number(v))}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'oklch(0.97 0.004 250)', radius: 8 }} />
          <Bar dataKey="receitas" name="Receitas" fill="var(--color-chart-1)" radius={[6, 6, 2, 2]} maxBarSize={22} />
          <Bar dataKey="custos" name="Custos" fill="oklch(0.86 0.008 250)" radius={[6, 6, 2, 2]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ProjectionArea({
  data,
}: {
  data: { month: string; saldo: number; receitas: number; despesas: number }[]
}) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={AXIS} dy={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS}
            width={64}
            tickFormatter={(v) => formatCompactBRL(Number(v))}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'oklch(0.85 0.01 250)', strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="saldo"
            name="Saldo acumulado"
            stroke="var(--color-chart-1)"
            strokeWidth={2.5}
            fill="url(#saldoFill)"
            dot={{ r: 3.5, fill: 'white', stroke: 'var(--color-chart-1)', strokeWidth: 2 }}
            activeDot={{ r: 5.5, fill: 'var(--color-chart-1)', stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
