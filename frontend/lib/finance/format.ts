const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const compact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const formatBRL = (value: number) => currency.format(value)
export const formatCompactBRL = (value: number) => compact.format(value)

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isSameMonth(iso: string, ref: Date) {
  const d = parseISODate(iso)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function shortMonth(date: Date) {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function longMonth(date: Date, withYear = true) {
  const label = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(parseISODate(iso))
    .replace('.', '')
}

export function formatFullDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    parseISODate(iso),
  )
}

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}
