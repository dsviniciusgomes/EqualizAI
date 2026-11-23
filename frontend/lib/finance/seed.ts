import { toISODate } from './format'
import type {
  CreditCard,
  FutureEntry,
  InstallmentPurchase,
} from './types'

export function buildSeed(today: Date) {
  const year = today.getFullYear()
  const month = today.getMonth()

  const futures: FutureEntry[] = []
  for (let ahead = 1; ahead <= 6; ahead++) {
    const at = (day: number) => toISODate(new Date(year, month + ahead, day))
    futures.push(
      { id: `f-sal-${ahead}`, description: 'Salário', amount: 8500, date: at(5), type: 'receita', recurring: true, category: 'Salário' },
      { id: `f-fii-${ahead}`, description: 'Dividendos FII', amount: 380, date: at(15), type: 'receita', recurring: true, category: 'Investimentos' },
      { id: `f-alu-${ahead}`, description: 'Aluguel', amount: 2200, date: at(5), type: 'despesa', recurring: true, category: 'Moradia' },
      { id: `f-con-${ahead}`, description: 'Contas fixas (energia, internet, assinaturas)', amount: 587, date: at(12), type: 'despesa', recurring: true, category: 'Moradia' },
    )
  }
  futures.push(
    { id: 'f-free', description: 'Freelance — projeto landing page', amount: 3200, date: toISODate(new Date(year, month + 1, 20)), type: 'receita', recurring: false, category: 'Freelance' },
    { id: 'f-ir', description: 'Restituição do Imposto de Renda', amount: 1450, date: toISODate(new Date(year, month + 2, 28)), type: 'receita', recurring: false, category: 'Reembolso' },
    { id: 'f-bonus', description: 'Bônus anual (PLR)', amount: 6000, date: toISODate(new Date(year, month + 3, 10)), type: 'receita', recurring: false, category: 'Salário' },
    { id: 'f-ipva', description: 'IPVA', amount: 1820, date: toISODate(new Date(year, month + 4, 15)), type: 'despesa', recurring: false, category: 'Transporte' },
  )

  const cards: CreditCard[] = [
    { id: 'nubank', name: 'Nubank Ultravioleta', brand: 'Mastercard', last4: '4821', limit: 12000, closingDay: 3, dueDay: 10, theme: 'emerald', currentSpend: 1840.5 },
    { id: 'itau', name: 'Itaú Personnalité', brand: 'Visa', last4: '1057', limit: 8000, closingDay: 25, dueDay: 5, theme: 'graphite', currentSpend: 960.2 },
    { id: 'inter', name: 'Inter Gold', brand: 'Mastercard', last4: '3390', limit: 4500, closingDay: 15, dueDay: 22, theme: 'pearl', currentSpend: 312 },
  ]

  const purchase = (monthsAgo: number) => toISODate(new Date(year, month - monthsAgo, 12))
  const installments: InstallmentPurchase[] = [
    { id: 'i1', cardId: 'nubank', description: 'iPhone 15 Pro', total: 8400, count: 12, paid: 4, purchaseDate: purchase(3) },
    { id: 'i2', cardId: 'nubank', description: 'Geladeira Brastemp', total: 3600, count: 10, paid: 2, purchaseDate: purchase(1) },
    { id: 'i3', cardId: 'itau', description: 'Notebook Dell XPS', total: 5200, count: 10, paid: 7, purchaseDate: purchase(6) },
    { id: 'i4', cardId: 'itau', description: 'Sofá retrátil', total: 2700, count: 9, paid: 1, purchaseDate: purchase(0) },
    { id: 'i5', cardId: 'inter', description: 'Passagens aéreas — Lisboa', total: 2400, count: 6, paid: 5, purchaseDate: purchase(4) },
    { id: 'i6', cardId: 'inter', description: 'Tênis Nike Pegasus', total: 780, count: 3, paid: 2, purchaseDate: purchase(1) },
  ]

  return { futures, cards, installments }
}
