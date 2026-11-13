import type { Transaction } from './types'

const API_URL = 'https://equalizai.onrender.com'

export async function createLancamento(
  transaction: Omit<Transaction, 'id'>,
  userId: string,
  accessToken: string,
) {
  const response = await fetch(`${API_URL}/lancamentos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date,
      user_id: userId,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Falha ao salvar lançamento (${response.status}).`)
  }
}
