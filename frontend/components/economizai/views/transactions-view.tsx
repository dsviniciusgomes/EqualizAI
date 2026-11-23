'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useFinance } from '@/lib/finance/store'
import { PageHeader, Panel, PanelHeader, Segmented, TextInput } from '../primitives'
import { TransactionRow } from '../shared'
import { ManualEntryForm } from '../manual-entry-form'
import { AiEntryChat } from '../ai-entry-chat'

type Filter = 'todos' | 'receita' | 'despesa'

export function TransactionsView() {
  const { transactions, removeTransaction, transactionsLoading, transactionsError } = useFinance()
  const [filter, setFilter] = useState<Filter>('todos')
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions
      .filter((t) => filter === 'todos' || t.type === filter)
      .filter((t) => !q || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 40)
  }, [transactions, filter, query])

  async function handleRemove(id: string) {
    setDeletingId(id)
    setDeleteError('')
    try {
      await removeTransaction(id)
    } catch (error) {
      console.error('Falha ao excluir lançamento:', error)
      const detail = error instanceof Error ? error.message : 'Erro desconhecido.'
      setDeleteError(`Não foi possível apagar o lançamento. Confira as permissões de acesso. ${detail}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Lançamentos"
        title="Registre suas movimentações"
        description="Preencha manualmente ou descreva em uma frase e deixe a IA organizar tudo para você."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ManualEntryForm />
        <AiEntryChat />
      </div>

      <Panel>
        <PanelHeader
          title="Histórico"
          description="Todos os lançamentos, do mais recente ao mais antigo"
        />
        <div className="flex flex-col gap-3 px-6 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="search-tx" className="sr-only">
              Buscar lançamentos
            </label>
            <TextInput
              id="search-tx"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por descrição ou categoria"
              className="h-10 pl-10"
            />
          </div>
          <Segmented
            size="sm"
            label="Filtrar por tipo"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'receita', label: 'Receitas' },
              { value: 'despesa', label: 'Despesas' },
            ]}
          />
        </div>
        <ul className="flex flex-col p-3">
          {transactionsLoading && (
            <li role="status" className="py-12 text-center text-sm text-muted-foreground">
              Carregando lançamentos…
            </li>
          )}
          {transactionsError && (
            <li role="alert" className="py-6 text-center text-sm text-destructive">
              {transactionsError}
            </li>
          )}
          {deleteError && (
            <li role="alert" className="px-3 py-3 text-sm text-destructive">
              {deleteError}
            </li>
          )}
          {!transactionsLoading && !transactionsError && list.map((tx) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              onRemove={(id) => void handleRemove(id)}
              removing={deletingId === tx.id}
            />
          ))}
          {!transactionsLoading && !transactionsError && !list.length && (
            <li className="py-12 text-center text-sm text-muted-foreground">Nenhum lançamento encontrado.</li>
          )}
        </ul>
      </Panel>
    </div>
  )
}
