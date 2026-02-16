'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useEffect, useState } from 'react'

export default function Header() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser()
            setUser(data.user)
        }

        getUser()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <header className="w-full border-b border-gray-100 bg-white">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link
                    href="/"
                    className="text-lg font-semibold text-gray-900"
                >
                    MeuApp
                </Link>

                {/* Navegação */}
                <nav className="flex items-center gap-6 text-sm">
                    {user ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="text-gray-600 hover:text-gray-900 transition"
                            >
                                Dashboard
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="text-gray-600 hover:text-gray-900 transition"
                            >
                                Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-gray-600 hover:text-gray-900 transition"
                            >
                                Entrar
                            </Link>

                            <Link
                                href="/signup"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                Criar conta
                            </Link>
                        </>
                    )}
                </nav>

            </div>
        </header>
    )
}
