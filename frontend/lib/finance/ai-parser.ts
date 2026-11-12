import { toISODate } from './format'
import type { PaymentMethod, Transaction, TxType } from './types'

const CATEGORY_KEYWORDS: [string, string, string[]][] = [
  ['Mercado', 'Mercado', ['mercado', 'supermercado', 'hortifruti', 'feira', 'atacadão', 'atacadao']],
  ['Alimentação', 'Alimentação', ['restaurante', 'almoço', 'almoco', 'jantar', 'ifood', 'lanche', 'padaria', 'café', 'cafe', 'pizza']],
  ['Transporte', 'Transporte', ['uber', '99', 'gasolina', 'posto', 'combustível', 'combustivel', 'ônibus', 'onibus', 'metrô', 'metro', 'estacionamento']],
  ['Moradia', 'Moradia', ['aluguel', 'condomínio', 'condominio', 'luz', 'energia', 'água', 'agua', 'internet', 'gás', 'gas']],
  ['Saúde', 'Saúde', ['farmácia', 'farmacia', 'remédio', 'remedio', 'médico', 'medico', 'academia', 'consulta', 'dentista']],
  ['Lazer', 'Lazer', ['cinema', 'show', 'bar', 'viagem', 'passeio', 'ingresso']],
  ['Educação', 'Educação', ['curso', 'livro', 'faculdade', 'escola', 'mensalidade']],
  ['Assinaturas', 'Assinaturas', ['netflix', 'spotify', 'assinatura', 'prime', 'disney', 'youtube']],
  ['Compras', 'Compras', ['roupa', 'tênis', 'tenis', 'amazon', 'shopping', 'loja', 'presente']],
]

const INCOME_KEYWORDS: [string, string[]][] = [
  ['Salário', ['salário', 'salario', 'pagamento do mês', 'holerite']],
  ['Freelance', ['freela', 'freelance', 'projeto', 'cliente']],
  ['Investimentos', ['dividendo', 'rendimento', 'juros', 'investimento']],
  ['Reembolso', ['reembolso', 'restituição', 'restituicao', 'devolveu', 'estorno']],
]

const INCOME_VERBS = ['recebi', 'ganhei', 'entrou', 'caiu', 'receita', 'vendi', 'me pagou', 'me pagaram']

export interface ParsedEntry extends Omit<Transaction, 'id' | 'source'> {
  confidence: number
}

function detectAmount(text: string) {
  const match = text.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+|\d+)(?:[,.](\d{1,2}))?\s*(?:reais|real|conto|contos|pila)?/i)
  if (!match) return null
  const integer = match[1].replace(/\./g, '')
  const cents = match[2] ? match[2].padEnd(2, '0') : '00'
  const value = Number(`${integer}.${cents}`)
  return Number.isFinite(value) && value > 0 ? value : null
}

function detectDate(text: string, today: Date) {
  const t = text.toLowerCase()
  if (t.includes('anteontem')) return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)
  if (t.includes('ontem')) return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const explicit = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (explicit) {
    const year = explicit[3] ? Number(explicit[3].length === 2 ? `20${explicit[3]}` : explicit[3]) : today.getFullYear()
    return new Date(year, Number(explicit[2]) - 1, Number(explicit[1]))
  }
  const dayOnly = t.match(/\bdia\s+(\d{1,2})\b/)
  if (dayOnly) return new Date(today.getFullYear(), today.getMonth(), Number(dayOnly[1]))
  return today
}

function detectPayment(text: string): PaymentMethod {
  const t = text.toLowerCase()
  if (t.includes('pix')) return 'Pix'
  if (t.includes('débito') || t.includes('debito')) return 'Cartão de débito'
  if (t.includes('cartão') || t.includes('cartao') || t.includes('crédito') || t.includes('credito')) return 'Cartão de crédito'
  if (t.includes('dinheiro') || t.includes('espécie') || t.includes('especie')) return 'Dinheiro'
  if (t.includes('boleto')) return 'Boleto'
  if (t.includes('transfer') || t.includes('ted')) return 'Transferência'
  return 'Pix'
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function parseNaturalLanguage(input: string, today: Date): ParsedEntry | null {
  const text = input.trim()
  const lower = text.toLowerCase()
  const amount = detectAmount(lower)
  if (!amount) return null

  let confidence = 0.6
  const isIncome = INCOME_VERBS.some((v) => lower.includes(v)) || INCOME_KEYWORDS.some(([, k]) => k.some((w) => lower.includes(w)))
  const type: TxType = isIncome ? 'receita' : 'despesa'

  let category = 'Outros'
  let description = ''
  if (type === 'receita') {
    const hit = INCOME_KEYWORDS.find(([, words]) => words.some((w) => lower.includes(w)))
    if (hit) {
      category = hit[0]
      description = hit[0]
      confidence += 0.25
    }
  } else {
    for (const [cat, , words] of CATEGORY_KEYWORDS) {
      const word = words.find((w) => new RegExp(`(^|[^\\p{L}\\d])${w}($|[^\\p{L}\\d])`, 'iu').test(lower))
      if (word) {
        category = cat
        description = capitalize(word)
        confidence += 0.25
        break
      }
    }
  }

  if (!description) {
    const cleaned = lower
      .replace(/(?:r\$\s*)?\d+(?:[.,]\d+)*\s*(?:reais|real|contos?|pila)?/g, '')
      .replace(/(^|[^\p{L}])(gastei|paguei|comprei|recebi|ganhei|hoje|ontem|anteontem|com|no|na|em|de|do|da|o|a|um|uma|cartão|cartao|pix|débito|debito|crédito|credito|dinheiro)(?=$|[^\p{L}])/gu, '$1')
      .replace(/\s+/g, ' ')
      .trim()
    description = cleaned ? capitalize(cleaned) : type === 'receita' ? 'Receita' : 'Despesa'
  }

  const payment = detectPayment(lower)
  if (payment !== 'Pix' || lower.includes('pix')) confidence += 0.1

  return {
    description,
    amount,
    date: toISODate(detectDate(lower, today)),
    category,
    type,
    payment,
    confidence: Math.min(confidence, 0.98),
  }
}
