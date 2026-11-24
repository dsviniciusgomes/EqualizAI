import { PAYMENT_METHODS, type Transaction } from './types'
import { getApiUrl } from '@/lib/api'
import { getSupabaseClient } from '@/lib/supabase'

export function mapLancamento(row: Record<string, unknown>): Transaction {
  const amount = Number(row.amount)
  const type = row.tipo

  if (
    (typeof row.id !== 'string' && typeof row.id !== 'number') ||
    typeof row.date !== 'string' ||
    !Number.isFinite(amount) ||
    (type !== 'receita' && type !== 'despesa')
  ) {
    throw new Error('A tabela lancamento contém um registro com dados inválidos.')
  }

  const category = row.category ?? row.categoria
  const payment = row.payment ?? row.forma_pagamento
  const paymentMethod = PAYMENT_METHODS.find((method) => method === payment) ?? 'Pix'

  return {
    id: String(row.id),
    description: typeof row.description === 'string' ? row.description : 'Lançamento',
    amount: Math.abs(amount),
    date: row.date,
    category: typeof category === 'string' ? category : 'Outros',
    categoriaId:
      typeof row.categoria_id === 'number' && Number.isSafeInteger(row.categoria_id)
        ? row.categoria_id
        : undefined,
    type,
    payment: paymentMethod,
    source: row.source === 'ia' ? 'ia' : 'manual',
  }
}

export async function createLancamento(transaction: Omit<Transaction, 'id'> & { categoriaId: number }) {
  const { data, error } = await getSupabaseClient().auth.getSession()
  if (error) throw new Error(`Não foi possível recuperar a sessão do Supabase: ${error.message}`)
  if (!data.session?.access_token) {
    throw new Error('Sua sessão expirou. Entre novamente para salvar o lançamento.')
  }

  const response = await fetch(getApiUrl('/lancamentos'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify({
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date,
      tipo: transaction.type,
      categoria_id: transaction.categoriaId,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Falha ao salvar lançamento (${response.status}).`)
  }

  const payload: unknown = await response.json()
  if (typeof payload !== 'object' || payload === null || !('data' in payload)) {
    throw new Error('A API não retornou o lançamento cadastrado.')
  }
  const rows = payload.data
  const row = Array.isArray(rows) ? rows[0] : rows
  if (
    typeof row !== 'object' ||
    row === null ||
    !('id' in row) ||
    (typeof row.id !== 'string' && typeof row.id !== 'number')
  ) {
    throw new Error('A API não retornou um identificador válido para o lançamento.')
  }
  return String(row.id)
}
