import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTeamsAction, getProfilesAction } from '@/app/actions/team-actions'
import TeamsList from '@/components/dashboard/TeamsList'

export default async function TeamsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check Admin Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center min-h-[60vh]">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Acesso Negado</h1>
                <p className="text-gray-400">Esta área é restrita para administradores.</p>
                <a href="/dashboard/connections" className="mt-6 text-indigo-400 hover:text-indigo-300 underline">
                    Voltar para Conexões
                </a>
            </div>
        )
    }

    // Fetch Teams and Profiles
    const teams = await getTeamsAction()
    const profiles = await getProfilesAction()

    return (
        <div className="space-y-6">
            <div className="mb-8 border-b border-gray-800 pb-4">
                <h1 className="text-2xl font-bold text-white">Gestão de Times</h1>
                <p className="text-gray-400 text-sm mt-1">
                    Crie times e organize membros para compartilhar acesso às instâncias.
                </p>
            </div>

            <TeamsList
                teams={teams.data || []}
                availableProfiles={profiles.data || []}
            />
        </div>
    )
}
