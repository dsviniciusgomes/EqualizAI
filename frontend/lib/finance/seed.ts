import { toISODate } from './format'
import type {
  CreditCard,
  FutureEntry,
  InstallmentPurchase,
  PaymentMethod,
  Transaction,
} from './types'

type Template = [string, number, number, string, PaymentMethod]

const EXPENSES: Template[] = [
  ['Aluguel', 2200, 5, 'Moradia', 'Boleto'],
  ['Supermercado Pão de Açúcar', 486.3, 3, 'Mercado', 'Cartão de crédito'],
  ['Uber', 32.9, 4, 'Transporte', 'Cartão de crédito'],
  ['Netflix', 55.9, 6, 'Assinaturas', 'Cartão de crédito'],
  ['Spotify', 21.9, 7, 'Assinaturas', 'Cartão de crédito'],
  ['Restaurante Madero', 128.5, 8, 'Alimentação', 'Cartão de crédito'],
  ['Farmácia Drogasil', 74.2, 9, 'Saúde', 'Cartão de débito'],
  ['Posto Shell', 220, 10, 'Transporte', 'Cartão de crédito'],
  ['Energia elétrica', 189.4, 12, 'Moradia', 'Boleto'],
  ['Cinema', 64, 14, 'Lazer', 'Pix'],
  ['Curso Alura', 89.9, 15, 'Educação', 'Cartão de crédito'],
  ['Hortifruti', 142.8, 17, 'Mercado', 'Pix'],
  ['iFood', 67.4, 19, 'Alimentação', 'Cartão de crédito'],
  ['Academia', 119.9, 20, 'Saúde', 'Cartão de débito'],
  ['Internet fibra', 99.9, 22, 'Moradia', 'Boleto'],
  ['Amazon', 239, 24, 'Compras', 'Cartão de crédito'],
  ['Padaria', 28.5, 26, 'Alimentação', 'Dinheiro'],
]

const INCOMES: Template[] = [
  ['Salário', 8500, 5, 'Salário', 'Transferência'],
  ['Freelance — design', 1800, 18, 'Freelance', 'Pix'],
]

export function buildSeed(today: Date) {
  const transactions: Transaction[] = []
  const year = today.getFullYear()
  const month = today.getMonth()
  const currentDay = today.getDate()

  for (let back = 5; back >= 0; back--) {
    const isCurrent = back === 0
    const variation = (k: number) => 1 + (((back * 7 + k * 13) % 21) - 10) / 100
    ;[...INCOMES, ...EXPENSES].forEach(([description, amount, day, category, payment], k) => {
      if (isCurrent && day > currentDay) return
      const isIncome = k < INCOMES.length
      const fixed = isIncome && k === 0
      const skipFreelance = isIncome && k === 1 && back % 2 === 1
      if (skipFreelance) return
      transactions.push({
        id: `seed-${back}-${k}`,
        description,
        amount: Math.round(amount * (fixed || description === 'Aluguel' ? 1 : variation(k)) * 100) / 100,
        date: toISODate(new Date(year, month - back, day)),
        category,
        type: isIncome ? 'receita' : 'despesa',
        payment,
        source: 'manual',
      })
    })
  }

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

  return { transactions, futures, cards, installments }
}
