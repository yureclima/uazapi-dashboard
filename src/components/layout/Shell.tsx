'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Smartphone, Users, Settings, LogOut, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

const baseNavigation = [
    { name: 'Conexões', href: '/dashboard/connections', icon: Smartphone },
    { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardShell({
    children,
    userRole
}: {
    children: React.ReactNode
    userRole?: string
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const navigation = [...baseNavigation]
    if (userRole === 'admin') {
        navigation.splice(1, 0, { name: 'Times', href: '/dashboard/teams', icon: Users })
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    return (
        <div className="flex h-screen bg-gray-950 text-gray-100">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={clsx(
                    'fixed inset-y-0 left-0 z-50 w-72 transform border-r border-gray-800 bg-gray-950 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex h-16 items-center justify-between px-6 border-b border-gray-800">
                    <span className="text-xl font-bold tracking-tight text-indigo-400">
                        Uazapi
                    </span>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-md p-1 hover:bg-gray-800 lg:hidden"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex flex-1 flex-col justify-between p-4">
                    <ul className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={clsx(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-indigo-500/10 text-indigo-400'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.name}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>

                    <div className="border-t border-gray-800 pt-4">
                        <button
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            Sair
                        </button>
                    </div>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950 px-4 lg:px-8">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-gray-400 hover:text-white lg:hidden"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex items-center gap-4">
                        {/* Header actions (Profile, etc.) */}
                        <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 border border-indigo-500/30">
                            {userRole === 'admin' ? 'ADM' : 'USR'}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-gray-950 p-4 lg:p-8">
                    <div className="mx-auto max-w-6xl">{children}</div>
                </main>
            </div>
        </div>
    )
}
