import type { Transaction } from './types'
import { getApiUrl } from '@/lib/api'
import { getSupabaseClient } from '@/lib/supabase'

export async function createLancamento(transaction: Omit<Transaction, 'id'>) {
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
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Falha ao salvar lançamento (${response.status}).`)
  }
}
