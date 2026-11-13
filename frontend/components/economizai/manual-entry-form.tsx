'use client'

import { useState, type FormEvent } from 'react'
import { Check, PencilLine } from 'lucide-react'
import { useFinance } from '@/lib/finance/store'
import { toISODate } from '@/lib/finance/format'
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  type PaymentMethod,
  type TxType,
} from '@/lib/finance/types'
import { Button } from '@/components/ui/button'
import { Field, Panel, PanelHeader, Segmented, SelectInput, TextInput } from './primitives'

export function ManualEntryForm() {
  const { addTransaction, today } = useFinance()
  const [type, setType] = useState<TxType>('despesa')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => toISODate(today))
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0])
  const [payment, setPayment] = useState<PaymentMethod>('Pix')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const categories = type === 'receita' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  function changeType(next: TxType) {
    setType(next)
    setCategory(next === 'receita' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = Number(amount.replace(/\./g, '').replace(',', '.'))
    if (!description.trim()) return setError('Informe uma descrição.')
    if (!Number.isFinite(value) || value <= 0) return setError('Informe um valor maior que zero.')
    if (!date) return setError('Informe a data.')
    setError('')
    setSaving(true)
    try {
      await addTransaction({
        description: description.trim(),
        amount: Math.round(value * 100) / 100,
        date,
        category,
        type,
        payment,
        source: 'manual',
      })
      setDescription('')
      setAmount('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o lançamento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel>
      <PanelHeader
        title="Lançamento manual"
        description="Ideal para lançamentos retroativos e detalhados"
        action={
          <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground/70">
            <PencilLine className="size-[17px]" aria-hidden="true" />
          </span>
        }
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6" noValidate>
        <Segmented
          label="Tipo de lançamento"
          value={type}
          onChange={changeType}
          options={[
            { value: 'despesa', label: 'Despesa' },
            { value: 'receita', label: 'Receita' },
          ]}
        />

        <Field label="Descrição" htmlFor="m-desc">
          <TextInput
            id="m-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={type === 'despesa' ? 'Ex.: Supermercado' : 'Ex.: Salário'}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Valor (R$)" htmlFor="m-amount">
            <TextInput
              id="m-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="0,00"
              className="tabular"
            />
          </Field>
          <Field label="Data" htmlFor="m-date">
            <TextInput id="m-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Categoria" htmlFor="m-cat">
            <SelectInput id="m-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Forma de pagamento" htmlFor="m-pay">
            <SelectInput
              id="m-pay"
              value={payment}
              onChange={(e) => setPayment(e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <p role="status" aria-live="polite" className="text-[13px]">
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : saved ? (
              <span className="flex items-center gap-1.5 text-primary animate-in fade-in">
                <Check className="size-4" aria-hidden="true" /> Lançamento salvo
              </span>
            ) : null}
          </p>
          <Button type="submit" disabled={saving} className="h-11 rounded-xl px-5">
            {saving ? 'Salvando…' : 'Salvar lançamento'}
          </Button>
        </div>
      </form>
    </Panel>
  )
}
