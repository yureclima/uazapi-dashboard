import { createClient } from '@/lib/supabase/server'
import { uazapi } from '@/lib/uazapi'
import ConnectionList from '@/components/dashboard/ConnectionList'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ConnectionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Buscar perfil para checar role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    // 1. Buscar todas as instâncias da Uazapi
    let uazapiInstances: any[] = []
    try {
        uazapiInstances = await uazapi.fetchInstances() || []
    } catch (e) {
        console.error('Falha ao buscar instâncias na Uazapi:', e)
    }

    // 2. Buscar conexões registradas no Supabase
    const { data: dbConnections, error } = await supabase
        .from('connections')
        .select(`
            *,
            team:teams (
                id,
                name
            )
        `)

    if (error) {
        return (
            <div className="p-8 text-center bg-red-900/20 border border-red-500/30 rounded-xl">
                <p className="text-red-400 font-medium">Erro ao carregar banco de dados</p>
                <p className="text-red-500/60 text-xs mt-1">{error.message}</p>
                <p className="text-gray-500 text-xs mt-4 italic">
                    Dica: Verifique se a tabela 'teams' existe e se a coluna 'team_id' foi adicionada em 'connections'.
                </p>
            </div>
        )
    }

    // 3. Lógica de Mesclagem: Mostrar TUDO que está na Uazapi
    const connections = uazapiInstances.map((uInstance: any) => {
        // Normalizar dados da Uazapi baseando-se no print: 
        // A API parece retornar um objeto que pode ter 'instance' ou propriedades diretas
        const name = uInstance.name || uInstance.instanceName || uInstance.instance?.instanceName || (typeof uInstance === 'string' ? uInstance : 'Desconhecida');
        const status = uInstance.status || uInstance.instance?.status || (uInstance.connected ? 'connected' : 'disconnected');

        // Tradução de status para o UI
        const normalizedStatus = (status === 'connected' || status === 'open') ? 'open' : 'disconnected';
        const profilePicUrl = uInstance.profilePicUrl || uInstance.instance?.profilePicUrl || uInstance.avatar || null;

        // Tentativa de extrair token (hash)
        const token = uInstance.token || uInstance.hash || uInstance.instance?.token || uInstance.AuthToken || null;

        // Tentar encontrar registro correspondente no Supabase
        const dbMatching = dbConnections.find(c => c.instance_name === name);

        return {
            id: dbMatching?.id || `temp-${name}`,
            instance_name: name,
            profilePicUrl: profilePicUrl,
            user_id: dbMatching?.user_id || (isAdmin ? 'unassigned' : user.id),
            status: normalizedStatus,
            is_registered: !!dbMatching,
            token: token,
            team_id: dbMatching?.team_id || null,
            team_name: dbMatching?.team?.name || null
        }
    })

    // LÓGICA DE FILTRO:
    // 1. Admin vê TUDO (connections sem filtro).
    // 2. Usuário comum vê apenas o que o RLS do banco permitiu (dbConnections).
    const filteredConnections = isAdmin ? connections : connections.filter(c => c.is_registered);

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Gerenciador de Conexões</h1>
                <p className="text-gray-400">Gerencie suas instâncias do WhatsApp Business (Sincronizado com Uazapi).</p>
            </div>

            <ConnectionList initialConnections={filteredConnections} />
        </div>
    )
}
