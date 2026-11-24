'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowUp, Check, Sparkles, X } from 'lucide-react'
import { useFinance } from '@/lib/finance/store'
import { parseNaturalLanguage, type ParsedEntry } from '@/lib/finance/ai-parser'
import { formatBRL, formatFullDate } from '@/lib/finance/format'
import { getApiUrl } from '@/lib/api'
import { getSupabaseClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Badge, Panel, PanelHeader } from './primitives'

type Message =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'ai'; status: 'thinking' }
  | {
      id: string
      role: 'ai'
      status: 'parsed'
      entry: ParsedEntry
      state: 'pending' | 'saving' | 'saved' | 'discarded'
      saveError?: string
    }
  | { id: string; role: 'ai'; status: 'error'; text: string }

const SUGGESTIONS = [
  'Gastei 45 no mercado hoje com o cartão',
  'Recebi 1.200 de freelance por pix',
  'Paguei 89,90 de internet ontem no boleto',
]

interface AiExtraction {
  description: string
  amount: number
  date: string
  categoria_id: number
  categoria: string
  tipo: 'receita' | 'despesa'
}

function isAiExtractionResponse(value: unknown): value is { extracao_ia: AiExtraction } {
  if (typeof value !== 'object' || value === null || !('extracao_ia' in value)) return false
  const extraction = value.extracao_ia
  return (
    typeof extraction === 'object' &&
    extraction !== null &&
    'description' in extraction &&
    typeof extraction.description === 'string' &&
    extraction.description.trim().length > 0 &&
    'amount' in extraction &&
    typeof extraction.amount === 'number' &&
    Number.isFinite(extraction.amount) &&
    extraction.amount > 0 &&
    'date' in extraction &&
    typeof extraction.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(extraction.date) &&
    'categoria_id' in extraction &&
    typeof extraction.categoria_id === 'number' &&
    Number.isSafeInteger(extraction.categoria_id) &&
    'categoria' in extraction &&
    typeof extraction.categoria === 'string' &&
    extraction.categoria.trim().length > 0 &&
    'tipo' in extraction &&
    (extraction.tipo === 'receita' || extraction.tipo === 'despesa')
  )
}

