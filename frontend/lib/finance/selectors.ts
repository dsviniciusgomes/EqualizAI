import { isSameMonth, monthKey, parseISODate, shortMonth } from './format'
import type { CreditCard, FutureEntry, InstallmentPurchase, Transaction } from './types'

export function monthTotals(transactions: Transaction[], ref: Date) {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (!isSameMonth(t.date, ref)) continue
    if (t.type === 'receita') income += t.amount
    else expense += t.amount
  }
  return { income, expense, net: income - expense }
}

export function expensesByCategory(transactions: Transaction[], ref: Date) {
  const map = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'despesa' || !isSameMonth(t.date, ref)) continue
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
}

export function lastMonthsComparison(transactions: Transaction[], today: Date, months = 6) {
  const rows = []
  for (let back = months - 1; back >= 0; back--) {
    const ref = new Date(today.getFullYear(), today.getMonth() - back, 1)
    const { income, expense } = monthTotals(transactions, ref)
    rows.push({ month: shortMonth(ref), receitas: Math.round(income), custos: Math.round(expense) })
  }
  return rows
}

export function installmentValue(p: InstallmentPurchase) {
  return p.total / p.count
}

export function cardInvoice(card: CreditCard, installments: InstallmentPurchase[]) {
  const parcels = installments
    .filter((p) => p.cardId === card.id && p.paid <= p.count)
    .reduce((sum, p) => sum + installmentValue(p), 0)
  return card.currentSpend + parcels
}

export function installmentsDueIn(installments: InstallmentPurchase[], monthsAhead: number, cardId?: string) {
  return installments
    .filter((p) => (!cardId || p.cardId === cardId) && p.count - p.paid >= monthsAhead)
    .reduce((sum, p) => sum + installmentValue(p), 0)
}

export function buildProjection(
  transactions: Transaction[],
  futures: FutureEntry[],
  installments: InstallmentPurchase[],
  today: Date,
  months = 6,
) {
  const fixedDescriptions = new Set(['Aluguel', 'Energia elétrica', 'Internet fibra', 'Netflix', 'Spotify'])
  let variableSum = 0
  for (let back = 1; back <= 3; back++) {
    const ref = new Date(today.getFullYear(), today.getMonth() - back, 1)
    for (const t of transactions) {
      if (t.type === 'despesa' && isSameMonth(t.date, ref) && !fixedDescriptions.has(t.description)) {
        variableSum += t.amount
      }
    }
  }
  const variableEstimate = Math.round(variableSum / 3)

  const current = monthTotals(transactions, today)
  let balance = current.net
  const rows = []
  for (let ahead = 1; ahead <= months; ahead++) {
    const ref = new Date(today.getFullYear(), today.getMonth() + ahead, 1)
    const key = monthKey(ref)
    const inMonth = futures.filter((f) => monthKey(parseISODate(f.date)) === key)
    const income = inMonth.filter((f) => f.type === 'receita').reduce((s, f) => s + f.amount, 0)
    const fixed = inMonth.filter((f) => f.type === 'despesa').reduce((s, f) => s + f.amount, 0)
    const parcels = installmentsDueIn(installments, ahead)
    const expense = fixed + parcels + variableEstimate
    balance += income - expense
    rows.push({
      month: shortMonth(ref),
      date: ref,
      receitas: Math.round(income),
      despesas: Math.round(expense),
      parcelas: Math.round(parcels),
      saldo: Math.round(balance),
    })
  }
  return { rows, variableEstimate }
}
