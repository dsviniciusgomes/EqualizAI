'use client'

import { LayoutGrid, LogOut, PlusCircle, UserRound } from 'lucide-react'
import { useFinance, type ViewId } from '@/lib/finance/store'
import { longMonth } from '@/lib/finance/format'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { DashboardView } from './views/dashboard-view'
import { TransactionsView } from './views/transactions-view'
import { ProfileView } from './views/profile-view'

const NAV: { id: ViewId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutGrid },
  { id: 'lancamentos', label: 'Lançamentos', icon: PlusCircle },
  { id: 'perfil', label: 'Perfil', icon: UserRound },
]

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')
}

export function AppShell() {
  const { view, setView, user, signOut, today, authError } = useFinance()
  if (!user) return null

  return (
    <div className="min-h-dvh lg:pl-[264px]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-border/70 bg-sidebar px-4 py-6 lg:flex">
        <div className="px-3">
          <Logo />
        </div>
        <nav aria-label="Navegação principal" className="mt-10 flex flex-col gap-1">
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
            Menu
          </p>
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = view === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'size-[18px] transition-transform duration-200 group-hover:scale-105',
                    active ? 'text-primary' : '',
                  )}
                  aria-hidden="true"
                />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-border/70 bg-background p-4">
          <p className="text-xs text-muted-foreground">Período ativo</p>
          <p className="mt-1 text-sm font-medium">{longMonth(today)}</p>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sair da conta"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/85 px-5 backdrop-blur-md lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setView('perfil')}
          aria-label="Abrir perfil"
          className="flex size-9 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background"
        >
          {initials(user.name)}
        </button>
      </header>

      <main className="mx-auto w-full max-w-[1240px] px-5 pb-28 pt-8 sm:px-8 lg:px-12 lg:pb-16 lg:pt-12">
        {authError && (
          <p role="alert" className="mb-5 text-sm text-destructive">
            {authError}
          </p>
        )}
        <div key={view} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          {view === 'dashboard' && <DashboardView />}
          {view === 'lancamentos' && <TransactionsView />}
          {view === 'perfil' && <ProfileView />}
        </div>
      </main>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-between rounded-2xl border border-border/70 bg-card/95 p-1.5 shadow-[0_8px_30px_-12px_rgba(16,24,40,0.18)] backdrop-blur-md lg:hidden"
      >
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-colors',
                active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-[18px]" aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
