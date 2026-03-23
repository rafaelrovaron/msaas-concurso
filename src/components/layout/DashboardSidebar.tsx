'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const sections = [
  {
    title: 'Estudo',
    items: [
      { href: '/dashboard', label: 'Painel', description: 'Resumo e proximos passos' },
      { href: '/dashboard/exams', label: 'Provas', description: 'Simulados completos' },
      { href: '/dashboard/study', label: 'Customizada', description: 'Monte por disciplina' },
    ],
  },
  {
    title: 'Desempenho',
    items: [{ href: '/dashboard/progress', label: 'Progresso', description: 'Acompanhe sua evolucao' }],
  },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === path
    }

    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <aside className="w-full shrink-0 border-b border-white/60 bg-white/75 backdrop-blur lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-80 lg:border-b-0 lg:border-r">
      <div className="px-4 py-5 sm:px-6 lg:px-6 lg:py-8">
        <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-lg shadow-slate-950/10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/80">
            Concurso Boost
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Seu plano de estudo</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Use o painel para manter ritmo, acompanhar seus erros e retomar a proxima prova sem
            perder contexto.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {section.title}
              </p>

              <nav className="mt-3 space-y-2">
                {section.items.map((item) => {
                  const active = isActive(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'block rounded-2xl border px-4 py-3 transition',
                        active
                          ? 'border-sky-200 bg-sky-50 text-slate-950 shadow-sm'
                          : 'border-transparent bg-transparent text-slate-600 hover:border-white/70 hover:bg-white/70 hover:text-slate-900'
                      )}
                    >
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className={cn('mt-1 text-xs', active ? 'text-slate-600' : 'text-slate-500')}>
                        {item.description}
                      </div>
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-sm text-slate-600 shadow-sm">
          Revise primeiro as questoes erradas e nao respondidas. Esse ciclo costuma gerar ganho
          rapido de desempenho.
        </div>
      </div>
    </aside>
  )
}
