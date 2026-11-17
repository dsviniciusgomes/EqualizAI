'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Sparkles, TrendingUp, CreditCard } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { Field, Segmented, TextInput } from './primitives'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'

type Mode = 'entrar' | 'cadastro'

export function AuthScreen({ initialError = '' }: { initialError?: string }) {
  const [mode, setMode] = useState<Mode>('entrar')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(initialError)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Informe um e-mail válido.')
    if (password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.')
    if (mode === 'cadastro' && name.trim().length < 2) return setError('Informe seu nome.')
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const auth = getSupabaseClient().auth
      const result =
        mode === 'entrar'
          ? await auth.signInWithPassword({ email, password })
          : await auth.signUp({ email, password, options: { data: { full_name: name.trim() } } })

      if (result.error) throw result.error
      if (!result.data.session) {
        setNotice('Cadastro realizado. Confira seu e-mail para confirmar a conta antes de entrar.')
        return
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Não foi possível autenticar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-border/70 bg-card lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo />
        <div className="max-w-md">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Organize. Equilibre. Evolua.</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-balance">
            Seus lançamentos em equilíbrio.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground text-pretty">
            Reúna receitas, despesas, contas, cartões e planejamento financeiro em um só lugar, com uma visão clara e
            organizada da sua vida financeira.
          </p>
          <ul className="mt-10 flex flex-col gap-4">
            {[
              { icon: Sparkles, title: 'Lançamentos com IA', text: '“Gastei 45 no mercado com o cartão.”' },
              { icon: TrendingUp, title: 'Previsão de saldo', text: 'Projeção para os próximos 6 meses.' },
              { icon: CreditCard, title: 'Cartões e parcelas', text: 'Faturas e compras parceladas sob controle.' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} EqualizAI · Suas finanças em equilíbrio.
        </p>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 size-[420px] rounded-full bg-primary/6 blur-3xl"
        />
      </aside>

      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {mode === 'entrar' ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === 'entrar'
              ? 'Entre no EqualizAI e acompanhe suas finanças com clareza.'
              : 'Comece a equilibrar suas finanças em menos de um minuto.'}
          </p>

          <div className="mt-8">
            <Segmented
              label="Modo de acesso"
              value={mode}
              onChange={(v) => {
                setMode(v)
                setError('')
                setNotice('')
              }}
              options={[
                { value: 'entrar', label: 'Entrar' },
                { value: 'cadastro', label: 'Criar conta' },
              ]}
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5" noValidate>
            {mode === 'cadastro' && (
              <Field label="Nome completo" htmlFor="name">
                <TextInput id="name" name="name" autoComplete="name" placeholder="Ana Souza" />
              </Field>
            )}
            <Field label="E-mail" htmlFor="email">
              <TextInput id="email" name="email" type="email" autoComplete="email" placeholder="voce@email.com" />
            </Field>
            <Field label="Senha" htmlFor="password">
              <div className="relative">
                <TextInput
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
                  placeholder="Mínimo de 6 caracteres"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            {mode === 'entrar' && (
              <div className="-mt-1 flex justify-end">
                <button type="button" className="text-[13px] font-medium text-primary hover:underline">
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <p role="alert" aria-live="polite" className="min-h-5 text-[13px] text-destructive">
              {error}
            </p>
            {notice && (
              <p role="status" aria-live="polite" className="-mt-4 text-[13px] text-primary">
                {notice}
              </p>
            )}

            <Button type="submit" disabled={loading} className="-mt-3 h-11 rounded-xl text-sm font-medium">
              {loading ? 'Carregando…' : mode === 'entrar' ? 'Entrar' : 'Criar conta'}
              {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
            </Button>
          </form>

          <p className="mt-8 text-center text-[13px] text-muted-foreground">
            {mode === 'entrar' ? 'Ainda não tem conta? ' : 'Já possui uma conta? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'entrar' ? 'cadastro' : 'entrar')}
              className="font-medium text-primary hover:underline"
            >
              {mode === 'entrar' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}
