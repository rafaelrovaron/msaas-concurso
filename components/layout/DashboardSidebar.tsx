'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardSidebar() {
    const pathname = usePathname()

    const linkClass = (path: string) =>
        `block px-4 py-2 rounded-lg text-sm transition ${pathname === path
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`

    return (
        <aside className="w-64 bg-white border-r border-gray-100 p-6">

            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900">
                    Dashboard
                </h2>
            </div>

            <nav className="space-y-2">
                <Link href="/dashboard" className={linkClass('/dashboard')}>
                    Início
                </Link>

                <Link href="/dashboard/profile" className={linkClass('/dashboard/profile')}>
                    Perfil
                </Link>

                <Link href="/dashboard/settings" className={linkClass('/dashboard/settings')}>
                    Configurações
                </Link>
            </nav>

        </aside>
    )
}
