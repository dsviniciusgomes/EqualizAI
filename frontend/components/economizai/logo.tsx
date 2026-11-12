import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M6 9.5h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M6 14.5h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="9" cy="9.5" r="2" fill="currentColor" />
      <circle cx="15" cy="14.5" r="2" fill="currentColor" />
    </svg>
  )
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-[0_2px_8px_-2px] shadow-primary/40">
        <LogoMark className="size-[18px]" />
      </span>
      {compact ? (
        <span className="sr-only">EqualizAI</span>
      ) : (
        <span className="text-[17px] font-semibold tracking-tight text-foreground">
          Equaliz<span className="text-primary">AI</span>
        </span>
      )}
    </div>
  )
}
