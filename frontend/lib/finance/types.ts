export type TxType = 'receita' | 'despesa'

export const PAYMENT_METHODS = [
  'Pix',
  'Cartão de crédito',
  'Cartão de débito',
  'Dinheiro',
  'Boleto',
  'Transferência',
] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const EXPENSE_CATEGORIES = [
  'Mercado',
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Lazer',
  'Educação',
  'Assinaturas',
  'Compras',
  'Outros',
] as const

export const INCOME_CATEGORIES = ['Salário', 'Freelance', 'Investimentos', 'Reembolso', 'Outros'] as const

export interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  category: string
  type: TxType
  payment: PaymentMethod
  source: 'manual' | 'ia'
}

export interface FutureEntry {
  id: string
  description: string
  amount: number
  date: string
  type: TxType
  recurring: boolean
  category: string
}

export type CardTheme = 'emerald' | 'graphite' | 'pearl'

export interface CreditCard {
  id: string
  name: string
  brand: 'Visa' | 'Mastercard' | 'Elo'
  last4: string
  limit: number
  closingDay: number
  dueDay: number
  theme: CardTheme
  currentSpend: number
}

export interface InstallmentPurchase {
  id: string
  cardId: string
  description: string
  total: number
  count: number
  paid: number
  purchaseDate: string
}

export interface UserProfile {
  name: string
  email: string
  phone: string
  monthlyIncomeGoal: number
  savingsGoal: number
  monthStartDay: number
  notifications: boolean
  weeklySummary: boolean
  aiAutoCategorize: boolean
}