export function AiEntryChat() {
  const { addTransaction, today } = useFinance()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function process(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    const userId = crypto.randomUUID()
    const aiId = crypto.randomUUID()
    setMessages((m) => [...m, { id: userId, role: 'user', text: trimmed }, { id: aiId, role: 'ai', status: 'thinking' }])
    setInput('')
    setBusy(true)

    try {
      const { data: sessionData, error: sessionError } = await getSupabaseClient().auth.getSession()
      if (sessionError) throw new Error(`Não foi possível recuperar a sessão do Supabase: ${sessionError.message}`)
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Sua sessão expirou. Entre novamente para usar a interpretação por IA.')

      const url = getApiUrl('/ia/processar-transacao')
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ texto: trimmed }),
      })

      if (!response.ok) {
        const details = await response.text()
        let errorMessage = `HTTP ${response.status} ${response.statusText}: ${details || 'resposta sem detalhes'}`
        try {
          const errorPayload: unknown = JSON.parse(details)
          if (
            typeof errorPayload === 'object' &&
            errorPayload !== null &&
            'detail' in errorPayload &&
            typeof errorPayload.detail === 'string'
          ) {
            errorMessage = errorPayload.detail
          }
        } catch {
          // Keep the response text when the API does not return JSON.
        }
        throw new Error(errorMessage)
      }

      const payload: unknown = await response.json()
      if (!isAiExtractionResponse(payload)) {
        throw new Error('A API retornou uma resposta de extração inválida.')
      }

      const localEntry = parseNaturalLanguage(trimmed, today)
      const entry: ParsedEntry = {
        description: payload.extracao_ia.description.trim(),
        amount: payload.extracao_ia.amount,
        date: payload.extracao_ia.date,
        category: payload.extracao_ia.categoria,
        categoriaId: payload.extracao_ia.categoria_id,
        type: payload.extracao_ia.tipo,
        payment: localEntry?.payment ?? 'Pix',
        confidence: localEntry ? Math.max(localEntry.confidence, 0.8) : 0.75,
      }

      setMessages((m) =>
        m.map((msg) =>
          msg.id === aiId ? { id: aiId, role: 'ai', status: 'parsed', entry, state: 'pending' } : msg,
        ),
      )
    } catch (error) {
      console.error('Falha ao chamar a API de processamento de transações:', error)
      setMessages((m) =>
        m.map((msg) =>
          msg.id === aiId
            ? {
                id: aiId,
                role: 'ai',
                status: 'error',
                text: error instanceof Error
                  ? error.message
                  : 'Não foi possível processar sua movimentação. Verifique a conexão com a API e tente novamente.',
              }
            : msg,
        ),
      )
    } finally {
      setBusy(false)
    }
  }

  async function resolve(id: string, action: 'saved' | 'discarded') {
    const target = messages.find((msg) => msg.id === id)
    if (!target || target.role !== 'ai' || target.status !== 'parsed' || target.state !== 'pending') return
    if (action === 'saved') {
      const categoriaId = target.entry.categoriaId
      if (typeof categoriaId !== 'number' || !Number.isSafeInteger(categoriaId)) {
        setMessages((current) =>
          current.map((msg) =>
            msg.id === id && msg.role === 'ai' && msg.status === 'parsed'
              ? { ...msg, saveError: 'A resposta da IA não incluiu uma categoria válida. Reprocesse a movimentação.' }
              : msg,
          ),
        )
        return
      }
      const { confidence: _confidence, ...data } = target.entry
      setMessages((current) =>
        current.map((msg) =>
          msg.id === id && msg.role === 'ai' && msg.status === 'parsed'
            ? { ...msg, state: 'saving', saveError: undefined }
            : msg,
        ),
      )
      try {
        await addTransaction({ ...data, categoriaId, source: 'ia' })
      } catch (saveError) {
        setMessages((current) =>
          current.map((msg) =>
            msg.id === id && msg.role === 'ai' && msg.status === 'parsed'
              ? {
                  ...msg,
                  state: 'pending',
                  saveError:
                    saveError instanceof Error ? saveError.message : 'Não foi possível salvar o lançamento.',
                }
              : msg,
          ),
        )
        return
      }
    }
    setMessages((m) =>
      m.map((msg) =>
        msg.id === id && msg.role === 'ai' && msg.status === 'parsed'
          ? { ...msg, state: action, saveError: undefined }
          : msg,
      ),
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    process(input)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      process(input)
    }
  }

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Processar com IA"
        description="Descreva a movimentação em linguagem natural"
        action={
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_4px_14px_-4px] shadow-primary/50">
            <Sparkles className="size-[17px]" aria-hidden="true" />
          </span>
        }
      />

      <div
        ref={scrollRef}
        className="mx-6 mt-5 flex min-h-[260px] flex-1 flex-col gap-3 overflow-y-auto rounded-xl bg-background p-4 max-h-[340px]"
        aria-live="polite"
      >
        {!messages.length && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center">
            <p className="max-w-xs text-sm text-muted-foreground text-pretty">
              Experimente uma das frases abaixo. A IA extrai valor, data, categoria e forma de pagamento.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => process(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80 transition-all hover:-translate-y-px hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end animate-in fade-in slide-in-from-bottom-1 duration-300">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm text-background">
                  {msg.text}
                </p>
              </div>
            )
          }
          if (msg.status === 'thinking') {
            return (
              <div key={msg.id} className="flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in">
                <span className="flex gap-1" aria-hidden="true">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="size-1.5 animate-bounce rounded-full bg-primary/70"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </span>
                Analisando sua frase…
              </div>
            )
          }
          if (msg.status === 'error') {
            return (
              <p key={msg.id} className="max-w-[85%] rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground animate-in fade-in">
                {msg.text}
              </p>
            )
          }
          return <ParsedCard key={msg.id} message={msg} onResolve={resolve} />
        })}
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex items-end gap-2 rounded-2xl border border-input bg-card p-2 pl-4 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12">
          <label htmlFor="ai-input" className="sr-only">
            Descreva sua movimentação
          </label>
          <textarea
            id="ai-input"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex.: Gastei 45 no mercado hoje com o cartão"
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            aria-label="Enviar para a IA"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:brightness-105 active:scale-95 disabled:bg-muted disabled:text-muted-foreground"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </form>
    </Panel>
  )
}

function ParsedCard({
  message,
  onResolve,
}: {
  message: Extract<Message, { status: 'parsed' }>
  onResolve: (id: string, action: 'saved' | 'discarded') => void
}) {
  const { entry, state } = message
  const rows = [
    ['Descrição', entry.description],
    ['Valor', formatBRL(entry.amount)],
    ['Data', formatFullDate(entry.date)],
    ['Categoria', entry.category],
    ['Pagamento', entry.payment],
  ]
  return (
    <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-border/80 bg-card p-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
          <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
          Dados extraídos
        </p>
        <Badge tone={entry.type === 'receita' ? 'success' : 'neutral'}>
          {entry.type === 'receita' ? 'Receita' : 'Despesa'}
        </Badge>
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className={cn('text-right font-medium', k === 'Valor' && 'tabular')}>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Confiança da extração: {Math.round(entry.confidence * 100)}%
      </p>
      {message.saveError && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {message.saveError}
        </p>
      )}
      <div className="mt-3 border-t border-border/70 pt-3">
        {state === 'pending' ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void onResolve(message.id, 'saved')}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98]"
            >
              <Check className="size-4" aria-hidden="true" /> Confirmar
            </button>
            <button
              type="button"
              onClick={() => void onResolve(message.id, 'discarded')}
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" /> Descartar
            </button>
          </div>
        ) : state === 'saving' ? (
          <p role="status" className="text-sm text-muted-foreground">Salvando lançamento…</p>
        ) : (
          <p className={cn('flex items-center gap-1.5 text-sm', state === 'saved' ? 'text-primary' : 'text-muted-foreground')}>
            {state === 'saved' ? (
              <>
                <Check className="size-4" aria-hidden="true" /> Salvo nos seus lançamentos
              </>
            ) : (
              'Lançamento descartado'
            )}
          </p>
        )}
      </div>
    </div>
  )
}
