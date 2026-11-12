'use client'

import { useState, type FormEvent } from 'react'
import { Check, LogOut } from 'lucide-react'
import { useFinance } from '@/lib/finance/store'
import type { UserProfile } from '@/lib/finance/types'
import { Button } from '@/components/ui/button'
import { Field, PageHeader, Panel, PanelHeader, SelectInput, TextInput, Toggle } from '../primitives'

const PREFERENCES: { key: 'notifications' | 'weeklySummary' | 'aiAutoCategorize'; title: string; text: string }[] = [
  { key: 'notifications', title: 'Alertas de vencimento', text: 'Avisar 3 dias antes do vencimento das faturas.' },
  { key: 'weeklySummary', title: 'Resumo semanal', text: 'Receber um resumo por e-mail toda segunda-feira.' },
  { key: 'aiAutoCategorize', title: 'Categorização automática', text: 'Permitir que a IA sugira categorias nos lançamentos.' },
]

export function ProfileView() {
  const { user, updateUser, signOut } = useFinance()
  const [draft, setDraft] = useState<UserProfile | null>(user)
  const [saved, setSaved] = useState(false)
  if (!user || !draft) return null

  const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => setDraft({ ...draft, [key]: value })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft) return
    updateUser(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const initials = draft.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Perfil"
        title="Sua conta"
        description="Gerencie seus dados pessoais, metas e preferências."
        action={
          <div className="flex items-center gap-3">
            <span role="status" aria-live="polite" className="text-[13px] text-primary">
              {saved && (
                <span className="flex items-center gap-1.5 animate-in fade-in">
                  <Check className="size-4" aria-hidden="true" /> Alterações salvas
                </span>
              )}
            </span>
            <Button type="submit" className="h-10 rounded-xl px-5">
              Salvar alterações
            </Button>
          </div>
        }
      />

      <Panel className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-foreground text-lg font-semibold text-background">
          {initials}
        </span>
        <div className="flex-1">
          <p className="text-lg font-semibold tracking-tight">{draft.name}</p>
          <p className="text-sm text-muted-foreground">{draft.email}</p>
        </div>
        <Button type="button" variant="outline" onClick={signOut} className="h-10 rounded-xl px-4">
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </Button>
      </Panel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Dados pessoais" description="Informações básicas da sua conta" />
          <div className="flex flex-col gap-5 p-6">
            <Field label="Nome completo" htmlFor="p-name">
              <TextInput id="p-name" value={draft.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
            </Field>
            <Field label="E-mail" htmlFor="p-email">
              <TextInput id="p-email" type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
            </Field>
            <Field label="Telefone" htmlFor="p-phone">
              <TextInput
                id="p-phone"
                type="tel"
                value={draft.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(11) 90000-0000"
                autoComplete="tel"
              />
            </Field>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Metas financeiras" description="Usadas nas análises e projeções" />
          <div className="flex flex-col gap-5 p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Renda mensal esperada (R$)" htmlFor="p-income">
                <TextInput
                  id="p-income"
                  inputMode="numeric"
                  className="tabular"
                  value={draft.monthlyIncomeGoal}
                  onChange={(e) => set('monthlyIncomeGoal', Number(e.target.value.replace(/\D/g, '')) || 0)}
                />
              </Field>
              <Field label="Meta de economia (R$)" htmlFor="p-savings">
                <TextInput
                  id="p-savings"
                  inputMode="numeric"
                  className="tabular"
                  value={draft.savingsGoal}
                  onChange={(e) => set('savingsGoal', Number(e.target.value.replace(/\D/g, '')) || 0)}
                />
              </Field>
            </div>
            <Field label="Dia de início do mês financeiro" htmlFor="p-start" hint="Útil se você recebe o salário em um dia específico.">
              <SelectInput id="p-start" value={draft.monthStartDay} onChange={(e) => set('monthStartDay', Number(e.target.value))}>
                {[1, 5, 10, 15, 20, 25].map((d) => (
                  <option key={d} value={d}>
                    Dia {d}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Preferências" description="Personalize como o EqualizAI funciona para você" />
        <ul className="flex flex-col divide-y divide-border/70 px-6 pb-2 pt-3">
          {PREFERENCES.map((pref) => (
            <li key={pref.key} className="flex items-center justify-between gap-6 py-4">
              <div>
                <label htmlFor={`pref-${pref.key}`} className="text-sm font-medium">
                  {pref.title}
                </label>
                <p className="mt-0.5 text-sm text-muted-foreground">{pref.text}</p>
              </div>
              <Toggle
                id={`pref-${pref.key}`}
                label={pref.title}
                checked={draft[pref.key]}
                onChange={(v) => set(pref.key, v)}
              />
            </li>
          ))}
        </ul>
      </Panel>
    </form>
  )
}
